'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (EC) {
  var _ref;

  return _ref = {}, (0, _defineProperty3.default)(_ref, EC.ERR_SYSTEM_ERROR, '系统错误'), (0, _defineProperty3.default)(_ref, EC.OK, '操作正常'), (0, _defineProperty3.default)(_ref, EC.ERR_NO_SUCH_ENTITY, '没有该实体'), (0, _defineProperty3.default)(_ref, EC.ERR_INSERT_DB_FAIL, '插入数据错'), (0, _defineProperty3.default)(_ref, EC.ERR_UPDATE_DB_FAIL, '更新数据错'), (0, _defineProperty3.default)(_ref, EC.ERR_ALREADY_EXIST, '数据已经存在'), (0, _defineProperty3.default)(_ref, EC.ERR_MISS_REQUIRE, '缺少必填项'), _ref;
};