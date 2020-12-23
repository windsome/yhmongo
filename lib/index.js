'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._getFirstOfRetrieve = exports._findOneById = exports._findOne = exports._updateOneById = exports._deleteOneById = exports._updateMany = exports._createMany = exports._updateOne = exports._deleteOne = exports._createOne = exports._retrieve = exports.EM = exports.EC = exports.ErrCode = exports.conns = exports.$db = exports.initDb = undefined;

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _db = require('./db');

Object.defineProperty(exports, 'initDb', {
  enumerable: true,
  get: function get() {
    return _db.initDb;
  }
});
Object.defineProperty(exports, '$db', {
  enumerable: true,
  get: function get() {
    return _db.$db;
  }
});
Object.defineProperty(exports, 'conns', {
  enumerable: true,
  get: function get() {
    return _db.conns;
  }
});

var _Errcode = require('./Errcode');

Object.defineProperty(exports, 'ErrCode', {
  enumerable: true,
  get: function get() {
    return _Errcode.ErrCode;
  }
});
Object.defineProperty(exports, 'EC', {
  enumerable: true,
  get: function get() {
    return _Errcode.EC;
  }
});
Object.defineProperty(exports, 'EM', {
  enumerable: true,
  get: function get() {
    return _Errcode.EM;
  }
});

var _ops = require('./ops');

Object.defineProperty(exports, '_retrieve', {
  enumerable: true,
  get: function get() {
    return _ops._retrieve;
  }
});
Object.defineProperty(exports, '_createOne', {
  enumerable: true,
  get: function get() {
    return _ops._createOne;
  }
});
Object.defineProperty(exports, '_deleteOne', {
  enumerable: true,
  get: function get() {
    return _ops._deleteOne;
  }
});
Object.defineProperty(exports, '_updateOne', {
  enumerable: true,
  get: function get() {
    return _ops._updateOne;
  }
});
Object.defineProperty(exports, '_createMany', {
  enumerable: true,
  get: function get() {
    return _ops._createMany;
  }
});
Object.defineProperty(exports, '_updateMany', {
  enumerable: true,
  get: function get() {
    return _ops._updateMany;
  }
});
Object.defineProperty(exports, '_deleteOneById', {
  enumerable: true,
  get: function get() {
    return _ops._deleteOneById;
  }
});
Object.defineProperty(exports, '_updateOneById', {
  enumerable: true,
  get: function get() {
    return _ops._updateOneById;
  }
});
Object.defineProperty(exports, '_findOne', {
  enumerable: true,
  get: function get() {
    return _ops._findOne;
  }
});
Object.defineProperty(exports, '_findOneById', {
  enumerable: true,
  get: function get() {
    return _ops._findOneById;
  }
});
Object.defineProperty(exports, '_getFirstOfRetrieve', {
  enumerable: true,
  get: function get() {
    return _ops._getFirstOfRetrieve;
  }
});
exports.init = init;

var _dbcached = require('./dbcached');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * 统一初始化mongodb,redis,bull
 * @param {json} cfg {url:<url>,schemas, cached:{redis:<url>, bull:<url>}}
 */
function init(cfg) {
  var cached = cfg.cached,
      mongocfg = (0, _objectWithoutProperties3.default)(cfg, ['cached']);

  if (cached) {
    var redisUrl = cached.redis;
    var bullUrl = cached.bull;
    (0, _dbcached.initRedis)(redisUrl);
    (0, _dbcached.initBull)(bullUrl);
    (0, _dbcached.initExpire)();
  }
  var url = mongocfg.url;
  var schemas = mongocfg.schemas;
  return (0, _db.initDb)(url, schemas);
}