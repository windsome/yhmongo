// DEST=dev DEBUG="app:*" node ./test_init.js

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('app:test_schema');
require('./test_conn');
// var db0 = require('../lib/db').default;
var db0 = require('../lib/index').db;
// console.log('db0:', db0);
debug('db0', db0)
var mark = db0.models['mark'].modelName;
debug('mark:', mark);
