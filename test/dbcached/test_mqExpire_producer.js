// DEST=dev DEBUG="app:*" node ./test_mqExpire_producer.js

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
      ._createOne('mark', {
        status: 0,
        author: '5ba27cc3a70db45dd108b541',
        table: 'postTest',
        target: '5ba5b9632e0d697f5cbedf45'
      })
      .then(result => {
        console.log('_createOne result:', result);
        return result;
      });
  })
  .then(ret => {
    return mq.emitRedisUpdateEvent('mark', mq.REDIS_UPDATE_ACTION.CREATE_ONE);
  })
  // .then(ret => {
  //   return mq.emitRedisUpdateEvent('mark', mq.REDIS_UPDATE_ACTION.CREATE_ONE, '1111');
  // })
  .then(ret => {
    console.log('finish', ret);
    return ret;
  });
