'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.delRedisKey = exports._findOneById = exports._findOne = exports._updateOneById = exports._deleteOneById = exports._updateMany = exports._createMany = exports._updateOne = exports._deleteOne = exports._createOne = exports._count = exports._retrieve = exports.EX_SECONDS = exports._mergeDbOfResult = exports._getFirstOfRetrieve = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

// 键过期默认秒数.

/**
 * 根据model和options得到数据.
 * @param {string} model
 * @param {object} options 内容为: { where, sort, select, limit:1, skip:0, populates }
 */
var _retrieve = exports._retrieve = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(model, options) {
    var result, key_c, key_s, dbResult, dbFlatEntityMap, dbFlatResult, dbFlatTotal, dbFlatLimit, dbFlatSkip, dbFlatCount, resultTmp, argsArray, i, _$r, collections, _i, nModel, collection, ids, j, id, item, key_d;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _retrieveFromRedis(model, options);

          case 2:
            result = _context.sent;

            if (!result) {
              _context.next = 6;
              break;
            }

            // 取到足够数据就返回,否则继续去数据库取,并更新进redis.
            debug('_retrieve return from cache! ', (0, _stringify2.default)({
              model: model,
              count: result && result.items && result.items.length,
              options: options
            }));
            return _context.abrupt('return', result);

          case 6:
            _context.next = 8;
            return (0, _ops._retrieve)(model, options);

          case 8:
            result = _context.sent;


            // 两个主key
            key_c = (0, _redisKey.getRedisKey)(model, 'c', options.where, options.sort);
            key_s = (0, _redisKey.getRedisKey)(model, 's', options.where, options.sort);

            // 将entity数据插入redis.

            dbResult = result['result'];
            dbFlatEntityMap = dbResult['entities'];
            dbFlatResult = dbResult['result'];
            dbFlatTotal = dbResult['total'];
            dbFlatLimit = dbResult['limit'];
            dbFlatSkip = dbResult['skip'];
            dbFlatCount = dbResult['count'];

            if (!dbFlatSkip) dbFlatSkip = 0;
            // 设置总数c键
            _context.next = 21;
            return (0, _redis.$r)().setexAsync(key_c, EX_SECONDS, dbFlatTotal);

          case 21:
            resultTmp = _context.sent;
            _context.next = 24;
            return (0, _redis.$r)().zremrangebyscoreAsync(key_s, dbFlatSkip, dbFlatSkip + dbFlatResult.length - 1);

          case 24:
            resultTmp = _context.sent;

            // debug('dealRedisUpdate zremrangebyscore result:', resultTmp, key_s);
            // // 设置s键,ZADD key score1 member1 [score2 member2]
            argsArray = [];

            for (i = 0; i < dbFlatResult.length; i++) {
              argsArray.push(dbFlatSkip + i);
              argsArray.push(dbFlatResult[i]);
            }

            if (!(argsArray.length > 0)) {
              _context.next = 33;
              break;
            }

            _context.next = 30;
            return (_$r = (0, _redis.$r)()).zaddAsync.apply(_$r, [key_s].concat(argsArray));

          case 30:
            resultTmp = _context.sent;
            _context.next = 33;
            return (0, _redis.$r)().expireAsync(key_s, EX_SECONDS);

          case 33:
            // 遍历entity,设置d键.
            collections = (0, _getOwnPropertyNames2.default)(dbFlatEntityMap);
            _i = 0;

          case 35:
            if (!(_i < collections.length)) {
              _context.next = 53;
              break;
            }

            nModel = collections[_i];
            collection = dbFlatEntityMap[nModel];
            ids = (0, _getOwnPropertyNames2.default)(collection);
            j = 0;

          case 40:
            if (!(j < ids.length)) {
              _context.next = 50;
              break;
            }

            id = ids[j];
            item = collection[id];
            key_d = (0, _redisKey.getRedisKey)(nModel, 'd', id);
            _context.next = 46;
            return (0, _redis.$r)().setexAsync(key_d, EX_SECONDS, (0, _stringify2.default)(item));

          case 46:
            resultTmp = _context.sent;

          case 47:
            j++;
            _context.next = 40;
            break;

          case 50:
            _i++;
            _context.next = 35;
            break;

          case 53:
            debug('_retrieve return from db', (0, _stringify2.default)({ model: model, key_c: key_c, options: options, dbFlatEntityMap: dbFlatEntityMap }));

            return _context.abrupt('return', result);

          case 55:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function _retrieve(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * 获取记录条数.
 * @param {string} model
 * @param {object} options
 */


var _count = exports._count = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(model, options) {
    var _ref3, where, sort, key_c, data_c;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _ref3 = options || {}, where = _ref3.where, sort = _ref3.sort;
            key_c = (0, _redisKey.getRedisKey)(model, 'c', where, sort);
            // 查看c-key缓存是否存在.

            _context2.next = 4;
            return (0, _redis.$r)().getAsync(key_c);

          case 4:
            data_c = _context2.sent;

            if (!data_c) {
              _context2.next = 7;
              break;
            }

            return _context2.abrupt('return', data_c);

          case 7:
            _context2.next = 9;
            return (0, _ops._count)(model, options);

          case 9:
            data_c = _context2.sent;
            _context2.next = 12;
            return (0, _redis.$r)().setexAsync(key_c, EX_SECONDS, data_c);

          case 12:
            return _context2.abrupt('return', data_c);

          case 13:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function _count(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * 创建单条记录,返回创建的记录.
 * @param {string} model
 * @param {object} args
 */


var _createOne = exports._createOne = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(model, args) {
    var res, item, key_c, key_s, resultTmp, key_d, result;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _ops._createOne)(model, args);

          case 2:
            res = _context3.sent;
            item = res.items && res.items[0];

            if (item) {
              _context3.next = 7;
              break;
            }

            debug('error! _createOne fail!');
            return _context3.abrupt('return', null);

          case 7:
            // 插入redis缓存. 首先插入根据_id缓存的ckey及skey
            key_c = (0, _redisKey.getRedisKey)(model, 'c', { _id: item._id });
            key_s = (0, _redisKey.getRedisKey)(model, 's', { _id: item._id });
            _context3.next = 11;
            return (0, _redis.$r)().setexAsync(key_c, EX_SECONDS, 1);

          case 11:
            resultTmp = _context3.sent;
            _context3.next = 14;
            return (0, _redis.$r)().zaddAsync(key_s, 0, item._id.toString());

          case 14:
            resultTmp = _context3.sent;
            _context3.next = 17;
            return (0, _redis.$r)().expireAsync(key_s, EX_SECONDS);

          case 17:
            // 插入dkey
            key_d = (0, _redisKey.getRedisKey)(model, 'd', item._id);
            _context3.next = 20;
            return (0, _redis.$r)().setexAsync(key_d, EX_SECONDS, (0, _stringify2.default)(item));

          case 20:
            result = _context3.sent;


            debug('_createOne to redis', (0, _stringify2.default)({ key_d: key_d, result: result }));
            _context3.next = 24;
            return (0, _mqExpire.emitRedisUpdateEvent)(model, _mqExpire.REDIS_UPDATE_ACTION.CREATE_ONE, item);

          case 24:
            return _context3.abrupt('return', res);

          case 25:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function _createOne(_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * 删除一条,返回被删的记录.
 * @param {string} model
 * @param {object} where 查询条件
 * @param {object} options
 */


var _deleteOne = exports._deleteOne = function () {
  var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(model, where, options) {
    var item, key_d, key_c, key_s, result1, result2, result3;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return (0, _ops._deleteOne)(model, where, options);

          case 2:
            item = _context4.sent;

            if (!item) {
              _context4.next = 19;
              break;
            }

            key_d = (0, _redisKey.getRedisKey)(model, 'd', item._id);
            key_c = (0, _redisKey.getRedisKey)(model, 'c', { _id: item._id });
            key_s = (0, _redisKey.getRedisKey)(model, 's', { _id: item._id });
            _context4.next = 9;
            return (0, _redis.$r)().delAsync(key_d);

          case 9:
            result1 = _context4.sent;
            _context4.next = 12;
            return (0, _redis.$r)().delAsync(key_s);

          case 12:
            result2 = _context4.sent;
            _context4.next = 15;
            return (0, _redis.$r)().delAsync(key_c);

          case 15:
            result3 = _context4.sent;

            debug('_deleteOne from redis', (0, _stringify2.default)({ key_d: key_d, key_s: key_s, key_c: key_c, result1: result1, result2: result2, result3: result3 }));
            _context4.next = 19;
            return (0, _mqExpire.emitRedisUpdateEvent)(model, _mqExpire.REDIS_UPDATE_ACTION.REMOVE_ONE, item);

          case 19:
            return _context4.abrupt('return', item);

          case 20:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function _deleteOne(_x7, _x8, _x9) {
    return _ref5.apply(this, arguments);
  };
}();

/**
 * 更新单条信息,返回更新的记录
 * @param {string} model
 * @param {object} where
 * @param {object} args
 * @param {object} options
 */


var _updateOne = exports._updateOne = function () {
  var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(model, where, args) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { new: true };
    var res, item, key_d, oldItem, strOldItem, result;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return (0, _ops._updateOne)(model, where, args, options);

          case 2:
            res = _context5.sent;
            item = res.items && res.items[0];

            if (item) {
              _context5.next = 7;
              break;
            }

            debug('error! _updateOne fail! null item!');
            return _context5.abrupt('return', null);

          case 7:
            key_d = (0, _redisKey.getRedisKey)(model, 'd', item._id);
            oldItem = null;
            _context5.next = 11;
            return (0, _redis.$r)().getAsync(key_d);

          case 11:
            strOldItem = _context5.sent;

            if (strOldItem) {
              // 更新前的item在redis中出现,表示曾经被用过,则满足此item的相关查询需要重新查
              oldItem = JSON.parse(strOldItem);
              // await emitRedisUpdateEvent(model, REDIS_UPDATE_ACTION.UPDATE_ONE_PRE, JSON.parse(strOldItem));
            }
            _context5.next = 15;
            return (0, _redis.$r)().setexAsync(key_d, EX_SECONDS, (0, _stringify2.default)(item));

          case 15:
            result = _context5.sent;

            debug('_updateOne to redis', (0, _stringify2.default)({ key_d: key_d, result: result }));
            _context5.next = 19;
            return (0, _mqExpire.emitRedisUpdateEvent)(model, _mqExpire.REDIS_UPDATE_ACTION.UPDATE_ONE, oldItem ? [oldItem, item] : item);

          case 19:
            return _context5.abrupt('return', res);

          case 20:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function _updateOne(_x10, _x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}();

/**
 * 创建多条,这里不用populates,因为都是创建一个表的东西,不会关联插入.
 * @param {string} model
 * @param {array} items
 */


var _createMany = exports._createMany = function () {
  var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(model, items) {
    var result, dbResult, dbFlatEntityMap, collections, i, nModel, collection, ids, j, id, item, key_d, resultTmp;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return (0, _ops._createMany)(model, items);

          case 2:
            result = _context6.sent;
            dbResult = result['result'];
            dbFlatEntityMap = dbResult['entities'];

            if (result) {
              _context6.next = 8;
              break;
            }

            debug('warning! _createMany fail!');
            return _context6.abrupt('return', result);

          case 8:

            // 遍历entity,设置d键.
            collections = (0, _getOwnPropertyNames2.default)(dbFlatEntityMap);
            i = 0;

          case 10:
            if (!(i < collections.length)) {
              _context6.next = 28;
              break;
            }

            nModel = collections[i];
            collection = dbFlatEntityMap[nModel];
            ids = (0, _getOwnPropertyNames2.default)(collection);
            j = 0;

          case 15:
            if (!(j < ids.length)) {
              _context6.next = 25;
              break;
            }

            id = ids[j];
            item = collection[id];
            key_d = (0, _redisKey.getRedisKey)(nModel, 'd', id);
            _context6.next = 21;
            return (0, _redis.$r)().setexAsync(key_d, EX_SECONDS, (0, _stringify2.default)(item));

          case 21:
            resultTmp = _context6.sent;

          case 22:
            j++;
            _context6.next = 15;
            break;

          case 25:
            i++;
            _context6.next = 10;
            break;

          case 28:
            _context6.next = 30;
            return (0, _mqExpire.emitRedisUpdateEvent)(model, _mqExpire.REDIS_UPDATE_ACTION.CREATE_MANY, result.items);

          case 30:
            return _context6.abrupt('return', result);

          case 31:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function _createMany(_x14, _x15) {
    return _ref7.apply(this, arguments);
  };
}();

/**
 * 批量更新.
 * TODO: 需要更新所有影响到的_id的数据到redis中?
 * @param {string} model
 * @param {object} where
 * @param {object} args
 * @param {object} options
 */


var _updateMany = exports._updateMany = function () {
  var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(model, where, args, options) {
    var result;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return (0, _ops._updateMany)(model, where, args, options);

          case 2:
            result = _context7.sent;
            _context7.next = 5;
            return (0, _mqExpire.emitRedisUpdateEvent)(model, _mqExpire.REDIS_UPDATE_ACTION.UPDATE_MANY, result.items);

          case 5:
            return _context7.abrupt('return', result);

          case 6:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function _updateMany(_x16, _x17, _x18, _x19) {
    return _ref8.apply(this, arguments);
  };
}();

/**
 * 根据_id删除某条记录.
 * @param {string} model
 * @param {string} _id
 */


var _deleteOneById = exports._deleteOneById = function () {
  var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(model, _id) {
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return _deleteOne(model, { _id: _id });

          case 2:
            return _context8.abrupt('return', _context8.sent);

          case 3:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function _deleteOneById(_x20, _x21) {
    return _ref9.apply(this, arguments);
  };
}();

/**
 * 根据id更新记录
 * @param {string} model
 * @param {string} _id
 * @param {object} args
 * @param {object} options
 */


var _updateOneById = exports._updateOneById = function () {
  var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(model, _id, args) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { new: true };
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return _updateOne(model, { _id: _id }, args, options);

          case 2:
            return _context9.abrupt('return', _context9.sent);

          case 3:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function _updateOneById(_x22, _x23, _x24) {
    return _ref10.apply(this, arguments);
  };
}();

var _findOne = exports._findOne = function () {
  var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10(model, where, options) {
    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            if (!options) options = {};
            _context10.next = 3;
            return _retrieve(model, (0, _extends3.default)({}, options, { where: where }));

          case 3:
            return _context10.abrupt('return', _context10.sent);

          case 4:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function _findOne(_x26, _x27, _x28) {
    return _ref11.apply(this, arguments);
  };
}();

/**
 * 根据id获得某条记录.
 * @param {string} model
 * @param {string} _id
 * @param {object} options
 */


var _findOneById = exports._findOneById = function () {
  var _ref12 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11(model, _id, options) {
    return _regenerator2.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.next = 2;
            return _findOne(model, { _id: _id }, options);

          case 2:
            return _context11.abrupt('return', _context11.sent);

          case 3:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));

  return function _findOneById(_x29, _x30, _x31) {
    return _ref12.apply(this, arguments);
  };
}();

/**
 * 从redis中去数据.没有返回null.
 * @param {string} model
 * @param {object} options
 */


var _retrieveFromRedis = function () {
  var _ref13 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee12(model, options) {
    var _ref14, where, sort, select, limit, skip, populates, key_c, key_s, data_c_exists, data_c, score1, score2, count, data, items, entityMap, i, populate, nModel, typemodel, missing, _i2, key_d, item, _i3, nIds, _nModel, _populate, _typemodel, attrs, subitem, j, attr, _i4, _nId, key_d_populate, item_populate, result;

    return _regenerator2.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _ref14 = options || {}, where = _ref14.where, sort = _ref14.sort, select = _ref14.select, limit = _ref14.limit, skip = _ref14.skip, populates = _ref14.populates;

            if (!skip) skip = 0;
            if (!limit) limit = 1;

            // 两个主key
            key_c = (0, _redisKey.getRedisKey)(model, 'c', where, sort);
            key_s = (0, _redisKey.getRedisKey)(model, 's', where, sort);

            // 查看c-key缓存是否存在.

            _context12.next = 7;
            return (0, _redis.$r)().existsAsync(key_c);

          case 7:
            data_c_exists = _context12.sent;

            if (data_c_exists) {
              _context12.next = 10;
              break;
            }

            return _context12.abrupt('return', null);

          case 10:
            _context12.next = 12;
            return (0, _redis.$r)().getAsync(key_c);

          case 12:
            data_c = _context12.sent;

            debug('_retrieveFromRedis ', (0, _stringify2.default)({ model: model, options: options, skip: skip, limit: limit, key_c: key_c, key_s: key_s, data_c: data_c }));
            data_c = parseInt(data_c);

            if (!(data_c <= 0)) {
              _context12.next = 17;
              break;
            }

            return _context12.abrupt('return', {
              items: [],
              result: {
                entities: {},
                result: data,
                total: data_c,
                count: 0,
                limit: limit,
                skip: skip
              }
            });

          case 17:

            // 根据skip和limit及总数data_c计算此次需取的条数.
            score1 = skip;
            score2 = skip + limit;

            if (score2 > data_c) {
              // 超过最大个数限制, 使用data_c作为最大个数.
              score2 = data_c;
            }
            count = score2 - score1;
            _context12.next = 23;
            return (0, _redis.$r)().zrangebyscoreAsync(key_s, score1, score2 - 1);

          case 23:
            data = _context12.sent;

            if (!(!data || data.length < count)) {
              _context12.next = 26;
              break;
            }

            return _context12.abrupt('return', null);

          case 26:
            _context12.next = 28;
            return (0, _redis.$r)().expireAsync(key_s, EX_SECONDS);

          case 28:
            _context12.next = 30;
            return (0, _redis.$r)().expireAsync(key_c, EX_SECONDS);

          case 30:

            // 缓存数据够了. 处理返回数据
            items = [];
            // 根据populates获取得到entity内容.

            entityMap = (0, _defineProperty3.default)({}, model, {});

            if (populates) {
              for (i = 0; i < populates.length; i++) {
                populate = populates[i];
                nModel = null;
                typemodel = (0, _type2.default)(populate.model);

                if (typemodel === 'string') nModel = populate.model;else if (typemodel === 'array') nModel = populate.model[0];else {
                  debug('warning! not support populate!', (0, _stringify2.default)({ populate: populate, typemodel: typemodel }));
                }
                entityMap[nModel] = {};
              }
            }

            // 生成entity数据.
            missing = [];
            _i2 = 0;

          case 35:
            if (!(_i2 < data.length)) {
              _context12.next = 86;
              break;
            }

            key_d = (0, _redisKey.getRedisKey)(model, 'd', data[_i2]);
            _context12.next = 39;
            return (0, _redis.$r)().getAsync(key_d);

          case 39:
            item = _context12.sent;

            if (item) {
              _context12.next = 44;
              break;
            }

            debug('warning! missing cache!', key_d);
            missing.push(data[_i2]);
            return _context12.abrupt('continue', 83);

          case 44:
            _context12.next = 46;
            return (0, _redis.$r)().expireAsync(key_d, EX_SECONDS);

          case 46:
            item = JSON.parse(item);
            items.push(item);
            entityMap[model][data[_i2]] = item;
            // 遍历populates.

            if (!populates) {
              _context12.next = 83;
              break;
            }

            _i3 = 0;

          case 51:
            if (!(_i3 < populates.length)) {
              _context12.next = 83;
              break;
            }

            nIds = null;
            _nModel = null;
            _populate = populates[_i3];

            if (!_populate) {
              _context12.next = 80;
              break;
            }

            _typemodel = (0, _type2.default)(_populate.model);

            if (_typemodel === 'string') _nModel = _populate.model;else if (_typemodel === 'array') _nModel = _populate.model[0];else {
              debug('warning! not support populate!', (0, _stringify2.default)({
                populate: _populate,
                typemodel: _typemodel
              }));
            }

            if (_populate.path) {
              attrs = _populate.path.split('.');
              subitem = item;

              for (j = 0; j < attrs.length; j++) {
                attr = attrs[j] && attrs[j].trim();

                if (attr) {
                  if (j === attrs.length - 1) {
                    if (_typemodel === 'string') nIds = [subitem[attr]];else if (_typemodel === 'array') nIds = subitem[attr];
                    // id数组.
                    else {
                        debug('warning! not support populate!', (0, _stringify2.default)({
                          populate: _populate,
                          typemodel: _typemodel
                        }));
                      }
                  }
                  subitem = subitem[attr];
                }
              }
            }
            // 根据id或id列表填充entity.

            if (!(nIds && _nModel)) {
              _context12.next = 79;
              break;
            }

            _i4 = 0;

          case 61:
            if (!(_i4 < nIds.length)) {
              _context12.next = 77;
              break;
            }

            _nId = nIds[_i4];
            key_d_populate = (0, _redisKey.getRedisKey)(_nModel, 'd', _nId);
            _context12.next = 66;
            return (0, _redis.$r)().getAsync(key_d_populate);

          case 66:
            item_populate = _context12.sent;

            if (!(entityMap[_nModel] && item_populate)) {
              _context12.next = 73;
              break;
            }

            _context12.next = 70;
            return (0, _redis.$r)().expireAsync(key_d_populate, EX_SECONDS);

          case 70:
            entityMap[_nModel][_nId] = JSON.parse(item_populate);
            _context12.next = 74;
            break;

          case 73:
            debug('warning! entities map missing populate key!', key_d_populate);

          case 74:
            _i4++;
            _context12.next = 61;
            break;

          case 77:
            _context12.next = 80;
            break;

          case 79:
            debug('warning! entities map missing model or id!', _nModel, nId);

          case 80:
            _i3++;
            _context12.next = 51;
            break;

          case 83:
            _i2++;
            _context12.next = 35;
            break;

          case 86:
            if (!(missing.length > 0)) {
              _context12.next = 89;
              break;
            }

            // 丢失了部分条目的内容.
            debug('warning! missing ', (0, _stringify2.default)({ model: model, missing: missing }));
            return _context12.abrupt('return', null);

          case 89:
            result = {
              entities: entityMap,
              result: data,
              total: data_c,
              count: data.length,
              limit: limit,
              skip: skip
            };
            // debug('_retrieve ok from redis', result, items);

            return _context12.abrupt('return', {
              items: items,
              result: result
            });

          case 91:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function _retrieveFromRedis(_x32, _x33) {
    return _ref13.apply(this, arguments);
  };
}();

/**
 * 删除redis-key
 * @param model 数据库表名(映射在nodejs的模块名字)
 * @param type  键类型
 * @param where_data 查询参数,不同类型参数不同，但基本都是数据记录字段
 *  d类型：则$params为主键{id:2}或联合主键{uid:1, book_id:2}
 *  s类型：则为查询条件，甚至包含$order_by
 *  w类型：为查询条件
 *  c类型：为某个查询的总条数
 */


var delRedisKey = exports.delRedisKey = function () {
  var _ref15 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee13(model, type, where_data, sort_data) {
    var r_key, r_key_prefix, r_keys, result, i;
    return _regenerator2.default.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            if (!(type == 'd')) {
              _context13.next = 7;
              break;
            }

            //当为数据记录型key时,where_data为_id
            r_key = (0, _redisKey.getRedisKey)(model, 'd', where_data);
            _context13.next = 4;
            return (0, _redis.$r)().delAsync(r_key);

          case 4:
            return _context13.abrupt('return', _context13.sent);

          case 7:
            if (!(type == 's' || type == 'c')) {
              _context13.next = 26;
              break;
            }

            r_key_prefix = (0, _redisKey.getRedisKey)(model, type, where_data, sort_data);
            _context13.next = 11;
            return (0, _redis.$r)().keysAsync(r_key_prefix + '*');

          case 11:
            r_keys = _context13.sent;
            result = [];
            i = 0;

          case 14:
            if (!(i < r_keys.length)) {
              _context13.next = 23;
              break;
            }

            _context13.t0 = result;
            _context13.next = 18;
            return (0, _redis.$r)().delAsync(r_keys[i]);

          case 18:
            _context13.t1 = _context13.sent;

            _context13.t0.push.call(_context13.t0, _context13.t1);

          case 20:
            i++;
            _context13.next = 14;
            break;

          case 23:
            return _context13.abrupt('return', true);

          case 26:
            debug('error! not support type:' + type);
            return _context13.abrupt('return', false);

          case 28:
          case 'end':
            return _context13.stop();
        }
      }
    }, _callee13, this);
  }));

  return function delRedisKey(_x34, _x35, _x36, _x37) {
    return _ref15.apply(this, arguments);
  };
}();

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _type = require('../utils/type');

var _type2 = _interopRequireDefault(_type);

var _ops = require('../ops');

var _redis = require('./redis');

var _redisKey = require('./redisKey');

var _mqExpire = require('./mqExpire');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('yh:mongo:dbcached:ops'); /**
                                                            * redis缓存版本数据库处理(对dbmongo/opsV2.js的缓存化)
                                                            * 数据格式参见dbmongo/opsV2.js
                                                            */
/**
 * 带redis缓存的mongodb数据操作,注意事项:
 * 1. 数据库映射
 * 2. 单表增删改查,不做关联表的查询. 关联表的查询分多次操作进行. (存疑???)
 * 3. 单表均有_id字段作为标识
 *
 * 增删改查中用到的redis-key,共有如下类型: key的类型: 单条数据d、列表数据s、单条查询w、条数查询c
 * 1. 单条数据d: key为"<模块名>_d:<_id>",值为json,使用hmset方式存入redis.
 *   如: { key: 'user_d:2', value: {id:2,...} }
 * 2. 列表数据s: retrieve获得，分两部分存储，实体和列表，列表是一个有序集合,内容为id数组,score为数据的排序,key为"<模块名>_s:<json_encode(查询条件)>"。如：
 *   列表值：{ key: 'product_s:{category:2}', value:[_id1,_id2,_id3,_id4,_id5]}
 *   数据值为上面单条d类型
 * 3. 单条查询(转化成列表数据s查询): _findOneById/_findOne获得，分两部分存储，查询条件及id或id组合(与列表数据s差不多)。
 *   查询条件：{ key: 'product_s:{code:21232}', value:['2']}
 *   数据值为上面单条d类型
 * 4. 条数查询c: 与列表数据查询几乎一致，只是返回条数。
 *   例子: { key: 'product_c:{status:2}', value:'200'}
 *
 * 数据访问时序问题(包含redis中key删除更新时机问题.以下以product中_id为10为例)
 * 1. 查询单条记录(根据id查询或根据条件查询,id查询也会转成条件查询)
 *  + 首先从redis中找key为"product_s:{_id:10}"的值,找到则继续找key为"product_d:10"的值,找到则返回.
 *  + 未找到则从数据库中去找,找到就更新到redis中"product_s:{_id:10}"和"product_d:10",并返回.
 *  + 未从数据库中找到,则直接返回空.
 * 2. 创建记录.
 *  + 首先做参数检查,参数不合法直接退回.
 *  + 一些逻辑判断,比如是否可以创建,一般根据条件判断是否有相同的记录存在.(可调用上面查询单个接口)
 *  + 确认可以创建记录后,到数据库创建记录.
 *  + 查询刚创建的记录(调用上面查询单条记录方法,key自动会进入redis)
 *  + 返回记录.
 * 3. 更新记录(一般更新某一条id的记录).
 *  + 首先做参数检查,参数不合法直接退回.
 *  + 计算或整理得到查询条件{x:xxx1,y:yyy1,z:zzz1}.
 *  + 一些逻辑判断,比如是否可以更新,一般先获取原记录,判断字段权限等.(可调用上面查询单个接口)
 *  + 确认可以更新记录后,到数据库更新记录.
 *  + 将数据库中更新的记录*强制更新*到redis中.key为"product_d:10"和"product_s:{_id:10}"或"product_s:<查询条件>"
 *  + 返回记录
 * 4. 删除记录(一般删除某一条id的记录).
 *  + 首先做参数检查
 *  + 一些逻辑判断,比如是否可以删除,一般先获取原记录,判断权限等.(可调用上面查询单个接口)
 *  + 确认可以删除后,先删除redis中"product_d:10"或"product_s:<查询条件>"
 *  + 删除数据库中记录.
 * 5. 查询多条记录.
 *  + 首先做参数检查
 *  + 一些逻辑判断,比如判断权限,此人可显示字段等.
 *  + 计算或整理得到查询条件where:{x:xxx1,y:yyy1,z:zzz1},排序条件sort,populate信息,分页信息limit/skip,
 *  + 从redis中根据查询条件"product_s:{x:xxx1,y:yyy1,z:zzz1}"获取值,有则根据分页信息limit/skip及总数得到当前分页应该返回的内容.
 *  + 如果redis中没有相应内容,则进行数据库查询,并添加进product_s:{x:xxx1,y:yyy1,z:zzz1}有序集合中.
 *  + 返回结果数据.
 * 6. 批量更新记录(后台使用:根据条件更新一系列记录)
 * 7. 批量删除记录(后台使用:根据条件删除一系列记录)
 *
 * 数据查询的redis缓存穿透问题:
 * 某个时刻某个查询结果不在redis中,若此刻很多人同时请求此查询,则所有人都将直接查询数据库,这就是缓存穿透.
 * 而创建/更新/删除请求必然会进行到数据库层,并且一般都是一人操作,所以不会有此问题.
 * 穿透的情况:
 * 1. 突然间很多请求访问一个不存在redis键,触发频繁访问数据库.
 * 2.
 *
 * redis数据与mongodb中数据一致性问题:
 * 1. 当创建/删除时,在redis中的列表查询数据还是旧的,需要有一套机制更新这些查询.
 *  --- 相关模块的s型查询需要更新,如何更新?根据where和sort条件(是否要包含populate条件)构建查询,
 *  --- 遍历其中元素score值,将score范围内的值都更新
 * 2. 当更新数据时,redis中还是旧数据. ---更新完数据后,强制更新d类型相关id数据.
 *
 *
 */

var _getFirstOfRetrieve = exports._getFirstOfRetrieve = _ops._getFirstOfRetrieve;
var _mergeDbOfResult = exports._mergeDbOfResult = _ops._mergeDbOfResult;

// export const EX_SECONDS = 24 * 60 * 60; // 键过期默认秒数.
var EX_SECONDS = exports.EX_SECONDS = 60 * 60;