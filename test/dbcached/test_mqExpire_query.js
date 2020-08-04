// DEST=dev DEBUG="app:*" node ./test_mqExpire.js

require('babel-register');
var mq = require('../../src/dbcached/mqExpire');
var key = require('../../src/dbcached/redisKey');
var ops = require('../../src/dbcached/ops');

/**
 * 测试
 */
Promise.resolve(1)
  .then(ret => {
    return ops
      ._retrieve('mark', { sort: { createdAt: -1 }, limit: 10 })
      .then(ret => {
        console.log('_retrieve result:', JSON.stringify(ret));
        return ret;
      });
  })
  .then(ret => {
    console.log('finish', ret);
    return ret;
  });
