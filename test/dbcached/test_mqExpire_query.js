// DEBUG="yh*,test*" node ./test_mqExpire_query.js 

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('test:cached:query');
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
      ._retrieve('mark', { sort: { createdAt: -1 }, limit: 10 })
      .then(ret => {
        debug('_retrieve result:', JSON.stringify(ret));
        return ret;
      });
  })
  .then(ret => {
    debug('finish', ret);
    return ret;
  });

});
