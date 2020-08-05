// DEBUG="yh*,test*" node ./test_mqExpire_consume.js 
require('babel-register');
const _debug = require('debug').default;
const debug = _debug('test:cached:consume');
var cached = require('../../lib/dbcached');

/**
 * 测试
 */
cached.initRedis('redis://:1234567890@localhost:6379/1')
cached.initBull('redis://:1234567890@localhost:6379/2')
cached.initExpire();
Promise.resolve(1)
  .then(ret => {
    return cached.timelyCheck();
  })
  .then(ret => {
    debug('finish', ret);
    return ret;
  });
