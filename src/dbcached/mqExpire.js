/**
 * redis缓存更新队列.
 * 当数据中有数据插入,删除,更新时,原来的各种查询将不再准确.所以需要更新其中内容.
 * 我们分情况讨论:
 * 1. _createOne/_createMany,所有与此model相关的s,c型数据需要更新,
 * 2. _deleteOne,所有与此model相关的s型数据中有此_id的数据均要删掉此_id,并且更新相关的c型键
 * 3. _updateOne/_updateMany,所有与此model相关的s,c型数据需要更新,
 * TODO: 感觉上缺一个_deleteMany().
 * TODO: _updateMany()返回的是更新的条数,不是更新后的内容列表.所以,redis中相关数据是老数据,怎么处理?
 *
 * 前提: 假设redis中d型数据与mongodb中一致,我们考虑更新s型数据的情况.
 * 具体方法1为:(本考虑用队列,但其实是集合比较好,因为集合中数据不会重复)
 * 1. 将要更新的s型key插入集合,并同时打印当前集合内容.
 * 2. 另有一个队列,实时取出内容,并做更新
 *  + 解析key值为where和sort条件,
 *  + 计算得到c键的键名c-key,并获取其键值data_c.
 *  + 利用zrange(s-key,0,data_c,withscores)得到s-key的所有内容及相关score值.
 *  + 分析scores的连续区间段,根据区间段去查询相关数据,更新到s-key中,全部段更新完后,更新c-key的值.
 *  + 完成更新
 * 方法2为: 直接更新c-key的内容,即更新新的数据总条目,s-key中有重复或漏掉均不管.
 * 方法3为: 首先更新c-key的内容,并将所有该model的s-key全部复制一份,称为过时的,
 *          后续的查询中首先检查所查询的那页数据有没有过时,过时则进行数据库查询,
 *          并从过时key中删掉过时的那部分.如果没有过时的或者过时key不存在,则继续原步骤.
 */
import _debug from 'debug';
const debug = _debug('yh:mongo:dbcached:mqExpire');
import type from '../utils/type';
import { SEPARATOR, getRedisKey, parseRedisKey } from './redisKey';
import { itemFulfillQuery } from './query';
import { $r, $b } from './redis';
import {
  // _retrieve as _dbRetrieve,
  _retrieveNoTotal as _dbRetrieveNoTotal,
  _count as _dbCount
  // _createOne as _dbCreateOne,
  // _deleteOne as _dbDeleteOne,
  // _updateOne as _dbUpdateOne,
  // _createMany as _dbCreateMany,
  // _updateMany as _dbUpdateMany,
  // _deleteOneById as _dbDeleteOneById,
  // _updateOneById as _dbUpdateOneById,
  // _findOne as _dbFindOne,
  // _findOneById as _dbFindOneById
} from '../ops';
import { EX_SECONDS } from './ops';

/// Bull队列.
// 2. 绑定任务处理函数
export function initExpire() {
  $b().process(async (job, done) => {
    let data = job.data;
    debug(`$b() process ${job.id}, data:${JSON.stringify(data)}`);
    // debug('$b() process', data);
    let result = false;
    try {
      result = await timelyCheck(data);
    } catch (error) {
      debug('error! $b() process!', error);
    }

    done();
    // job.moveToCompleted();
    // await job.finished();
    return result;
  });
  [
    'completed',
    'progress',
    'error',
    'waiting',
    'active',
    'stalled',
    'failed',
    'paused',
    'resumed',
    'cleaned',
    'drained',
    'removed'
  ].map(evt =>
    $b().on(evt, (job, ...other) => {
      if (evt == 'progress') {
        debug(`${evt} Job ${job.id} is ${other[0] * 100}% ready!`);
      } else if (evt == 'waiting') {
        debug(`${evt} Job ${job}`);
      } else if (evt == 'failed') {
        debug(`${evt} Job ${job.id}, err ${other[0]}`);
      } else debug(`${evt} Job ${job && job.id}!`);
    })
  );
}

// // 3. 添加任务
// const job = await redisUpdateKeyQueue.add({
//   foo: 'bar'
// });

export const REDIS_UPDATE_ACTION = {
  CREATE_ONE: 1,
  UPDATE_ONE: 2,
  REMOVE_ONE: 3,
  CREATE_MANY: 4,
  UPDATE_MANY: 5,
  UPDATE_ONE_PRE: 6,
  UPDATE_MANY_PRE: 7
};
const REDIS_UPDATE_EVENT_KEY = 'redis_update_event_set'; // 第一级:事件集合
const REDIS_UPDATE_SET_KEY = 'redis_update_key_set'; // 第二级: s型key集合
const REDIS_UPDATE_SET_CKEY = 'redis_update_ckey_set'; // 第二级: c型key集合

