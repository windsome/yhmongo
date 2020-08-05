/**
 * redis缓存版本数据库处理(对dbmongo/opsV2.js的缓存化)
 * 数据格式参见dbmongo/opsV2.js
 */
/**
 * 带redis缓存的mongodb数据操作,注意事项:
 * 1. 数据库映射
 * 2. 单表增删改查,不做关联表的查询. 关联表的查询分多次操作进行. (存疑???)
 * 3. 单表均有_id字段作为标识
 *
 * 增删改查中用到的redis-key,共有如下类型: key的类型: 单条数据d、列表数据s、单条查询w、条数查询c
 * 1. 单条数据d: key为"<模块名>_d:<_id>",值为json,使用hmset方式存入redis.
 *   如: { key: 'user_d:2', value: {id:2,...} }
 * 2. 列表数据s: retrieve获得，分两部分存储，实体和列表，列表是一个有序集合,内容为id数组,score为数据的排序,key为"<模块名>_s:<json_encode(查询条件)>"。如：
 *   列表值：{ key: 'product_s:{category:2}', value:[_id1,_id2,_id3,_id4,_id5]}
 *   数据值为上面单条d类型
 * 3. 单条查询w: getOne获得，分两部分存储，查询条件及id或id组合(与列表数据s差不多)。
 *   查询条件：{ key: 'product_s:{code:21232}', value:['2']}
 *   数据值为上面单条d类型
 * 4. 条数查询c: 与列表数据查询几乎一致，只是返回条数。
 *   例子: { key: 'product_c:{status:2}', value:'200'}
 *
 * 数据访问时序问题(包含redis中key删除更新时机问题.以下以product中_id为10为例)
 * 1. 查询单条记录(根据id查询或根据条件查询,id查询也会转成条件查询)
 *  + 首先从redis中找key为"product_s:{_id:10}"的值,找到则继续找key为"product_d:10"的值,找到则返回.
 *  + 未找到则从数据库中去找,找到就更新到redis中"product_s:{_id:10}"和"product_d:10",并返回.
 *  + 未从数据库中找到,则直接返回空.
 * 2. 创建记录.
 *  + 首先做参数检查,参数不合法直接退回.
 *  + 一些逻辑判断,比如是否可以创建,一般根据条件判断是否有相同的记录存在.(可调用上面查询单个接口)
 *  + 确认可以创建记录后,到数据库创建记录.
 *  + 查询刚创建的记录(调用上面查询单条记录方法,key自动会进入redis)
 *  + 返回记录.
 * 3. 更新记录(一般更新某一条id的记录).
 *  + 首先做参数检查,参数不合法直接退回.
 *  + 计算或整理得到查询条件{x:xxx1,y:yyy1,z:zzz1}.
 *  + 一些逻辑判断,比如是否可以更新,一般先获取原记录,判断字段权限等.(可调用上面查询单个接口)
 *  + 确认可以更新记录后,到数据库更新记录.
 *  + 将数据库中更新的记录*强制更新*到redis中.key为"product_d:10"和"product_s:{_id:10}"或"product_s:<查询条件>"
 *  + 返回记录
 * 4. 删除记录(一般删除某一条id的记录).
 *  + 首先做参数检查
 *  + 一些逻辑判断,比如是否可以删除,一般先获取原记录,判断权限等.(可调用上面查询单个接口)
 *  + 确认可以删除后,先删除redis中"product_d:10"或"product_s:<查询条件>"
 *  + 删除数据库中记录.
 * 5. 查询多条记录.
 *  + 首先做参数检查
 *  + 一些逻辑判断,比如判断权限,此人可显示字段等.
 *  + 计算或整理得到查询条件where:{x:xxx1,y:yyy1,z:zzz1},排序条件sort,populate信息,分页信息limit/skip,
 *  + 从redis中根据查询条件"product_s:{x:xxx1,y:yyy1,z:zzz1}"获取值,有则根据分页信息limit/skip及总数得到当前分页应该返回的内容.
 *  + 如果redis中没有相应内容,则进行数据库查询,并添加进product_s:{x:xxx1,y:yyy1,z:zzz1}有序集合中.
 *  + 返回结果数据.
 * 6. 批量更新记录(后台使用:根据条件更新一系列记录)
 * 7. 批量删除记录(后台使用:根据条件删除一系列记录)
 *
 * 数据查询的redis缓存穿透问题:
 * 某个时刻某个查询结果不在redis中,若此刻很多人同时请求此查询,则所有人都将直接查询数据库,这就是缓存穿透.
 * 而创建/更新/删除请求必然会进行到数据库层,并且一般都是一人操作,所以不会有此问题.
 * 穿透的情况:
 * 1. 突然间很多请求访问一个不存在redis键,触发频繁访问数据库.
 * 2.
 *
 * redis数据与mongodb中数据一致性问题:
 * 1. 当创建/删除时,在redis中的列表查询数据还是旧的,需要有一套机制更新这些查询.
 *  --- 相关模块的s型查询需要更新,如何更新?根据where和sort条件(是否要包含populate条件)构建查询,
 *  --- 遍历其中元素score值,将score范围内的值都更新
 * 2. 当更新数据时,redis中还是旧数据. ---更新完数据后,强制更新d类型相关id数据.
 *
 *
 */

