'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.memCreateSchemaWithPopulates = exports._findOneById = exports._findOne = exports._updateOneById = exports._deleteOneById = exports._updateMany = exports._createMany = exports._updateOne = exports._deleteOne = exports._createOne = exports._count = exports._retrieveNoTotal = exports._retrieve = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * 基础方法:
 * 1. 查找列表_retrieve(根据id,根据条件查单个只是特殊情况)
 * 2. 创建1条_createOne
 * 3. 删除_deleteOne(根据id删除只是特殊情况)
 * 4. 更新1条_updateOne(一般根据id更新)
 * 5. [少用]创建多条记录_createMany
 * 6. [少用]更新多条记录_updateMany
 * 其他扩展方法:
 * 1. 根据id删除_deleteOneById
 * 2. 根据id更新_updateOneById
 * 3. 根据where条件查一个_findOne
 * 4. 根据id查找_findOneById
 */

/**
 * 查找模块列表.
 * @param {object} model modelName.不是modelName的原因为可能有多个db,放model可以省掉db这个参数.
 * @param {*} options 参数 { where, sort, select, limit, skip, populates }
 * 1. where 查询条件
 *  + {_id: '123123123'} // 根据id查询单条,可不带其他参数.
 *  + {phone: '13661989491'} // 根据电话查询,可以带个limit:1,不带其他参数,表示只查一条.
 *  + {name: 'windsome'} // 根据名字查询,可能匹配多条.
 * 2. sort 排序
 *  + {birth:1, createdAt:-1, 'stats.visit': -1} 1表示正序,-1表示倒序
 * 3. select 选择返回的字段
 *  + ['_id','name','birth','phone','createdAt'] 要选择的字段
 *  + ['-password'] 除了要去掉的字段,其他字段都返回,字段名前加`-`,一般情况下不会与上面情况同时使用.
 * 4. limit 数字,最多返回条数.
 * 5. skip 数字,排除前面多少条.
 * 6. populates 数组,哪些字段是要扩展出来的.
 *  + 空,表示不扩展字段
 *  + [{path:'ancestor': model:'post'}]
 *  + [{path:'desc.ancestor': model:'post'}]
 *  + [{path:'desc.ancestor': model:['post']}]
 */
