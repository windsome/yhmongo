// DEST=dev DEBUG="app:*" node ./test_redisOps.js

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('test:cached:redisKey');
var cached = require('../../lib/dbcached');

cached.initRedis('redis://:1234567890@localhost:6379/1')

/**
 * 测试
 */
Promise.resolve(1)
  .then(ret => {
    let d_key = cached.getRedisKey('mark', 'd', '5d80a85c460c991f57768453');
    debug('d_key', d_key);
    let s_key = cached.getRedisKey('mark', 's', {
      _id: '5d80a85c460c991f57768453'
    });
    debug('s_key', s_key);
    let s_key2 = cached.getRedisKey(
      'mark',
      's',
      { table: 'test' },
      { createdAt: -1 }
    );
    debug('s_key2', s_key2);
    let s_key3 = cached.getRedisKey('mark', 's');
    debug('s_key3', s_key3);
    return {
      d_key,
      s_key,
      s_key2,
      s_key3
    };
  })
  .then(ret => {
    let d_obj = cached.parseRedisKey(ret.d_key);
    let s_obj = cached.parseRedisKey(ret.s_key);
    let s_obj2 = cached.parseRedisKey(ret.s_key2);
    let s_obj3 = cached.parseRedisKey(ret.s_key3);
    debug('d_obj', d_obj);
    debug('s_obj', s_obj);
    debug('s_obj2', s_obj2);
    debug('s_obj3', s_obj3);
    return {
      d_obj,
      s_obj,
      s_obj2,
      s_obj3
    };
  })
  .then(ret => {
    debug('finish');
    return ret;
  });
