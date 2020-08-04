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
const debug = _debug('app:dbcached:mqExpire');
import type from '../../utils/type';
import { SEPARATOR, getRedisKey, parseRedisKey } from './redisKey';
import $r from '../redis/redis';
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
} from '../dbmongo/ops';
import { EX_SECONDS } from './ops';
import Bull from 'bull';
import { cfg } from './_base';

let redisUrl = cfg.redis;
/// Bull队列.
const BULL_REDIS_UPDATE_KEY_QUEUE = 'redis-update-key-queue';
debug('创建Bull队列:' + BULL_REDIS_UPDATE_KEY_QUEUE, ', redis=' + redisUrl);
const redisUpdateKeyQueue = new Bull(BULL_REDIS_UPDATE_KEY_QUEUE, redisUrl);
// 2. 绑定任务处理函数
redisUpdateKeyQueue.process(async (job, done) => {
  let data = job.data;
  debug(`redisUpdateKeyQueue process ${job.id}, data:${JSON.stringify(data)}`);
  // debug('redisUpdateKeyQueue process', data);
  let result = false;
  try {
    result = await timelyCheck(data);
  } catch (error) {
    debug('error! redisUpdateKeyQueue process!', error);
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
  redisUpdateKeyQueue.on(evt, (job, ...other) => {
    if (evt == 'progress') {
      debug(`${evt} Job ${job.id} is ${other[0] * 100}% ready!`);
    } else if (evt == 'waiting') {
      debug(`${evt} Job ${job}`);
    } else if (evt == 'failed') {
      debug(`${evt} Job ${job.id}, err ${other[0]}`);
    } else debug(`${evt} Job ${job && job.id}!`);
  })
);

// redisUpdateKeyQueue.on('completed', (job, result) => {
//   debug(`Job ${job.id} completed with result ${result}`);
// });
// redisUpdateKeyQueue.on('progress', (job, progress) => {
//   debug(`Job ${job.id} is ${progress * 100}% ready!`);
// });
// redisUpdateKeyQueue.on('error', function(error) {
//   debug('error', error);
// })

// redisUpdateKeyQueue.on('waiting', function(jobId){
//   debug(`waiting Job ${jobId} !`);
//   // A Job is waiting to be processed as soon as a worker is idling.
// });

// redisUpdateKeyQueue.on('active', function(job, jobPromise){
//   debug(`active Job ${job.id} !`);
//   // A job has started. You can use `jobPromise.cancel()`` to abort it.
// })

// redisUpdateKeyQueue.on('stalled', function(job){
//   debug(`stalled Job ${job.id} !`);
//   // A job has been marked as stalled. This is useful for debugging job
//   // workers that crash or pause the event loop.
// })

// redisUpdateKeyQueue.on('failed', function(job, err){
//   debug(`failed Job ${job.id}, err ${err} !`);
//   // A job failed with reason `err`!
// })

// redisUpdateKeyQueue.on('paused', function(){
//   debug(`paused`);
//   // The queue has been paused.
// })

// redisUpdateKeyQueue.on('resumed', function(job){
//   debug(`resumed Job ${job.id}!`);
//   // The queue has been resumed.
// })

// redisUpdateKeyQueue.on('cleaned', function(jobs, type) {
//   debug(`cleaned!`);
//   // Old jobs have been cleaned from the queue. `jobs` is an array of cleaned
//   // jobs, and `type` is the type of jobs cleaned.
// });

// redisUpdateKeyQueue.on('drained', function() {
//   debug(`drained!`);
//   // Emitted every time the queue has processed all the waiting jobs (even if there can be some delayed jobs not yet processed)
// });

// redisUpdateKeyQueue.on('removed', function(job){
//   debug(`removed Job ${job.id}!`);
//   // A job successfully removed.
// });

// // 3. 添加任务
// const job = await redisUpdateKeyQueue.add({
//   foo: 'bar'
// });

export const REDIS_UPDATE_ACTION = {
  CREATE_ONE: 1,
  UPDATE_ONE: 2,
  REMOVE_ONE: 3,
  CREATE_MANY: 4,
  UPDATE_MANY: 5
};
export const REDIS_UPDATE_EVENT_KEY = 'redis_update_event_set'; // 第一级:事件集合
export const REDIS_UPDATE_SET_KEY = 'redis_update_key_set'; // 第二级: s型key集合
export const REDIS_UPDATE_SET_CKEY = 'redis_update_ckey_set'; // 第二级: c型key集合

/**
 * 首先将触发的事件写入event集合,后续解析得到key进入key集合.
 * @param {string} model 表名
 * @param {integer} action 触发的行为,见上表.
 * @param {array/string} ids 影响的id列表,可以为空.
 */
export async function emitRedisUpdateEvent(model, action, ids) {
  let timestamp = new Date().getTime();
  let item = { model, action, ids };
  let result = await $r.zaddAsync(
    REDIS_UPDATE_EVENT_KEY,
    timestamp,
    JSON.stringify(item)
  );

  const job = await redisUpdateKeyQueue.add({
    action
  });
  debug(`emitRedisUpdateEvent create job ${job.id}`, { type: 1, action });
  // debug('emitRedisUpdateEvent create job', { type: 1, action, job });

  return result;
}

/**
 * 遍历REDIS_UPDATE_EVENT_KEY有序集合(找最旧的,一个个处理),处理后更新到REDIS_UPDATE_SET_KEY集合中.
 * 首先遍历REDIS_UPDATE_EVENT_KEY的原因是,减少重复键值处理量.
 * 找REDIS_UPDATE_SET_KEY中最旧的一个key,进行更新.
 * 下次遍历继续进行.
 */
export async function timelyCheck() {
  // 1. 遍历REDIS_UPDATE_EVENT_KEY
  let count = await $r.zcardAsync(REDIS_UPDATE_EVENT_KEY);
  while (count > 0) {
    //  ZRANGE salary 0 -1 WITHSCORES
    let result = await $r.zrangeAsync(
      REDIS_UPDATE_EVENT_KEY,
      0,
      0,
      'withscores'
    );
    debug('timelyCheck', REDIS_UPDATE_EVENT_KEY, result);
    if (result && result.length > 0) {
      await $r.zremAsync(REDIS_UPDATE_EVENT_KEY, result[0]);
      let event = JSON.parse(result[0]);
      await dealEvent(event);
    }
    // 继续下一步,看是否取完.
    count = await $r.zcardAsync(REDIS_UPDATE_EVENT_KEY);
  }

  // 2. 找REDIS_UPDATE_SET_KEY中最旧的一个key,进行更新.
  let result = await $r.zrangeAsync(REDIS_UPDATE_SET_KEY, 0, 0, 'withscores');
  debug('timelyCheck', REDIS_UPDATE_SET_KEY, result);
  if (result && result.length > 0) {
    await $r.zremAsync(REDIS_UPDATE_SET_KEY, result[0]);
    await dealSKey(result[0]);
  }

  // 3. 如果REDIS_UPDATE_SET_KEY中还有键值,则继续插入事务队列.
  count = await $r.zcardAsync(REDIS_UPDATE_SET_KEY);
  if (count > 0) {
    // 4. 添加任务
    const job = await redisUpdateKeyQueue.add({
      count
    });
    debug(`timelyCheck create job ${job.id}`, { type: 2, count });
  }
  debug('timelyCheck finish!');
  return true;
}

/**
 * 当增加,删除,更新操作发生时,需要更新相关model的s型查询操作,
 * 调用此方法,将需更新s型键值插入到更新队列redis_update_key_set.
 * 注意:考虑到效率,需要去掉{_id:xxxx}型查询,但注意{_id:{'$not':xxxx}}型是不能去掉.
 * @param {string} model 表名
 * @param {integer} action 触发的行为,见上表.
 * @param {array/string} ids 影响的id列表,可以为空.
 */
export async function dealEvent(event) {
  let { model, action, ids } = event;
  if (ids) {
    let typeofids = type(ids);
    if (typeofids !== 'array') ids = [ids];
  }

  // 1. 查询出所有此model的c型key.
  // 2. 去除c:{_id:xxxx}型key.
  // 3. 将剩下的key插入到有序集合redis_update_key_set中.
  let r_key_prefix = model + SEPARATOR + 'c';
  let r_keys = await $r.keysAsync(r_key_prefix + '*');
  debug('dealEvent r_keys', r_key_prefix, r_keys);
  let result = [];
  let reg_s_is_id = new RegExp(
    `${r_key_prefix}${SEPARATOR}{"_id":"[a-z,A-Z,0-9]*"}`
  );
  let timestamp = new Date().getTime();
  for (let i = 0; i < r_keys.length; i++) {
    let r_key = r_keys[i];
    if (reg_s_is_id.test(r_key)) {
      // TODO: 此类c型key不插入队列: "mark:c:{\"_id\":\"5d80e2d881991576923ccd7e\"}"
      // TODO: 注意,经测试,发现一般会先查询某个id记录是否存在,导致出现c-key,且内容为0.
      // TODO: 如果这里不处理,将导致新创建的这条记录找不到.
      // 目前做了简单判断,影响到的_id都处理更新.
      let keyFound = false;
      for (let j = 0; j < ids.length; j++) {
        if (r_key.indexOf(ids[j]) >= 0) {
          keyFound = true;
          break;
        }
      }
      if (!keyFound) {
        continue;
      }
    }
    result.push(timestamp);
    result.push(r_key);
  }
  if (result.length > 0) {
    // debug('zaddAsync ' + REDIS_UPDATE_SET_KEY, model, action, ids, result);
    await $r.zaddAsync(REDIS_UPDATE_SET_KEY, ...result);
  }
  return result;
}

/**
 * 处理某个c型key的更新及其对应s型key的更新.
 * 注意: 当c型key的值为0时,对应s型key是不存在的.
 * @param {string} r_ckey redis中c型查询key.
 */
export async function dealSKey(r_ckey) {
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
  await $r.setexAsync(key_c, EX_SECONDS, data_c);

  let r_skey = getRedisKey(model, 's', s_query.where, s_query.sort);
  // 获取所有内容,ZRANGE key start stop [WITHSCORES]
  let result = await $r.zrangeAsync(r_skey, 0, -1, 'withscores');
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
  debug('dealSKey get query region:', r_skey, arr);

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
          let resultTmp = await $r.setexAsync(
            key_d,
            EX_SECONDS,
            JSON.stringify(item)
          );
          debug('dealRedisUpdate setAsync', resultTmp, key_d);
        }
      }

      // 删除分数区间的内容. ZREMRANGEBYSCORE key min max
      let resultTmp = await $r.zremrangebyscoreAsync(
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
        resultTmp = await $r.zaddAsync(r_skey, ...argsArray);
        debug('dealRedisUpdate zaddAsync result:', r_skey, resultTmp);
        await $r.expireAsync(r_skey, EX_SECONDS);
      }
    }
  }
  return true;
}
