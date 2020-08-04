// DEST=dev DEBUG="app:*" node ./test_redisOps.js

require('babel-register');
var ops = require('../../src/dbcached/redisKey');

/**
 * 测试
 */
Promise.resolve(1)
  .then(ret => {
    let d_key = ops.getRedisKey('mark', 'd', '5d80a85c460c991f57768453');
    console.log('d_key', d_key);
    let s_key = ops.getRedisKey('mark', 's', {
      _id: '5d80a85c460c991f57768453'
    });
    console.log('s_key', s_key);
    let s_key2 = ops.getRedisKey(
      'mark',
      's',
      { table: 'test' },
      { createdAt: -1 }
    );
    console.log('s_key2', s_key2);
    let s_key3 = ops.getRedisKey('mark', 's');
    console.log('s_key3', s_key3);
    return {
      d_key,
      s_key,
      s_key2,
      s_key3
    };
  })
  .then(ret => {
    let d_obj = ops.parseRedisKey(ret.d_key);
    let s_obj = ops.parseRedisKey(ret.s_key);
    let s_obj2 = ops.parseRedisKey(ret.s_key2);
    let s_obj3 = ops.parseRedisKey(ret.s_key3);
    console.log('d_obj', d_obj);
    console.log('s_obj', s_obj);
    console.log('s_obj2', s_obj2);
    console.log('s_obj3', s_obj3);
    return {
      d_obj,
      s_obj,
      s_obj2,
      s_obj3
    };
  })
  .then(ret => {
    console.log('finish');
    return ret;
  });
