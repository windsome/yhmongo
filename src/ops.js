/**
 * 无redis缓存版本数据库处理(从原qsv2Normalize改造而来)
 * 1. 本系统以表为操作对象,如果分表分库,则只要有办法找到正确的表即可.
 * 2. 如果系统中要加入其他业务的支持,建议新开项目,用微服务方式进行.
 *
 * 操作主要有增删改查.(一些特殊操作,如:某个字段加一等操作,由逻辑支持,不由数据库支持)
 * 操作及返回数据描述(注意,entity中的key是否做camelizeKeys处理?):
 * 1. 查询数据列表(查询单条记录,更新,创建均返回此数据格式):
 * 参数:
 * + 列表时: model:'product', opts: {where, sort, select, populates, limit, skip}, 目前支持分页查询,还不支持去重或漏,未来可以增加新方案.
 * + 创建时: model:'product', data: {name:'windsome',phone:'1123322',birth:12342322}
 * + 更新单条时: model:'product', where:{_id:1}, data: {status:2}
 * + 更新多条时: model:'product', where:{name:'windsome'}, data: {status:2}
 * + 查单条时: model:'product', opts: {where, sort, select, populates, limit, skip}
 * 返回:
 * {
 *  entity: {
 *    user: {
 *      1: {_id: 1, name: 'windsome', birth: 1223222334, ...},
 *      2: {_id: 2, name: 'agooou', birth: 1223222312, ...},
 *      ...
 *    },
 *    product: {
 *      1: {_id:1, name: 'yifu', ...},
 *      2: {_id:2, name: 'maozi', ...},
 *      ...
 *    },
 *  },
 *  result: [1,2], // 查询单条记录时,result是否不用数组?
 *  [count: 1,] // 更新数据时,返回更新的条数.一般只有1条.
 *  pagination: {total: 100, count: 10, skip: 20, limit: 10, page: 2}
 *  errcode: 0,
 *  message: 'OK'
 * }
 * 2. 删除数据(删除某个id的数据.)
 * {
 *  count: 1, //返回删除条数
 *  errcode: 0,
 *  message: 'OK'
 * }
 */

import _debug from 'debug';
const debug = _debug('app:dbmongo:ops');
import type from './utils/type';
import { schema, normalize } from 'normalizr';
import { camelizeKeys } from 'humps';
import memoize from 'lodash/memoize';
// import stringify from 'json-stable-stringify';
import { stringify } from 'flatted';
import Errcode, { EC } from './Errcode';
import db from './db';

/**
 * 基础方法:
 * 1. 查找列表_retrieve(根据id,根据条件查单个只是特殊情况)
 * 2. 创建1条_createOne
 * 3. 删除_deleteOne(根据id删除只是特殊情况)
 * 4. 更新1条_updateOne(一般根据id更新)
 * 5. [少用]创建多条记录_createMany
 * 6. [少用]更新多条记录_updateMany
 * 其他扩展方法:
 * 1. 根据id删除_deleteOneById
 * 2. 根据id更新_updateOneById
 * 3. 根据where条件查一个_findOne
 * 4. 根据id查找_findOneById
 */

/**
 * 查找模块列表.
 * @param {object} model modelName.不是modelName的原因为可能有多个db,放model可以省掉db这个参数.
 * @param {*} options 参数 { where, sort, select, limit, skip, populates }
 * 1. where 查询条件
 *  + {_id: '123123123'} // 根据id查询单条,可不带其他参数.
 *  + {phone: '13661989491'} // 根据电话查询,可以带个limit:1,不带其他参数,表示只查一条.
 *  + {name: 'windsome'} // 根据名字查询,可能匹配多条.
 * 2. sort 排序
 *  + {birth:1, createdAt:-1, 'stats.visit': -1} 1表示正序,-1表示倒序
 * 3. select 选择返回的字段
 *  + ['_id','name','birth','phone','createdAt'] 要选择的字段
 *  + ['-password'] 除了要去掉的字段,其他字段都返回,字段名前加`-`,一般情况下不会与上面情况同时使用.
 * 4. limit 数字,最多返回条数.
 * 5. skip 数字,排除前面多少条.
 * 6. populates 数组,哪些字段是要扩展出来的.
 *  + 空,表示不扩展字段
 *  + [{path:'ancestor': model:'post'}]
 *  + [{path:'desc.ancestor': model:'post'}]
 *  + [{path:'desc.ancestor': model:['post']}]
 */
export async function _retrieve(model, options) {
  debug('_retrieve', model, options);
  let dbModel = db.models[model];
  if (!dbModel) {
    throw new Errcode('no such model ' + model, EC.ERR_NO_SUCH_ENTITY);
  }
  let { where } = options || {};

  let query = dbModel.find(where || {});
  let total = await query.count();

  let { items, result } = await _retrieveNoTotal(model, options);
  result = { ...(result || {}), total };

  debug('_retrieve', model, options, items, result);
  return { items, result };
}

