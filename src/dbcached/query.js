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
const debug = _debug('yh:mongo:dbcached:query');
import type from '../utils/type';
import _keys from 'lodash/keys';
import { indexOf } from 'lodash';

/**
 * 判断某条记录是否在某个查询条件中.
 * TODO:目前只解析第一层?
 * @param {json} item 需要判断的item
 * @param {json} query 查询条件,可能为子条件
 * @param {json} op 操作符,如$and,$or,$in等,外面第一层传入为$and
 * @param {json} attr 属性
 */
export function itemFulfillQuery(item, query = {}, op = '', attr = '') {
  // debug('itemFulfillQuery:', JSON.stringify({op, attr}), JSON.stringify(query), JSON.stringify(item));
  let typeQuery = type(query);
  if (!op) {
    if (typeQuery == 'object') {
      // json:{} 表示为$and操作.则需每一项条件满足才能匹配.
      op = '$and';
    }
  }
  switch (op) {
    case '$and':
      let keys = _keys(query);
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let nQuery = query[key];
        let result1 = true;
        if (key.startsWith('$')) {
          // key为操作符
          result1 = itemFulfillQuery(item, nQuery, key, attr);
        } else {
          // key不是操作符,则为属性名.一般情况下直接判断是否相等
          if (attr) {
            debug('warning! attr should empty! but is' + attr);
          }
          result1 = itemFulfillQuery(item, nQuery, '', key);
        }
        if (!result1) return result1;
      }
      return true;
    case '$or': // $or下层为数组.只要一个满足就返回true.
      for (let i = 0; i < query.length; i++) {
        let nQuery = query[i];
        let result1 = itemFulfillQuery(item, nQuery, '', attr);
        if (result1) return result1;
      }
      return false;
    case '$in': {
      //$in,可以判断item的属性值是否在其中.
      let attrValue = getItemAttrValue(item, attr);
      return query.indexOf(attrValue) >= 0;
    }
    case '$gt': {
      // 判断值是否大于条件中值
      let attrValue = getItemAttrValue(item, attr);
      return attrValue > query;
    }
    case '$lt': {
      // 判断值是否小于条件中值
      let attrValue = getItemAttrValue(item, attr);
      return attrValue < query;
    }
    case '': {
      // 判断值是否等于条件中值
      let attrValue = getItemAttrValue(item, attr);
      // debug('itemFulfillQuery:', JSON.stringify({op, attr, attrValue}), type(query));

      if (type(query) == 'array') {
        // 需要判断attrValue是否在数组中.
        for (let i = 0; i < query.length; i++) {
          if (query[i] == attrValue) return true;
        }
        return false;
      } else if (type(attrValue) == 'array') {
        for (let i = 0; i < attrValue.length; i++) {
          if (query == attrValue[i]) return true;
        }
        return false;
      } else {
        return attrValue == query;
      }
    }
    default: {
      debug('warning! not support op=' + op, query);
      return false;
    }
  }
}

/**
 * 从item中获取attr的值, attr可能以'.'进行连接.
 * @param {json} item
 * @param {string} attr
 */
export function getItemAttrValue(item, attr = '') {
  let value = item;
  if (!value) return null;
  let atrs = attr.split('.');
  for (let i = 0; i < atrs.length; i++) {
    let key = atrs[i];
    value = value[key];
  }
  return value;
}
