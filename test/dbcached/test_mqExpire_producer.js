// DEBUG="yh*,test*" node ./test_mqExpire_producer.js 

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('test:cached:mq:producer');
var mongo = require('../../src');
var cached = require('../../src/dbcached');
const schemas = require('../schemas').schemas;

const sleep = timeout => {
  return new Promise((resolve, reject) => {
    setTimeout(function() {
      resolve();
    }, timeout);
  });
};

mongo.initDb('mongodb://admin:admin@localhost:27017/test_eshop?authSource=admin',schemas).then(ret => {
  cached.initRedis('redis://:1234567890@localhost:6379/1')
  cached.initBull('redis://:1234567890@localhost:6379/2')
  cached.initExpire();
  
  /**
   * 测试
   */
  Promise.resolve(1)
  .then(()=>sleep(1000))
    .then(()=>{
      debug('_retrieve 1')
      cached._retrieve('user',{where:{status:0}})
    })
    .then(ret => {
      debug('create')
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
      debug('emitRedisUpdateEvent')
      return cached.emitRedisUpdateEvent('user', cached.REDIS_UPDATE_ACTION.CREATE_ONE, ret.items);
    })
    .then(()=>sleep(1000))
    .then(()=>{
      debug('_retrieve 2');
      cached._retrieve('user',{where:{status:0}})
    })
    // .then(ret => {
    //   return cached.emitRedisUpdateEvent('mark', mq.REDIS_UPDATE_ACTION.CREATE_ONE, '1111');
    // })
    .then(ret => {
      console.log('finish', ret);
      return ret;
    });
  
})
