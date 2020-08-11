import _debug from 'debug';
const debug = _debug('yh:mongo:dbcached:redisKey');
import stringify from 'json-stable-stringify';

function stableSort(a, b) {
  return a.key.localeCompare(b.key);
  // return a.key < b.key ? -1 : 1;
}

export const SEPARATOR = '##';
/**
 * 通过参数得到相应的r_key.
 * @param {string} model
 * @param {string} type
 * @param {object} where_data
 * @param {object} sort_data
 */
export function getRedisKey(model, type, where_data, sort_data) {
  let r_key = null;
  if (type == 'd') {
    //当为数据记录型key时,where_data为_id
    r_key = model + SEPARATOR + 'd' + SEPARATOR + where_data;
  } else if (type == 's' || type == 'c') {
    //为数据列表查询型数据. s表示列表查询,c表示列表查询总数,w表示单条查询条件
    r_key = model + SEPARATOR + type + SEPARATOR;
    if (where_data) {
      // r_key += JSON.stringify(where_data);
      r_key += stringify(where_data, stableSort);
    }
    r_key += SEPARATOR;
    if (sort_data) {
      // r_key += JSON.stringify(sort_data);
      r_key += stringify(sort_data, stableSort);
    }
  } else {
    debug('error! not support type:' + type);
  }
  return r_key;
}

/**
 * 通过r_key得到model,type,where,sort值,即上面函数的反函数.
 * @param {string} r_key
 */
export function parseRedisKey(r_key) {
  let result = r_key.split(SEPARATOR);
  let model = result[0];
  let type = result[1];
  let where = null;
  let sort = null;
  if (type == 'd') {
    //当为数据记录型key时,where_data为_id
    where = result[2];
  } else if (type == 's' || type == 'c') {
    if (result[2]) where = JSON.parse(result[2]);
    if (result[3]) {
      sort = JSON.parse(result[3]);
    }
  } else {
    debug('error! not support type:' + type);
  }
  return {
    model,
    type,
    where,
    sort
  };
}
