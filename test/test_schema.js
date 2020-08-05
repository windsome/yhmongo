// DEST=dev DEBUG="app:*" node ./test_init.js

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('app:test:test_schema');
var $db = require('../lib').$db;
require('./test_conns');
// console.log('db0:', db0);
debug('test_schema 马上获取conns', $db())
setTimeout(()=>{
    debug('test_schema 延迟1秒后,直接打印原引入的conns', $db());
debug('test_schema 延迟1秒后重新获取db', $db())
var db0 = $db();
debug('test_schema user:', db0 && db0.models['user'].modelName);

},1000);