import _debug from 'debug';
const debug = _debug('yh:mongo:dbcached:ops');
import type from '../utils/type';
import {
  _retrieve as _dbRetrieve,
  _count as _dbCount,
  _createOne as _dbCreateOne,
  _deleteOne as _dbDeleteOne,
  _updateOne as _dbUpdateOne,
  _createMany as _dbCreateMany,
  _updateMany as _dbUpdateMany,
  _deleteOneById as _dbDeleteOneById,
  _updateOneById as _dbUpdateOneById,
  _findOne as _dbFindOne,
  _findOneById as _dbFindOneById,
  _getFirstOfRetrieve as _dbGetFirstOfRetrieve,
  _mergeDbOfResult as _dbMergeDbOfResult
} from '../ops';
import { $r } from './redis';
import { getRedisKey } from './redisKey';
import { emitRedisUpdateEvent, REDIS_UPDATE_ACTION } from './mqExpire';

export const _getFirstOfRetrieve = _dbGetFirstOfRetrieve;
export const _mergeDbOfResult = _dbMergeDbOfResult;

// export const EX_SECONDS = 24 * 60 * 60; // 键过期默认秒数.
export const EX_SECONDS = 60 * 60; // 键过期默认秒数.

/**
 * 根据model和options得到数据.
 * @param {string} model
 * @param {object} options 内容为: { where, sort, select, limit:1, skip:0, populates }
 */