export async function _retrieveNoTotal(model, options) {
  debug('_retrieveNoTotal', model, options);
  let dbModel = db.models[model];
  if (!dbModel) {
    throw new Errcode('no such model ' + model, EC.ERR_NO_SUCH_ENTITY);
  }
  let { where, sort, select, limit, skip, populates } = options || {};

  let query = dbModel.find(where || {});
  if (sort) query = query.sort(sort);
  if (select) query = query.select(select);
  if (limit) query = query.limit(limit);
  if (skip) query = query.skip(skip);
  if (populates) {
    for (let i = 0; i < populates.length; i++) {
      let populate = populates[i];
      if (populate) {
        let { model: nModel, ...restPopulate } = populate;
        let nDbModel = db.models[nModel];
        if (nDbModel && populate.path)
          query = query.populate({
            ...restPopulate,
            model: nDbModel
          });
      }
    }
  }
  let items = await query.exec();
  items = (items && items.map(item => item.toObject())) || [];
  let data = normalizeItemArray(items, model, populates);
  let result = {
    count: items.length, // 此次条数
    limit, // 分页条数
    skip, // 分页起始条
    ...(data || {})
  };

  return { items, result };
}

/**
 * 获取记录条数
 * @param {string} model
 * @param {object} options
 */
export async function _count(model, options) {
  debug('_count', model, options);
  let dbModel = db.models[model];
  if (!dbModel) {
    throw new Errcode('no such model ' + model, EC.ERR_NO_SUCH_ENTITY);
  }
  let { where } = options || {};
  let query = dbModel.find(where || {});
  return await query.count();
}

/**
 * 创建单条记录,返回创建的记录.
 * @param {string} model
 * @param {object} args
 */
export async function _createOne(model, args) {
  debug('_createOne', model, args);
  let dbModel = db.models[model];
  if (!dbModel) {
    throw new Errcode('no such model ' + model, EC.ERR_NO_SUCH_ENTITY);
  }
  let entity = new dbModel(args);
  let item = await entity.save(entity);
  item = item && item.toObject();
  if (!item) {
    throw new Errcode('create fail! model=' + model, EC.ERR_NO_SUCH_ENTITY);
  }

  let data = normalizeItemArray([item], model);
  let result = {
    count: 1, // 此次条数
    limit: 1, // 分页条数
    skip: 0, // 分页起始条
    ...(data || {})
  };

  return { items: [item], result };
  // return item;
}

/**
 * 删除一条,返回被删的记录.
 * @param {string} model
 * @param {object} where 查询条件
 * @param {object} options
 */
export async function _deleteOne(model, where, options) {
  debug('_deleteOne', model, where, options);
  // let item = await db.models[model].findOneAndDelete(where, options);
  // item = item && item.toObject();
  // return item;

  let dbModel = db.models[model];
  if (!dbModel) {
    throw new Errcode('no such model ' + model, EC.ERR_NO_SUCH_ENTITY);
  }
  let item = await dbModel.findOne(where, options);
  if (item) {
    await dbModel.deleteById(item._id);
  }
  item = item && item.toObject();
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
  debug('_updateOne', model, where, args, options);
  let dbModel = db.models[model];
  if (!dbModel) {
    throw new Errcode('no such model ' + model, EC.ERR_NO_SUCH_ENTITY);
  }
  let item = await dbModel.findOneAndUpdate(where, args, options);
  item = item && item.toObject();
  if (!item) {
    throw new Errcode('create fail! model=' + model, EC.ERR_NO_SUCH_ENTITY);
  }

  let data = normalizeItemArray([item], model);
  let result = {
    count: 1, // 此次条数
    limit: 1, // 分页条数
    skip: 0, // 分页起始条
    ...(data || {})
  };

  return { items: [item], result };
  // return item;
}

/**
 * 创建多条,这里不用populates,因为都是创建一个表的东西,不会关联插入.
 * @param {string} model
 * @param {array} items
 */
export async function _createMany(model, items) {
  debug('_createMany', model, items);
  let dbModel = db.models[model];
  if (!dbModel) {
    throw new Errcode('no such model ' + model, EC.ERR_NO_SUCH_ENTITY);
  }

  let resultDocs = await dbModel.insertMany(items);
  items = (resultDocs && resultDocs.map(item => item.toObject())) || [];
  // debug('_insertManyModel', items2);
  let data = normalizeItemArray(items, model);
  let result = {
    total: items.length, // 此次插入总数
    count: items.length, // 此次插入总数
    limit: items.length, // 分页条数
    skip: 0, // 分页起始条
    page: 0, // 当前页
    ...(data || {})
  };

  return { result, items };
}

/**
 * 批量更新.
 * @param {string} model
 * @param {object} where
 * @param {object} args
 * @param {object} options
 */
