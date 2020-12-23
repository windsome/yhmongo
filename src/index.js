import { initRedis, initBull, initExpire } from './dbcached';
import { initDb as initMongodb } from './db';

export { initDb, $db, conns } from './db';

export { ErrCode, EC, EM } from './Errcode';

export {
  _retrieve,
  _createOne,
  _deleteOne,
  _updateOne,
  _createMany,
  _updateMany,
  _deleteOneById,
  _updateOneById,
  _findOne,
  _findOneById,
  _getFirstOfRetrieve
} from './ops';

/**
 * 统一初始化mongodb,redis,bull
 * @param {json} cfg {url:<url>,schemas, cached:{redis:<url>, bull:<url>}}
 */
export function init(cfg) {
  let { cached, ...mongocfg } = cfg;
  if (cached) {
    let redisUrl = cached.redis;
    let bullUrl = cached.bull;
    initRedis(redisUrl);
    initBull(bullUrl);
    initExpire();
  }
  let url = mongocfg.url;
  let schemas = mongocfg.schemas;
  return initMongodb(url, schemas);
}
