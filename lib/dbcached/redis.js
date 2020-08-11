'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bullClients = exports.redisClients = undefined;

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

exports.initRedis = initRedis;
exports.$r = $r;
exports.initBull = initBull;
exports.$b = $b;

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _bull = require('bull');

var _bull2 = _interopRequireDefault(_bull);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('yh:mongo:dbcached:redis');


// Q.promisifyAll(redis.RedisClient.prototype);
// Q.promisifyAll(redis.Multi.prototype);

_bluebird2.default.promisifyAll(_redis2.default);

var redisClients = exports.redisClients = {};
function initRedis(url, name) {
  if (!name) name = 'default';
  var client = _redis2.default.createClient(url);
  redisClients[name] = client;
  if (!redisClients['default']) redisClients['default'] = client;
  debug('initRedis', url, name, (0, _getOwnPropertyNames2.default)(redisClients));
  return client;
}
function $r(name) {
  if (!name) name = 'default';
  var client = redisClients[name];
  // debug('$r', name, !!client);
  return client;
}

var bullClients = exports.bullClients = {};
function initBull(url, name) {
  if (!name) name = 'default';
  var client = new _bull2.default('redis-update-key-queue', url);
  bullClients[name] = client;
  if (!bullClients['default']) bullClients['default'] = client;
  debug('initBull', url, name, (0, _getOwnPropertyNames2.default)(bullClients));
  return client;
}
function $b(name) {
  if (!name) name = 'default';
  var client = bullClients[name];
  // debug('$b', name, !!client);
  return client;
}