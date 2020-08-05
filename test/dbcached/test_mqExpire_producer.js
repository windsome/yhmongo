// DEBUG="yh*,test*" node ./test_mqExpire_producer.js 

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('test:cached:producer');
var mongo = require('../../lib');
var cached = require('../../lib/dbcached');
const schemas = require('../schemas').schemas;

mongo.initDb('mongodb://admin:admin@localhost:27017/test_eshop?authSource=admin',schemas).then(ret => {
  cached.initRedis('redis://:1234567890@localhost:6379/1')
  cached.initBull('redis://:1234567890@localhost:6379/2')
  cached.initExpire();
  
  /**
   * 测试
   */
  Promise.resolve(1)
    .then(ret => {
      return cached
        ._createOne('user', {
          status: 0,
          num: 10001,
          nickname: 'user1',
        })
        .then(result => {
          console.log('_createOne result:', result);
          return result;
        });
    })
    .then(ret => {
      return cached.emitRedisUpdateEvent('mark', cached.REDIS_UPDATE_ACTION.CREATE_ONE);
    })
    // .then(ret => {
    //   return cached.emitRedisUpdateEvent('mark', mq.REDIS_UPDATE_ACTION.CREATE_ONE, '1111');
    // })
    .then(ret => {
      console.log('finish', ret);
      return ret;
    });
  
})
