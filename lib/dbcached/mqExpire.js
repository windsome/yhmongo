'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dealCKey = exports.timelyCheck = exports.emitRedisUpdateEvent = exports.REDIS_UPDATE_ACTION = undefined;

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

// 第二级: c型key集合

/**
 * 将{model,items} 相关的所有ckey及skey找到,删除,并加入队列等待后续自动更新.
 * 1. 找到所有model的ckey
 * 2. 找到所有能匹配这些items的ckey.
 * 3. 将所有这些ckey加前缀x-,用来与更新后的做比较.(删掉后,主动的查询将会发起实际的数据库查询,不再用缓存中)
 * 4. 将所有这些匹配的ckey放入队列中,等待后续查询.
 * @param {string} model 表名
 * @param {integer} action 触发的行为,见上表.
 * @param {array/string} ids 影响的id列表,可以为空.
 */
var emitRedisUpdateEvent = exports.emitRedisUpdateEvent = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(model, action, items) {
    var typeofitems, r_key_prefix, r_keys, result1, reg_s_is_id, i, r_key, result2, _i, _r_key, s_query, match, j, result3, _i2, _$r, _i3, _r_key2, job;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // debug('emitRedisUpdateEvent', model, action, items);
            // 整理items成数组.
            if (items) {
              typeofitems = (0, _type2.default)(items);

              if (typeofitems !== 'array') items = [items];
            }

            // 1. 查询出所有此model的c型key.
            r_key_prefix = model + _redisKey.SEPARATOR + 'c';
            _context2.next = 4;
            return (0, _redis.$r)().keysAsync(r_key_prefix + '*');

          case 4:
            r_keys = _context2.sent;

            // debug('emitRedisUpdateEvent[2]', r_key_prefix, r_keys);
            // 2. 去除c:{_id:xxxx}型key.(这部分key不用变,增删时已经自动增删,更改时不用变化)
            result1 = [];
            reg_s_is_id = new RegExp('' + r_key_prefix + _redisKey.SEPARATOR + '{"_id":"[a-z,A-Z,0-9]*"}');
            i = 0;

          case 8:
            if (!(i < r_keys.length)) {
              _context2.next = 16;
              break;
            }

            r_key = r_keys[i];

            if (!reg_s_is_id.test(r_key)) {
              _context2.next = 12;
              break;
            }

            return _context2.abrupt('continue', 13);

          case 12:
            result1.push(r_key);

          case 13:
            i++;
            _context2.next = 8;
            break;

          case 16:
            // debug('emitRedisUpdateEvent[3]', result1);
            // 3. 找到查询条件能匹配items的ckey
            result2 = [];
            _i = 0;

          case 18:
            if (!(_i < result1.length)) {
              _context2.next = 36;
              break;
            }

            _r_key = result1[_i];
            s_query = (0, _redisKey.parseRedisKey)(_r_key);
            match = false;
            j = 0;

          case 23:
            if (!(j < items.length)) {
              _context2.next = 30;
              break;
            }

            if (!(0, _query.itemFulfillQuery)(items[j], s_query.where)) {
              _context2.next = 27;
              break;
            }

            // 只要匹配到一个item,这个ckey就需要重新查询.
            match = true;
            return _context2.abrupt('break', 30);

          case 27:
            j++;
            _context2.next = 23;
            break;

          case 30:
            if (!match) {
              _context2.next = 33;
              break;
            }

            result2.push(_r_key);
            return _context2.abrupt('continue', 33);

          case 33:
            _i++;
            _context2.next = 18;
            break;

          case 36:
            // debug('emitRedisUpdateEvent[4]', result2);
            // 4. 将result2中ckey插入队列.
            result3 = [];

            for (_i2 = 0; _i2 < result2.length; _i2++) {
              result3.push(new Date().getTime());
              result3.push(result2[_i2]);
            }

            if (!(result3.length > 0)) {
              _context2.next = 41;
              break;
            }

            _context2.next = 41;
            return (_$r = (0, _redis.$r)()).zaddAsync.apply(_$r, [REDIS_UPDATE_SET_KEY].concat(result3));

          case 41:
            _i3 = 0;

          case 42:
            if (!(_i3 < result2.length)) {
              _context2.next = 49;
              break;
            }

            _r_key2 = result2[_i3];
            _context2.next = 46;
            return (0, _redis.$r)().renameAsync(_r_key2, 'x-' + _r_key2);

          case 46:
            _i3++;
            _context2.next = 42;
            break;

          case 49:
            _context2.next = 51;
            return (0, _redis.$b)().add({
              action: action
            });

          case 51:
            job = _context2.sent;

            debug('emitRedisUpdateEvent[5] create job ' + job.id, (0, _stringify2.default)({ type: 1, action: action, items: items, toUpdateKeys: result2 }));

            return _context2.abrupt('return', result3);

          case 54:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function emitRedisUpdateEvent(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * 遍历REDIS_UPDATE_EVENT_KEY有序集合(找最旧的,一个个处理),处理后更新到REDIS_UPDATE_SET_KEY集合中.
 * 首先遍历REDIS_UPDATE_EVENT_KEY的原因是,减少重复键值处理量.
 * 找REDIS_UPDATE_SET_KEY中最旧的一个key,进行更新.
 * 下次遍历继续进行.
 */


var timelyCheck = exports.timelyCheck = function () {
  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
    var result, count, job;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _redis.$r)().zrangeAsync(REDIS_UPDATE_SET_KEY, 0, 0, 'withscores');

          case 2:
            result = _context3.sent;

            debug('timelyCheck', REDIS_UPDATE_SET_KEY, result && (0, _stringify2.default)(result));

            if (!(result && result.length > 0)) {
              _context3.next = 9;
              break;
            }

            _context3.next = 7;
            return (0, _redis.$r)().zremAsync(REDIS_UPDATE_SET_KEY, result[0]);

          case 7:
            _context3.next = 9;
            return dealCKey(result[0]);

          case 9:
            _context3.next = 11;
            return (0, _redis.$r)().zcardAsync(REDIS_UPDATE_SET_KEY);

          case 11:
            count = _context3.sent;

            if (!(count > 0)) {
              _context3.next = 17;
              break;
            }

            _context3.next = 15;
            return (0, _redis.$b)().add({
              count: count
            });

          case 15:
            job = _context3.sent;

            debug('timelyCheck create job ' + job.id + ' {type:2, count:' + count + '}');

          case 17:
            debug('+timelyCheck finish!');
            return _context3.abrupt('return', true);

          case 19:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function timelyCheck() {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * 处理某个c型key的更新及其对应s型key的更新.
 * 注意: 当c型key的值为0时,对应s型key是不存在的.
 * @param {string} r_ckey redis中c型查询key.
 */


var dealCKey = exports.dealCKey = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(r_ckey) {
    var s_query, model, key_c, data_c, r_skey, result, arr, start, prev, i, curr, page_count, _i4, section, s_start, s_stop, s_count, s_try, j, skip, limit, options, _result, dbResult, dbFlatEntityMap, dbFlatResult, dbFlatSkip, collections, _i5, nModel, collection, ids, _j, id, item, key_d, _resultTmp, resultTmp, argsArray, _i6, _$r2;

    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (r_ckey) {
              _context4.next = 3;
              break;
            }

            debug('error! r_ckey is null!');
            return _context4.abrupt('return', false);

          case 3:
            s_query = (0, _redisKey.parseRedisKey)(r_ckey);
            model = s_query.model;

            // 首先更新总数.

            key_c = (0, _redisKey.getRedisKey)(model, 'c', s_query.where, s_query.sort);
            _context4.next = 8;
            return (0, _ops._count)(model, {
              where: s_query.where,
              sort: s_query.sort
            });

          case 8:
            data_c = _context4.sent;

            // await $r().setexAsync(key_c, EX_SECONDS, data_c);// 放到后面更新.

            r_skey = (0, _redisKey.getRedisKey)(model, 's', s_query.where, s_query.sort);
            // 获取所有内容,ZRANGE key start stop [WITHSCORES]

            _context4.next = 12;
            return (0, _redis.$r)().zrangeAsync(r_skey, 0, -1, 'withscores');

          case 12:
            result = _context4.sent;

            if (!(!result || result.length == 0)) {
              _context4.next = 17;
              break;
            }

            _context4.next = 16;
            return (0, _redis.$r)().setexAsync(key_c, _ops2.EX_SECONDS, data_c);

          case 16:
            return _context4.abrupt('return', true);

          case 17:

            // debug('dealRedisUpdate s_query', r_skey, s_query, result);
            // 处理scores值,得到序列段.
            arr = [];
            start = 0;
            prev = -1;
            i = 0;

          case 21:
            if (!(i < result.length)) {
              _context4.next = 36;
              break;
            }

            if (!(i % 2 == 1)) {
              _context4.next = 33;
              break;
            }

            curr = parseInt(result[i]);

            if (curr - prev == 1 || curr - prev == 0) {
              _context4.next = 29;
              break;
            }

            // 已中断,不再连续, 000011122223中间有相同的也算连续.
            arr.push([start, prev]);
            start = curr;
            prev = curr;
            return _context4.abrupt('continue', 33);

          case 29:
            if (!(i == result.length - 1)) {
              _context4.next = 32;
              break;
            }

            // 结束了,将最后一段插入.
            arr.push([start, curr]);
            return _context4.abrupt('break', 36);

          case 32:
            prev = curr;

          case 33:
            i++;
            _context4.next = 21;
            break;

          case 36:
            debug('dealCKey get query region(need to update):', r_skey, arr);

            // 分段处理数据库查询,更新到redis,如果某段超过100条,则以100为单位分页查询更新.
            page_count = 100;
            _i4 = 0;

          case 39:
            if (!(_i4 < arr.length)) {
              _context4.next = 96;
              break;
            }

            section = arr[_i4];
            s_start = section[0];
            s_stop = section[1];
            s_count = s_stop - s_start + 1;
            s_try = parseInt((s_count + page_count - 1) / page_count);
            j = 0;

          case 46:
            if (!(j < s_try)) {
              _context4.next = 93;
              break;
            }

            // 分页查询并更新.
            skip = s_start + page_count * j;
            limit = page_count;

            if (j == s_try - 1) {
              // 最后一页,数量不够page_count,则用总条目-已处理条目.
              limit = s_count - j * page_count;
            }
            options = { where: s_query.where, sort: s_query.sort, limit: limit, skip: skip };
            _context4.next = 53;
            return (0, _ops._retrieveNoTotal)(model, options);

          case 53:
            _result = _context4.sent;

            // debug(
            //   'dealRedisUpdate _dbRetrieveNoTotal',
            //   { section, s_start, s_stop, s_count, s_try },
            //   model,
            //   options,
            //   result
            // );

            // 将entity数据插入redis.
            dbResult = _result['result'];
            dbFlatEntityMap = dbResult['entities'];
            dbFlatResult = dbResult['result'];
            dbFlatSkip = dbResult['skip'];

            if (!dbFlatSkip) dbFlatSkip = 0;

            // 遍历entity,设置d键.
            collections = (0, _getOwnPropertyNames2.default)(dbFlatEntityMap);
            _i5 = 0;

          case 61:
            if (!(_i5 < collections.length)) {
              _context4.next = 79;
              break;
            }

            nModel = collections[_i5];
            collection = dbFlatEntityMap[nModel];
            ids = (0, _getOwnPropertyNames2.default)(collection);
            _j = 0;

          case 66:
            if (!(_j < ids.length)) {
              _context4.next = 76;
              break;
            }

            id = ids[_j];
            item = collection[id];
            key_d = (0, _redisKey.getRedisKey)(nModel, 'd', id);
            _context4.next = 72;
            return (0, _redis.$r)().setexAsync(key_d, _ops2.EX_SECONDS, (0, _stringify2.default)(item));

          case 72:
            _resultTmp = _context4.sent;

          case 73:
            _j++;
            _context4.next = 66;
            break;

          case 76:
            _i5++;
            _context4.next = 61;
            break;

          case 79:
            _context4.next = 81;
            return (0, _redis.$r)().zremrangebyscoreAsync(r_skey, dbFlatSkip, dbFlatSkip + limit - 1);

          case 81:
            resultTmp = _context4.sent;

            // debug('dealRedisUpdate zremrangebyscore result:', r_skey, resultTmp);
            // 更新数据到有序集合.
            argsArray = [];

            for (_i6 = 0; _i6 < dbFlatResult.length; _i6++) {
              argsArray.push(dbFlatSkip + _i6);
              argsArray.push(dbFlatResult[_i6]);
            }

            if (!(argsArray.length > 0)) {
              _context4.next = 90;
              break;
            }

            _context4.next = 87;
            return (_$r2 = (0, _redis.$r)()).zaddAsync.apply(_$r2, [r_skey].concat(argsArray));

          case 87:
            resultTmp = _context4.sent;
            _context4.next = 90;
            return (0, _redis.$r)().expireAsync(r_skey, _ops2.EX_SECONDS);

          case 90:
            j++;
            _context4.next = 46;
            break;

          case 93:
            _i4++;
            _context4.next = 39;
            break;

          case 96:
            _context4.next = 98;
            return (0, _redis.$r)().setexAsync(key_c, _ops2.EX_SECONDS, data_c);

          case 98:
            return _context4.abrupt('return', true);

          case 99:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function dealCKey(_x6) {
    return _ref4.apply(this, arguments);
  };
}();

exports.initExpire = initExpire;

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _type = require('../utils/type');

var _type2 = _interopRequireDefault(_type);

var _redisKey = require('./redisKey');

var _query = require('./query');

var _redis = require('./redis');

var _ops = require('../ops');

var _ops2 = require('./ops');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('yh:mongo:dbcached:mqExpire'); /**
                                                                 * redis缓存更新队列.
                                                                 * 当数据中有数据插入,删除,更新时,原来的各种查询将不再准确.所以需要更新其中内容.
                                                                 * 我们分情况讨论:
                                                                 * 1. _createOne/_createMany,所有与此model相关的s,c型数据需要更新,
                                                                 * 2. _deleteOne,所有与此model相关的s型数据中有此_id的数据均要删掉此_id,并且更新相关的c型键
                                                                 * 3. _updateOne/_updateMany,所有与此model相关的s,c型数据需要更新,
                                                                 * TODO: 感觉上缺一个_deleteMany().
                                                                 * TODO: _updateMany()返回的是更新的条数,不是更新后的内容列表.所以,redis中相关数据是老数据,怎么处理?
                                                                 *
                                                                 * 前提: 假设redis中d型数据与mongodb中一致,我们考虑更新s型数据的情况.
                                                                 * 具体方法1为:(本考虑用队列,但其实是集合比较好,因为集合中数据不会重复)
                                                                 * 1. 将要更新的s型key插入集合,并同时打印当前集合内容.
                                                                 * 2. 另有一个队列,实时取出内容,并做更新
                                                                 *  + 解析key值为where和sort条件,
                                                                 *  + 计算得到c键的键名c-key,并获取其键值data_c.
                                                                 *  + 利用zrange(s-key,0,data_c,withscores)得到s-key的所有内容及相关score值.
                                                                 *  + 分析scores的连续区间段,根据区间段去查询相关数据,更新到s-key中,全部段更新完后,更新c-key的值.
                                                                 *  + 完成更新
                                                                 * 方法2为: 直接更新c-key的内容,即更新新的数据总条目,s-key中有重复或漏掉均不管.
                                                                 * 方法3为: 首先更新c-key的内容,并将所有该model的s-key全部复制一份,称为过时的,
                                                                 *          后续的查询中首先检查所查询的那页数据有没有过时,过时则进行数据库查询,
                                                                 *          并从过时key中删掉过时的那部分.如果没有过时的或者过时key不存在,则继续原步骤.
                                                                 */


/// Bull队列.
// 2. 绑定任务处理函数
function initExpire() {
  var _this = this;

  (0, _redis.$b)().process(function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(job, done) {
      var data, result;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              data = job.data;

              debug('$b() process ' + job.id + ', data:' + (0, _stringify2.default)(data));
              // debug('$b() process', data);
              result = false;
              _context.prev = 3;
              _context.next = 6;
              return timelyCheck(data);

            case 6:
              result = _context.sent;
              _context.next = 12;
              break;

            case 9:
              _context.prev = 9;
              _context.t0 = _context['catch'](3);

              debug('error! $b() process!', _context.t0);

            case 12:

              done();
              // job.moveToCompleted();
              // await job.finished();
              return _context.abrupt('return', result);

            case 14:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this, [[3, 9]]);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
  ['completed', 'progress', 'error', 'waiting', 'active', 'stalled', 'failed', 'paused', 'resumed', 'cleaned', 'drained', 'removed'].map(function (evt) {
    return (0, _redis.$b)().on(evt, function (job) {
      if (evt == 'progress') {
        debug(evt + ' Job ' + job.id + ' is ' + (arguments.length <= 1 ? undefined : arguments[1]) * 100 + '% ready!');
      } else if (evt == 'waiting') {
        debug(evt + ' Job ' + job);
      } else if (evt == 'failed') {
        debug(evt + ' Job ' + job.id + ', err ' + (arguments.length <= 1 ? undefined : arguments[1]));
      } else debug(evt + ' Job ' + (job && job.id) + '!');
    });
  });
}

// // 3. 添加任务
// const job = await redisUpdateKeyQueue.add({
//   foo: 'bar'
// });

var REDIS_UPDATE_ACTION = exports.REDIS_UPDATE_ACTION = {
  CREATE_ONE: 1,
  UPDATE_ONE: 2,
  REMOVE_ONE: 3,
  CREATE_MANY: 4,
  UPDATE_MANY: 5,
  UPDATE_ONE_PRE: 6,
  UPDATE_MANY_PRE: 7
};
var REDIS_UPDATE_EVENT_KEY = 'redis_update_event_set'; // 第一级:事件集合
var REDIS_UPDATE_SET_KEY = 'redis_update_key_set'; // 第二级: s型key集合
var REDIS_UPDATE_SET_CKEY = 'redis_update_ckey_set';