/**
 * 将{model,items} 相关的所有ckey及skey找到,删除,并加入队列等待后续自动更新.
 * 1. 找到所有model的ckey
 * 2. 找到所有能匹配这些items的ckey.
 * 3. 将所有这些ckey加前缀x-,用来与更新后的做比较.(删掉后,主动的查询将会发起实际的数据库查询,不再用缓存中)
 * 4. 将所有这些匹配的ckey放入队列中,等待后续查询.
 * @param {string} model 表名
 * @param {integer} action 触发的行为,见上表.
 * @param {array/string} ids 影响的id列表,可以为空.
 */
export async function emitRedisUpdateEvent(model, action, items) {
  debug('emitRedisUpdateEvent[1]', model, action, items);
  // 整理items成数组.
  if (items) {
    let typeofitems = type(items);
    if (typeofitems !== 'array') items = [items];
  }

  // 1. 查询出所有此model的c型key.
  let r_key_prefix = model + SEPARATOR + 'c';
  let r_keys = await $r().keysAsync(r_key_prefix + '*');
  debug('emitRedisUpdateEvent[2]', r_key_prefix, r_keys);
  // 2. 去除c:{_id:xxxx}型key.(这部分key不用变,增删时已经自动增删,更改时不用变化)
  let result1 = [];
  let reg_s_is_id = new RegExp(
    `${r_key_prefix}${SEPARATOR}{"_id":"[a-z,A-Z,0-9]*"}`
  );
  for (let i = 0; i < r_keys.length; i++) {
    let r_key = r_keys[i];
    if (reg_s_is_id.test(r_key)) {
      // 找到ckey:{_id:xxxx}型,主要为根据_id查单条记录.
      continue;
    }
    result1.push(r_key);
  }
  debug('emitRedisUpdateEvent[3]', result1);
  // 3. 找到查询条件能匹配items的ckey
  let result2 = [];
  for (let i = 0; i < result1.length; i++) {
    let r_key = result1[i];
    let s_query = parseRedisKey(r_key);
    let match = false;
    for (let j = 0; j < items.length; j++) {
      if (itemFulfillQuery(items[j], s_query.where)) {
        // 只要匹配到一个item,这个ckey就需要重新查询.
        match = true;
        break;
      }
    }
    if (match) {
      result2.push(r_key);
      continue;
    }
  }
  debug('emitRedisUpdateEvent[4]', result2);
  // 4. 将result2中ckey插入队列.
  let result3 = [];
  for (let i = 0; i < result2.length; i++) {
    result3.push(new Date().getTime());
    result3.push(result2[i]);
  }
  if (result3.length > 0) {
    debug('emitRedisUpdateEvent[5]', REDIS_UPDATE_SET_KEY, result3);
    await $r().zaddAsync(REDIS_UPDATE_SET_KEY, ...result3);
  }

  // 5. 将result2中所有ckey,skey加前缀'x-',表示为已删除
  // let s_key_prefix = model + SEPARATOR + 's';
  for (let i = 0; i < result2.length; i++) {
    let r_key = result2[i];
    await $r().renameAsync(r_key, 'x-' + r_key);
  }

  // 6. 在任务队列中增加一项.
  const job = await $b().add({
    action
  });
  debug(`emitRedisUpdateEvent[5] create job ${job.id}`, { type: 1, action });

  return result3;
}

/**
 * 遍历REDIS_UPDATE_EVENT_KEY有序集合(找最旧的,一个个处理),处理后更新到REDIS_UPDATE_SET_KEY集合中.
 * 首先遍历REDIS_UPDATE_EVENT_KEY的原因是,减少重复键值处理量.
 * 找REDIS_UPDATE_SET_KEY中最旧的一个key,进行更新.
 * 下次遍历继续进行.
 */
export async function timelyCheck() {
  // 2. 找REDIS_UPDATE_SET_KEY中最旧的一个key,进行更新.
  let result = await $r().zrangeAsync(REDIS_UPDATE_SET_KEY, 0, 0, 'withscores');
  debug('timelyCheck', REDIS_UPDATE_SET_KEY, result);
  if (result && result.length > 0) {
    await $r().zremAsync(REDIS_UPDATE_SET_KEY, result[0]);
    await dealCKey(result[0]);
  }

  // 3. 如果REDIS_UPDATE_SET_KEY中还有键值,则继续插入事务队列.
  let count = await $r().zcardAsync(REDIS_UPDATE_SET_KEY);
  if (count > 0) {
    // 4. 添加任务
    const job = await $b().add({
      count
    });
    debug(`timelyCheck create job ${job.id}`, { type: 2, count });
  }
  debug('timelyCheck finish!');
  return true;
}

/**
 * 处理某个c型key的更新及其对应s型key的更新.
 * 注意: 当c型key的值为0时,对应s型key是不存在的.
 * @param {string} r_ckey redis中c型查询key.
 */
