// DEBUG="app:*" node ./test_conns.js

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('yh:mongo:test:test_conns');
const schemas = require('./schemas').schemas;
var mongo = require('../lib');


debug ('before init',mongo.$db()&&mongo.$db().name);
mongo.initDb('mongodb://admin:admin@localhost:27017/test_eshop1?authSource=admin', schemas,'eshop').then(() => {
  debug('重新require后', mongo.$db() && mongo.$db() .name);
})
debug ('after init',mongo.$db()&&mongo.$db().name);