export async function _retrieve(model, options) {
  // 从redis中找相应的是否存在,且是否够用,够用则组装数据返回
  // + key为where和sort生成,data_c为总个数,data_s为redis有序集合,序号作为score.
  // + 根据skip和limit生成有序集合的取值范围[score1, score2),如果范围超出则取score2为data_c
  // + 用zcount key score1 score2-1,获取此区间成员数量,判断此数量是否已满足,满足则组装数据返回.
  // 否则,从数据库查询,并生成redis缓存,将数据返回.
  // let { where, sort, select, limit, skip, populates } = options || {};

  // 首先从redis缓存取数据.
  let result = await _retrieveFromRedis(model, options);
  if (result) {
    // 取到足够数据就返回,否则继续去数据库取,并更新进redis.
    return result;
  }

  // 缓存中没有相应的数据. 可能情况:
  // 1. 翻页时,未去获取此页数据.
  // 2. 数据库中删了数据,但c/s缓存还未来得及更新,导致最后一页的数据总是少于缓存中.
  result = await _dbRetrieve(model, options);

  // 两个主key
  let key_c = getRedisKey(model, 'c', options.where, options.sort);
  let key_s = getRedisKey(model, 's', options.where, options.sort);

  // 将entity数据插入redis.
  let dbResult = result['result'];
  let dbFlatEntityMap = dbResult['entities'];
  let dbFlatResult = dbResult['result'];
  let dbFlatTotal = dbResult['total'];
  let dbFlatLimit = dbResult['limit'];
  let dbFlatSkip = dbResult['skip'];
  let dbFlatCount = dbResult['count'];
  if (!dbFlatSkip) dbFlatSkip = 0;
  // 设置总数c键
  let resultTmp = await $r().setexAsync(key_c, EX_SECONDS, dbFlatTotal);
  debug('_retrieve setAsync result:', resultTmp);
  // 删除分数区间的内容. ZREMRANGEBYSCORE key min max
  resultTmp = await $r().zremrangebyscoreAsync(
    key_s,
    dbFlatSkip,
    dbFlatSkip + dbFlatResult.length - 1
  );
  debug('dealRedisUpdate zremrangebyscore result:', resultTmp, key_s);
  // // 设置s键,ZADD key score1 member1 [score2 member2]
  let argsArray = [];
  for (let i = 0; i < dbFlatResult.length; i++) {
    argsArray.push(dbFlatSkip + i);
    argsArray.push(dbFlatResult[i]);
  }
  if (argsArray.length > 0) {
    resultTmp = await $r().zaddAsync(key_s, ...argsArray);
    await $r().expireAsync(key_s, EX_SECONDS);
    debug('_retrieve zaddAsync result:', resultTmp);
  }
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
      resultTmp = await $r().setexAsync(
        key_d,
        EX_SECONDS,
        JSON.stringify(item)
      );
    }
  }

  return result;
}

/**
 * 获取记录条数.
 * @param {string} model
 * @param {object} options
 */
export async function _count(model, options) {
  let { where, sort } = options || {};
  let key_c = getRedisKey(model, 'c', where, sort);
  // 查看c-key缓存是否存在.
  let data_c = await $r().getAsync(key_c);
  if (data_c) {
    return data_c;
  }
  data_c = await _dbCount(model, options);
  await $r().setexAsync(key_c, EX_SECONDS, data_c);
  return data_c;
}

/**
 * 创建单条记录,返回创建的记录.
 * @param {string} model
 * @param {object} args
 */
export async function _createOne(model, args) {
  let res = await _dbCreateOne(model, args);
  let item = res.items && res.items[0];
  if (!item) {
    debug('_createOne fail!');
    return null;
  }
  // 插入redis缓存.
  let key_d = getRedisKey(model, 'd', item._id);
  let result = await $r().setexAsync(key_d, EX_SECONDS, JSON.stringify(item));
  debug('_createOne to redis', key_d, result);
  await emitRedisUpdateEvent(model, REDIS_UPDATE_ACTION.CREATE_ONE, item._id);
  return res;
}

/**
 * 删除一条,返回被删的记录.
 * @param {string} model
 * @param {object} where 查询条件
 * @param {object} options
 */
export async function _deleteOne(model, where, options) {
  let item = await _dbDeleteOne(model, where, options);
  if (item) {
    let key_d = getRedisKey(model, 'd', item._id);
    let key_s = getRedisKey(model, 's', { _id: item._id });
    let result1 = await $r().delAsync(key_d);
    let result2 = await $r().delAsync(key_s);
    debug('_deleteOne from redis', key_d, key_s, result1, result2);
    await emitRedisUpdateEvent(model, REDIS_UPDATE_ACTION.REMOVE_ONE, item._id);
  }
  return item;
}

/**
 * 更新单条信息,返回更新的记录
 * @param {string} model
 * @param {object} where
 * @param {object} args
 * @param {object} options
 */
export async function _updateOne(model, where, args, options = { new: true }) {
  let res = await _dbUpdateOne(model, where, args, options);
  let item = res.items && res.items[0];
  if (!item) {
    debug('_updateOne fail!');
    return null;
  }

  let key_d = getRedisKey(model, 'd', item._id);
  let result = await $r().setexAsync(key_d, EX_SECONDS, JSON.stringify(item));
  debug('_updateOne to redis', key_d, result);
  await emitRedisUpdateEvent(model, REDIS_UPDATE_ACTION.UPDATE_ONE, item._id);
  return res;
}