export async function _updateMany(model, where, args, options) {
  debug('_updateMany', model, where, args, options);
  let dbModel = db.models[model];
  if (!dbModel) {
    throw new Errcode('no such model ' + model, EC.ERR_NO_SUCH_ENTITY);
  }
  let result = await dbModel.updateMany(where, args, options);
  // return result && result.toObject();
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
  return await _retrieve(model, { ...(options || {}), where });
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

///////////////////////////////////////////////////
// 对结果的整理.
///////////////////////////////////////////////////
export function createSchemaWithPopulates(model, populates, options = {}) {
  // 将字符串型的populates转成schema.Entity. 一般有如下情形:
  // 1. populates为空, 则表示没有子的schema
  // 2. populates: [{path:'ancestor', model:'post'}] => definition: {ancestor:new schema.Entity('post')}
  // 3. populates: [{path:'desc.ancestor', model:'post'}] => definition: { desc: {ancestor: new schema.Entity('post')}}
  // 3. populates: [{path:'desc.ancestor', model:['post']}] => definition: { desc: {ancestor: [new schema.Entity('post')]}}
  // 4. populates: [{path: 'author', model: 'user', select: '-password'}] => definition: { desc: {ancestor: [new schema.Entity('post')]}}
  if (!model) return null;
  if (!populates) return new schema.Entity(model, {}, options);
  let definition = {};
  for (let i = 0; i < populates.length; i++) {
    let populate = populates[i];
    if (populate.path && populate.model) {
      let attrs = populate.path.split('.');
      let typemodel = type(populate.model);
      let tmpdefinition = definition;
      for (let j = 0; j < attrs.length; j++) {
        let attr = attrs[j] && attrs[j].trim();
        if (attr) {
          if (j === attrs.length - 1) {
            if (typemodel === 'string')
              tmpdefinition[attr] = new schema.Entity(
                populate.model,
                {},
                options
              );
            else if (typemodel === 'array')
              tmpdefinition[attr] = [
                new schema.Entity(populate.model[0], {}, options)
              ];
            else {
              debug('warning! not support populate!', { populate, typemodel });
            }
          } else tmpdefinition[attr] = {};
          tmpdefinition = tmpdefinition[attr];
        }
      }
    }
  }
  // debug('createSchemaWithPopulates', definition);
  return new schema.Entity(model, definition, options);
}

export const memCreateSchemaWithPopulates = memoize(
  createSchemaWithPopulates,
  (...args) => stringify(args)
);

export function normalizeItem(item, modelName, populates) {
  if (!item) return item;
  let itemNext = JSON.parse(JSON.stringify(item));
  // item = itemNext && camelizeKeys(itemNext);
  item = itemNext;
  // let schema1 = schemas[modelName] || new schema.Entity(modelName);
  let schema1 = memCreateSchemaWithPopulates(modelName, populates, {
    idAttribute: '_id'
  });
  return item && normalize(item, schema1);
}

export function normalizeItemArray(items, modelName, populates) {
  if (!items) return items;
  let itemsNext = JSON.parse(JSON.stringify(items));
  // items = itemsNext && camelizeKeys(itemsNext);
  items = itemsNext;
  // let schema1 = schemas[modelName] || new schema.Entity(modelName);
  let schema1 = memCreateSchemaWithPopulates(modelName, populates, {
    idAttribute: '_id'
  });
  return items && normalize(items, [schema1]);
}

export function _getFirstOfRetrieve(result, model) {
  let item = null;
  if (result) {
    // result.items[0]存在则直接返回.
    item = result.items && result.items[0];
    if (!item) {
      // result.result[0]存在则从entities中获取.
      let itemId = result.result && result.result[0];
      if (itemId) {
        item =
          result.entities &&
          result.entities[model] &&
          result.entities[model][itemId];
      }
    }
  }
  // debug('_getFirstOfRetrieve', JSON.stringify(result), model, item);
  return item;
}

/**
 * 将get/update/retrieve获得的结果集中内容合并到第一个.
 * 只合并{result:{entities:{...}}}中内容.
 * @param {object} target
 * @param  {...any} others
 */
export function _mergeDbOfResult(target, ...others) {
  if (!target) return null;
  if (!target.result) target.result = {};
  if (!target.result.entities) target.result.entities = {};
  let targetResultEntities = target.result.entities;
  for (let i = 0; i < others.length; i++) {
    let tmpEntities =
      others[i] && others[i].result && others[i].result.entities;
    if (tmpEntities) {
      // 遍历tmpEntities,进行合并.
      for (const tableName in tmpEntities) {
        if (tmpEntities.hasOwnProperty(tableName)) {
          let oldTableItems = targetResultEntities[tableName] || {};
          let addTableItems = tmpEntities[tableName];
          if (typeof addTableItems === 'object') {
            // update
            //xdebug('old:', old, 'nextProp:', nextProp, ', updated:', updatedProp);
            targetResultEntities[tableName] = {
              ...oldTableItems,
              ...addTableItems
            };
          }
        }
      }
    }
  }
  return target;
}