export async function dealCKey(r_ckey) {
  // 1. 解析此key得到model,where,sort条件.
  // 2. 更新总条数c-key
  // 3. 得到此key中的连续score序列段. 比如: 0...100,103...113,156...176,则得到二维数组[[0,100],[103,113],[156,176]].
  // 4. 处理数据库查询,更新s-key和d-key,
  // TODO: 在这里对不同的的更新操作,可以有不同的处理.
  if (!r_ckey) {
    debug('error! r_ckey is null!');
    return false;
  }
  let s_query = parseRedisKey(r_ckey);
  let model = s_query.model;

  // 首先更新总数.
  let key_c = getRedisKey(model, 'c', s_query.where, s_query.sort);
  let data_c = await _dbCount(model, {
    where: s_query.where,
    sort: s_query.sort
  });
  await $r().setexAsync(key_c, EX_SECONDS, data_c);

  let r_skey = getRedisKey(model, 's', s_query.where, s_query.sort);
  // 获取所有内容,ZRANGE key start stop [WITHSCORES]
  let result = await $r().zrangeAsync(r_skey, 0, -1, 'withscores');
  if (!result || result.length == 0) {
    // no data in redis. nothing to deal!
    return true;
  }

  // debug('dealRedisUpdate s_query', r_skey, s_query, result);
  // 处理scores值,得到序列段.
  let arr = [];
  let start = 0;
  let prev = -1;
  for (let i = 0; i < result.length; i++) {
    if (i % 2 == 1) {
      let curr = parseInt(result[i]);
      if (!(curr - prev == 1 || curr - prev == 0)) {
        // 已中断,不再连续, 000011122223中间有相同的也算连续.
        arr.push([start, prev]);
        start = curr;
        prev = curr;
        continue;
      }
      if (i == result.length - 1) {
        // 结束了,将最后一段插入.
        arr.push([start, curr]);
        break;
      }
      prev = curr;
    }
  }
  debug('dealCKey get query region:', r_skey, arr);

  // 分段处理数据库查询,更新到redis,如果某段超过100条,则以100为单位分页查询更新.
  let page_count = 100;
  for (let i = 0; i < arr.length; i++) {
    let section = arr[i];
    let s_start = section[0];
    let s_stop = section[1];
    let s_count = s_stop - s_start + 1;
    let s_try = parseInt((s_count + page_count - 1) / page_count);
    for (let j = 0; j < s_try; j++) {
      // 分页查询并更新.
      let skip = s_start + page_count * j;
      let limit = page_count;
      if (j == s_try - 1) {
        // 最后一页,数量不够page_count,则用总条目-已处理条目.
        limit = s_count - j * page_count;
      }
      let options = { where: s_query.where, sort: s_query.sort, limit, skip };
      let result = await _dbRetrieveNoTotal(model, options);
      debug(
        'dealRedisUpdate _dbRetrieveNoTotal',
        { section, s_start, s_stop, s_count, s_try },
        model,
        options,
        result
      );

      // 将entity数据插入redis.
      let dbResult = result['result'];
      let dbFlatEntityMap = dbResult['entities'];
      let dbFlatResult = dbResult['result'];
      let dbFlatSkip = dbResult['skip'];
      if (!dbFlatSkip) dbFlatSkip = 0;

      // 遍历entity,设置d键.
      let collections = Object.getOwnPropertyNames(dbFlatEntityMap);
      for (let i = 0; i < collections.length; i++) {
        let nModel = collections[i];
        let collection = dbFlatEntityMap[nModel];
        let ids = Object.getOwnPropertyNames(collection);
        for (let j = 0; j < ids.length; j++) {
          let id = ids[j];
          let item = collection[id];
          let key_d = getRedisKey(nModel, 'd', id);
          let resultTmp = await $r().setexAsync(
            key_d,
            EX_SECONDS,
            JSON.stringify(item)
          );
          debug('dealRedisUpdate setAsync', resultTmp, key_d);
        }
      }

      // 删除分数区间的内容. ZREMRANGEBYSCORE key min max
      let resultTmp = await $r().zremrangebyscoreAsync(
        r_skey,
        dbFlatSkip,
        dbFlatSkip + limit - 1
      );
      debug('dealRedisUpdate zremrangebyscore result:', r_skey, resultTmp);
      // 更新数据到有序集合.
      let argsArray = [];
      for (let i = 0; i < dbFlatResult.length; i++) {
        argsArray.push(dbFlatSkip + i);
        argsArray.push(dbFlatResult[i]);
      }
      if (argsArray.length > 0) {
        debug('dealRedisUpdate zaddAsync', r_skey, argsArray);
        resultTmp = await $r().zaddAsync(r_skey, ...argsArray);
        await $r().expireAsync(r_skey, EX_SECONDS);
      }
    }
  }
  return true;
}