/**
 * 创建多条,这里不用populates,因为都是创建一个表的东西,不会关联插入.
 * @param {string} model
 * @param {array} items
 */
export async function _createMany(model, items) {
  debug('_createMany:', model, items);
  let result = await _dbCreateMany(model, items);
  let dbResult = result['result'];
  let dbFlatEntityMap = dbResult['entities'];
  if (!result) {
    debug('warning! _createMany fail!');
    return result;
  }

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
    }
  }

  await emitRedisUpdateEvent(
    model,
    REDIS_UPDATE_ACTION.CREATE_MANY,
    dbResult['result']
  );

  return result;
}

/**
 * 批量更新.
 * TODO: 需要更新所有影响到的_id的数据到redis中?
 * @param {string} model
 * @param {object} where
 * @param {object} args
 * @param {object} options
 */
export async function _updateMany(model, where, args, options) {
  let result = await _dbUpdateMany(model, where, args, options);
  await emitRedisUpdateEvent(model, REDIS_UPDATE_ACTION.UPDATE_MANY);
  return result;
}

/**
 * 根据_id删除某条记录.
 * @param {string} model
 * @param {string} _id
 */
export async function _deleteOneById(model, _id) {
  return await _deleteOne(model, { _id });
}

/**
 * 根据id更新记录
 * @param {string} model
 * @param {string} _id
 * @param {object} args
 * @param {object} options
 */
export async function _updateOneById(
  model,
  _id,
  args,
  options = { new: true }
) {
  return await _updateOne(model, { _id }, args, options);
}

export async function _findOne(model, where, options) {
  if (!options) options = {};
  return await _retrieve(model, { ...options, where });
}

/**
 * 根据id获得某条记录.
 * @param {string} model
 * @param {string} _id
 * @param {object} options
 */
export async function _findOneById(model, _id, options) {
  return await _findOne(model, { _id }, options);
}

/**
 * 从redis中去数据.没有返回null.
 * @param {string} model
 * @param {object} options
 */
