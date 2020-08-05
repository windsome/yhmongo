// DEBUG="app:*" node ./test_conn0.js

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('yh:mongo:test:test_conn0');
var mongo = require('../lib');
const schemas = require('./schemas').schemas;

debug ('before init',mongo.$db()&&mongo.$db().name);
mongo.initDb('mongodb://admin:admin@localhost:27017/test_eshop1?authSource=admin', schemas,'eshop').then(() => {
  // debug('conn0', conn0);
  // debug('conn1', conn1);
  debug('重新require后', mongo.$db()&&mongo.$db().name);
})
debug ('after init',mongo.$db()&&mongo.$db().name);