var _retrieve = exports._retrieve = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(model, options) {
    var dbModel, _ref2, where, query, total, _ref3, items, result;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // debug('_retrieve', model, options);
            dbModel = (0, _db.$db)().models[model];

            if (dbModel) {
              _context.next = 3;
              break;
            }

            throw new _Errcode2.default('no such model ' + model, _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 3:
            _ref2 = options || {}, where = _ref2.where;
            query = dbModel.find(where || {});
            _context.next = 7;
            return query.count();

          case 7:
            total = _context.sent;
            _context.next = 10;
            return _retrieveNoTotal(model, options);

          case 10:
            _ref3 = _context.sent;
            items = _ref3.items;
            result = _ref3.result;

            result = (0, _extends3.default)({}, result || {}, { total: total });

            debug('_retrieve', (0, _stringify2.default)({ model: model, count: items && items.length, options: options }));
            return _context.abrupt('return', { items: items, result: result });

          case 16:
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

var _retrieveNoTotal = exports._retrieveNoTotal = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(model, options) {
    var dbModel, _ref5, where, sort, select, limit, skip, populates, query, i, populate, nModel, restPopulate, nDbModel, items, data, result;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // debug('_retrieveNoTotal', model, options);
            dbModel = (0, _db.$db)().models[model];

            if (dbModel) {
              _context2.next = 3;
              break;
            }

            throw new _Errcode2.default('no such model ' + model, _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 3:
            _ref5 = options || {}, where = _ref5.where, sort = _ref5.sort, select = _ref5.select, limit = _ref5.limit, skip = _ref5.skip, populates = _ref5.populates;
            query = dbModel.find(where || {});

            if (sort) query = query.sort(sort);
            if (select) query = query.select(select);
            if (limit) query = query.limit(limit);
            if (skip) query = query.skip(skip);
            if (populates) {
              for (i = 0; i < populates.length; i++) {
                populate = populates[i];

                if (populate) {
                  nModel = populate.model, restPopulate = (0, _objectWithoutProperties3.default)(populate, ['model']);
                  nDbModel = (0, _db.$db)().models[nModel];

                  if (nDbModel && populate.path) query = query.populate((0, _extends3.default)({}, restPopulate, {
                    model: nDbModel
                  }));
                }
              }
            }
            _context2.next = 12;
            return query.exec();

          case 12:
            items = _context2.sent;

            items = items && items.map(function (item) {
              return item.toObject();
            }) || [];
            data = normalizeItemArray(items, model, populates);
            result = (0, _extends3.default)({
              count: items.length, // 此次条数
              limit: limit, // 分页条数
              skip: skip }, data || {});


            debug('_retrieveNoTotal', (0, _stringify2.default)({ model: model, count: items && items.length, options: options }));
            return _context2.abrupt('return', { items: items, result: result });

          case 18:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function _retrieveNoTotal(_x3, _x4) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * 获取记录条数
 * @param {string} model
 * @param {object} options
 */


var _count = exports._count = function () {
  var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(model, options) {
    var dbModel, _ref7, where, query, count;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            dbModel = (0, _db.$db)().models[model];

            if (dbModel) {
              _context3.next = 3;
              break;
            }

            throw new _Errcode2.default('no such model ' + model, _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 3:
            _ref7 = options || {}, where = _ref7.where;
            query = dbModel.find(where || {});
            _context3.next = 7;
            return query.count();

          case 7:
            count = _context3.sent;

            debug('_count', (0, _stringify2.default)({ model: model, count: count, options: options }));
            return _context3.abrupt('return', count);

          case 10:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function _count(_x5, _x6) {
    return _ref6.apply(this, arguments);
  };
}();

/**
 * 创建单条记录,返回创建的记录.
 * @param {string} model
 * @param {object} args
 */


var _createOne = exports._createOne = function () {
  var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(model, args) {
    var dbModel, entity, item, data, result;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            // debug('_createOne', model, args);
            dbModel = (0, _db.$db)().models[model];

            if (dbModel) {
              _context4.next = 3;
              break;
            }

            throw new _Errcode2.default('no such model ' + model, _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 3:
            entity = new dbModel(args);
            _context4.next = 6;
            return entity.save(entity);

          case 6:
            item = _context4.sent;

            item = item && item.toObject();

            if (item) {
              _context4.next = 10;
              break;
            }

            throw new _Errcode2.default('create fail! model=' + model, _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 10:
            data = normalizeItemArray([item], model);
            result = (0, _extends3.default)({
              count: 1, // 此次条数
              limit: 1, // 分页条数
              skip: 0 }, data || {});


            debug('_createOne', (0, _stringify2.default)({ model: model, args: args, item: item }));
            return _context4.abrupt('return', { items: [item], result: result });

          case 14:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function _createOne(_x7, _x8) {
    return _ref8.apply(this, arguments);
  };
}();

/**
 * 删除一条,返回被删的记录.
 * @param {string} model
 * @param {object} where 查询条件
 * @param {object} options
 */


var _deleteOne = exports._deleteOne = function () {
  var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(model, where, options) {
    var dbModel, item;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            debug('_deleteOne', (0, _stringify2.default)({ model: model, where: where, options: options }));
            // let item = await $db().models[model].findOneAndDelete(where, options);
            // item = item && item.toObject();
            // return item;

            dbModel = (0, _db.$db)().models[model];

            if (dbModel) {
              _context5.next = 4;
              break;
            }

            throw new _Errcode2.default('no such model ' + model, _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 4:
            _context5.next = 6;
            return dbModel.findOne(where, options);

          case 6:
            item = _context5.sent;

            if (item) {
              _context5.next = 9;
              break;
            }

            throw new _Errcode2.default('no entity in ' + model + ': ' + (0, _stringify2.default)(where), _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 9:
            _context5.next = 11;
            return dbModel.deleteById(item._id);

          case 11:
            item = item && item.toObject();
            return _context5.abrupt('return', item);

          case 13:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function _deleteOne(_x9, _x10, _x11) {
    return _ref9.apply(this, arguments);
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
  var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(model, where, args) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { new: true };
    var dbModel, item, data, result;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            debug('_updateOne', (0, _stringify2.default)({ model: model, where: where, args: args, options: options }));
            dbModel = (0, _db.$db)().models[model];

            if (dbModel) {
              _context6.next = 4;
              break;
            }

            throw new _Errcode2.default('no such model ' + model, _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 4:
            _context6.next = 6;
            return dbModel.findOneAndUpdate(where, args, options);

          case 6:
            item = _context6.sent;

            item = item && item.toObject();

            if (item) {
              _context6.next = 10;
              break;
            }

            throw new _Errcode2.default('create fail! model=' + model, _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 10:
            data = normalizeItemArray([item], model);
            result = (0, _extends3.default)({
              count: 1, // 此次条数
              limit: 1, // 分页条数
              skip: 0 }, data || {});
            return _context6.abrupt('return', { items: [item], result: result });

          case 13:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function _updateOne(_x12, _x13, _x14) {
    return _ref10.apply(this, arguments);
  };
}();

/**
 * 创建多条,这里不用populates,因为都是创建一个表的东西,不会关联插入.
 * @param {string} model
 * @param {array} items
 */


var _createMany = exports._createMany = function () {
  var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(model, items) {
    var dbModel, resultDocs, data, result;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            debug('_createMany', (0, _stringify2.default)({ count: items && items.length, model: model }));
            dbModel = (0, _db.$db)().models[model];

            if (dbModel) {
              _context7.next = 4;
              break;
            }

            throw new _Errcode2.default('no such model ' + model, _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 4:
            _context7.next = 6;
            return dbModel.insertMany(items);

          case 6:
            resultDocs = _context7.sent;

            items = resultDocs && resultDocs.map(function (item) {
              return item.toObject();
            }) || [];
            // debug('_insertManyModel', items2);
            data = normalizeItemArray(items, model);
            result = (0, _extends3.default)({
              total: items.length, // 此次插入总数
              count: items.length, // 此次插入总数
              limit: items.length, // 分页条数
              skip: 0, // 分页起始条
              page: 0 }, data || {});
            return _context7.abrupt('return', { result: result, items: items });

          case 11:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function _createMany(_x16, _x17) {
    return _ref11.apply(this, arguments);
  };
}();

/**
 * 批量更新.
 * @param {string} model
 * @param {object} where
 * @param {object} args
 * @param {object} options
 */


var _updateMany = exports._updateMany = function () {
  var _ref12 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(model, where, args, options) {
    var dbModel, result;
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            debug('_updateMany', (0, _stringify2.default)({ model: model, where: where, args: args, options: options }));
            dbModel = (0, _db.$db)().models[model];

            if (dbModel) {
              _context8.next = 4;
              break;
            }

            throw new _Errcode2.default('no such model ' + model, _Errcode.EC.ERR_NO_SUCH_ENTITY);

          case 4:
            _context8.next = 6;
            return dbModel.updateMany(where, args, options);

          case 6:
            result = _context8.sent;
            return _context8.abrupt('return', result);

          case 8:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function _updateMany(_x18, _x19, _x20, _x21) {
    return _ref12.apply(this, arguments);
  };
}();

/**
 * 根据_id删除某条记录.
 * @param {string} model
 * @param {string} _id
 */


var _deleteOneById = exports._deleteOneById = function () {
  var _ref13 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(model, _id) {
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return _deleteOne(model, { _id: _id });

          case 2:
            return _context9.abrupt('return', _context9.sent);

          case 3:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function _deleteOneById(_x22, _x23) {
    return _ref13.apply(this, arguments);
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
  var _ref14 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10(model, _id, args) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { new: true };
    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.next = 2;
            return _updateOne(model, { _id: _id }, args, options);

          case 2:
            return _context10.abrupt('return', _context10.sent);

          case 3:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function _updateOneById(_x24, _x25, _x26) {
    return _ref14.apply(this, arguments);
  };
}();

var _findOne = exports._findOne = function () {
  var _ref15 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11(model, where, options) {
    return _regenerator2.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.next = 2;
            return _retrieve(model, (0, _extends3.default)({}, options || {}, { where: where }));

          case 2:
            return _context11.abrupt('return', _context11.sent);

          case 3:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));

  return function _findOne(_x28, _x29, _x30) {
    return _ref15.apply(this, arguments);
  };
}();

/**
 * 根据id获得某条记录.
 * @param {string} model
 * @param {string} _id
 * @param {object} options
 */


var _findOneById = exports._findOneById = function () {
  var _ref16 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee12(model, _id, options) {
    return _regenerator2.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.next = 2;
            return _findOne(model, { _id: _id }, options);

          case 2:
            return _context12.abrupt('return', _context12.sent);

          case 3:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function _findOneById(_x31, _x32, _x33) {
    return _ref16.apply(this, arguments);
  };
}();

///////////////////////////////////////////////////
// 对结果的整理.
///////////////////////////////////////////////////


exports.createSchemaWithPopulates = createSchemaWithPopulates;
exports.normalizeItem = normalizeItem;
exports.normalizeItemArray = normalizeItemArray;
exports._getFirstOfRetrieve = _getFirstOfRetrieve;
exports._mergeDbOfResult = _mergeDbOfResult;

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _type = require('./utils/type');

var _type2 = _interopRequireDefault(_type);

var _normalizr = require('normalizr');

var _humps = require('humps');

var _memoize = require('lodash/memoize');

var _memoize2 = _interopRequireDefault(_memoize);

var _flatted = require('flatted');

var _Errcode = require('./Errcode');

var _Errcode2 = _interopRequireDefault(_Errcode);

var _db = require('./db');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('yh:mongo:ops'); /**
                                                   * 无redis缓存版本数据库处理(从原qsv2Normalize改造而来)
                                                   * 1. 本系统以表为操作对象,如果分表分库,则只要有办法找到正确的表即可.
                                                   * 2. 如果系统中要加入其他业务的支持,建议新开项目,用微服务方式进行.
                                                   *
                                                   * 操作主要有增删改查.(一些特殊操作,如:某个字段加一等操作,由逻辑支持,不由数据库支持)
                                                   * 操作及返回数据描述(注意,entity中的key是否做camelizeKeys处理?):
                                                   * 1. 查询数据列表(查询单条记录,更新,创建均返回此数据格式):
                                                   * 参数:
                                                   * + 列表时: model:'product', opts: {where, sort, select, populates, limit, skip}, 目前支持分页查询,还不支持去重或漏,未来可以增加新方案.
                                                   * + 创建时: model:'product', data: {name:'windsome',phone:'1123322',birth:12342322}
                                                   * + 更新单条时: model:'product', where:{_id:1}, data: {status:2}
                                                   * + 更新多条时: model:'product', where:{name:'windsome'}, data: {status:2}
                                                   * + 查单条时: model:'product', opts: {where, sort, select, populates, limit, skip}
                                                   * 返回:
                                                   * {
                                                   *  entity: {
                                                   *    user: {
                                                   *      1: {_id: 1, name: 'windsome', birth: 1223222334, ...},
                                                   *      2: {_id: 2, name: 'agooou', birth: 1223222312, ...},
                                                   *      ...
                                                   *    },
                                                   *    product: {
                                                   *      1: {_id:1, name: 'yifu', ...},
                                                   *      2: {_id:2, name: 'maozi', ...},
                                                   *      ...
                                                   *    },
                                                   *  },
                                                   *  result: [1,2], // 查询单条记录时,result是否不用数组?
                                                   *  [count: 1,] // 更新数据时,返回更新的条数.一般只有1条.
                                                   *  pagination: {total: 100, count: 10, skip: 20, limit: 10, page: 2}
                                                   *  errcode: 0,
                                                   *  message: 'OK'
                                                   * }
                                                   * 2. 删除数据(删除某个id的数据.)
                                                   * {
                                                   *  count: 1, //返回删除条数
                                                   *  errcode: 0,
                                                   *  message: 'OK'
                                                   * }
                                                   */

function createSchemaWithPopulates(model, populates) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  // 将字符串型的populates转成schema.Entity. 一般有如下情形:
  // 1. populates为空, 则表示没有子的schema
  // 2. populates: [{path:'ancestor', model:'post'}] => definition: {ancestor:new schema.Entity('post')}
  // 3. populates: [{path:'desc.ancestor', model:'post'}] => definition: { desc: {ancestor: new schema.Entity('post')}}
  // 3. populates: [{path:'desc.ancestor', model:['post']}] => definition: { desc: {ancestor: [new schema.Entity('post')]}}
  // 4. populates: [{path: 'author', model: 'user', select: '-password'}] => definition: { desc: {ancestor: [new schema.Entity('post')]}}
  if (!model) return null;
  if (!populates) return new _normalizr.schema.Entity(model, {}, options);
  var definition = {};
  for (var i = 0; i < populates.length; i++) {
    var populate = populates[i];
    if (populate.path && populate.model) {
      var attrs = populate.path.split('.');
      var typemodel = (0, _type2.default)(populate.model);
      var tmpdefinition = definition;
      for (var j = 0; j < attrs.length; j++) {
        var attr = attrs[j] && attrs[j].trim();
        if (attr) {
          if (j === attrs.length - 1) {
            if (typemodel === 'string') tmpdefinition[attr] = new _normalizr.schema.Entity(populate.model, {}, options);else if (typemodel === 'array') tmpdefinition[attr] = [new _normalizr.schema.Entity(populate.model[0], {}, options)];else {
              debug('warning! not support populate!', (0, _stringify2.default)({ populate: populate, typemodel: typemodel }));
            }
          } else tmpdefinition[attr] = {};
          tmpdefinition = tmpdefinition[attr];
        }
      }
    }
  }
  // debug('createSchemaWithPopulates', definition);
  return new _normalizr.schema.Entity(model, definition, options);
}

var memCreateSchemaWithPopulates = exports.memCreateSchemaWithPopulates = (0, _memoize2.default)(createSchemaWithPopulates, function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return (0, _flatted.stringify)(args);
});

function normalizeItem(item, modelName, populates) {
  if (!item) return item;
  var itemNext = JSON.parse((0, _stringify2.default)(item));
  // item = itemNext && camelizeKeys(itemNext);
  item = itemNext;
  // let schema1 = schemas[modelName] || new schema.Entity(modelName);
  var schema1 = memCreateSchemaWithPopulates(modelName, populates, {
    idAttribute: '_id'
  });
  return item && (0, _normalizr.normalize)(item, schema1);
}

function normalizeItemArray(items, modelName, populates) {
  if (!items) return items;
  var itemsNext = JSON.parse((0, _stringify2.default)(items));
  // items = itemsNext && camelizeKeys(itemsNext);
  items = itemsNext;
  // let schema1 = schemas[modelName] || new schema.Entity(modelName);
  var schema1 = memCreateSchemaWithPopulates(modelName, populates, {
    idAttribute: '_id'
  });
  return items && (0, _normalizr.normalize)(items, [schema1]);
}

// export function _getFirstOfRetrieve(result, model) {
//   let item = null;
//   if (result) {
//     let item = null;
//     if (result.result && model) {
//       // 优先从result.result中取第一个item的数据.(此时ObjectId型字段为字符串,方便比较)
//       let itemId = result.result && result.result[0];
//       if (itemId) {
//         item =
//           result.entities &&
//           result.entities[model] &&
//           result.entities[model][itemId];
//       }
//     }
//     if (!item) {
//       // result.items[0]存在则直接返回.
//       item = result.items && result.items[0];
//     }
//   }
//   // debug('_getFirstOfRetrieve', JSON.stringify(result), model, item);
//   return item;
// }

function _getFirstOfRetrieve(result, model) {
  var item = null;
  if (result) {
    // result.items[0]存在则直接返回.
    item = result.items && result.items[0];
    if (!item) {
      // result.result[0]存在则从entities中获取.
      var itemId = result.result && result.result[0];
      if (itemId) {
        item = result.entities && result.entities[model] && result.entities[model][itemId];
      }
    }
  }
  // debug('_getFirstOfRetrieve', JSON.stringify(result), model, item);
  return item;
}

/**
 * 将get/update/retrieve获得的结果集中内容合并到第一个.
 * 只合并{result:{entities:{...}}}中内容.
 * @param {object} target
 * @param  {...any} others
 */
function _mergeDbOfResult(target) {
  if (!target) return null;
  if (!target.result) target.result = {};
  if (!target.result.entities) target.result.entities = {};
  var targetResultEntities = target.result.entities;

  for (var _len2 = arguments.length, others = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    others[_key2 - 1] = arguments[_key2];
  }

  for (var i = 0; i < others.length; i++) {
    var tmpEntities = others[i] && others[i].result && others[i].result.entities;
    if (tmpEntities) {
      // 遍历tmpEntities,进行合并.
      for (var tableName in tmpEntities) {
        if (tmpEntities.hasOwnProperty(tableName)) {
          var oldTableItems = targetResultEntities[tableName] || {};
          var addTableItems = tmpEntities[tableName];
          if ((typeof addTableItems === 'undefined' ? 'undefined' : (0, _typeof3.default)(addTableItems)) === 'object') {
            // update
            //xdebug('old:', old, 'nextProp:', nextProp, ', updated:', updatedProp);
            targetResultEntities[tableName] = (0, _extends3.default)({}, oldTableItems, addTableItems);
          }
        }
      }
    }
  }
  return target;
}