async function _retrieveFromRedis(model, options) {
  let { where, sort, select, limit, skip, populates } = options || {};
  if (!skip) skip = 0;
  if (!limit) limit = 1;

  // 两个主key
  let key_c = getRedisKey(model, 'c', where, sort);
  let key_s = getRedisKey(model, 's', where, sort);
  debug(
    '_retrieveFromRedis ',
    { model, options },
    { skip, limit, key_c, key_s }
  );

  // 查看c-key缓存是否存在.
  let data_c = await $r().getAsync(key_c);
  debug('_retrieveFromRedis getAsync', key_c, data_c);
  if (!data_c) {
    return null;
  }
  data_c = parseInt(data_c);

  // 根据skip和limit及总数data_c计算此次需取的条数.
  let score1 = skip;
  let score2 = skip + limit;
  if (score2 > data_c) {
    // 超过最大个数限制, 使用data_c作为最大个数.
    score2 = data_c;
  }
  let count = score2 - score1;

  let data = await $r().zrangebyscoreAsync(key_s, score1, score2 - 1);
  debug('_retrieve zrangebyscore', score1, score2 - 1, data);
  if (!data || data.length < count) {
    // 缓存s-key空或者数据不够,触发db查询.
    // TODO: 当redis中c-key值比db中条数多时,会导致不一致问题.
    // TODO: 每次最后一页都触发db查询.(删除了记录,但没更新相关的c-key查询)
    return null;
  }
  await $r().expireAsync(key_s, EX_SECONDS);
  await $r().expireAsync(key_c, EX_SECONDS);

  // 缓存数据够了. 处理返回数据
  let items = [];
  // 根据populates获取得到entity内容.
  let entityMap = {
    [model]: {}
  };
  if (populates) {
    for (let i = 0; i < populates.length; i++) {
      let populate = populates[i];
      let nModel = null;
      let typemodel = type(populate.model);
      if (typemodel === 'string') nModel = populate.model;
      else if (typemodel === 'array') nModel = populate.model[0];
      else {
        debug('warning! not support populate!', { populate, typemodel });
      }
      entityMap[nModel] = {};
    }
  }

  // 生成entity数据.
  let missing = [];
  for (let i = 0; i < data.length; i++) {
    let key_d = getRedisKey(model, 'd', data[i]);
    let item = await $r().getAsync(key_d);
    if (!item) {
      debug('warning! missing cache!', key_d);
      missing.push(data[i]);
      continue;
    }
    await $r().expireAsync(key_d, EX_SECONDS);
    item = JSON.parse(item);
    items.push(item);
    entityMap[model][data[i]] = item;
    // 遍历populates.
    if (populates) {
      for (let i = 0; i < populates.length; i++) {
        let nIds = null;
        let nModel = null;
        let populate = populates[i];
        if (populate) {
          let typemodel = type(populate.model);
          if (typemodel === 'string') nModel = populate.model;
          else if (typemodel === 'array') nModel = populate.model[0];
          else {
            debug('warning! not support populate!', {
              populate,
              typemodel
            });
          }

          if (populate.path) {
            let attrs = populate.path.split('.');
            let subitem = item;
            for (let j = 0; j < attrs.length; j++) {
              let attr = attrs[j] && attrs[j].trim();
              if (attr) {
                if (j === attrs.length - 1) {
                  if (typemodel === 'string') nIds = [subitem[attr]];
                  else if (typemodel === 'array') nIds = subitem[attr];
                  // id数组.
                  else {
                    debug('warning! not support populate!', {
                      populate,
                      typemodel
                    });
                  }
                }
                subitem = subitem[attr];
              }
            }
          }
          // 根据id或id列表填充entity.
          if (nIds && nModel) {
            for (let i = 0; i < nIds.length; i++) {
              let nId = nIds[i];
              let key_d_populate = getRedisKey(nModel, 'd', nId);
              let item_populate = await $r().getAsync(key_d_populate);
              if (entityMap[nModel] && item_populate) {
                await $r().expireAsync(key_d_populate, EX_SECONDS);
                entityMap[nModel][nId] = JSON.parse(item_populate);
              } else {
                debug(
                  'warning! entities map missing populate key!',
                  key_d_populate
                );
              }
            }
          } else {
            debug('warning! entities map missing model or id!', nModel, nId);
          }
        }
      }
    }
  }
  if (missing.length > 0) {
    // 丢失了部分条目的内容.
    debug('warning! missing ', model, missing);
    return null;
  }
  let result = {
    entities: entityMap,
    result: data,
    total: data_c,
    count: data.length,
    limit,
    skip
  };
  // debug('_retrieve ok from redis', result, items);
  return {
    items,
    result
  };
}

/**
 * 删除redis-key
 * @param model 数据库表名(映射在nodejs的模块名字)
 * @param type  键类型
 * @param where_data 查询参数,不同类型参数不同，但基本都是数据记录字段
 *  d类型：则$params为主键{id:2}或联合主键{uid:1, book_id:2}
 *  s类型：则为查询条件，甚至包含$order_by
 *  w类型：为查询条件
 *  c类型：为某个查询的总条数
 */
export async function delRedisKey(model, type, where_data, sort_data) {
  if (type == 'd') {
    //当为数据记录型key时,where_data为_id
    let r_key = getRedisKey(model, 'd', where_data);
    return await $r().delAsync(r_key);
  } else if (type == 's' || type == 'w' || type == 'c') {
    let r_key_prefix = getRedisKey(model, type, where_data, sort_data);
    let r_keys = await $r().keysAsync(r_key_prefix + '*');
    let result = [];
    for (let i = 0; i < r_keys.length; i++) {
      result.push(await $r().delAsync(r_keys[i]));
    }
    return true;
  } else {
    debug('error! not support type:' + type);
    return false;
  }
}
