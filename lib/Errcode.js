'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EM = exports.EC = undefined;

var _errcode = require('errcode');

var _errcode2 = _interopRequireDefault(_errcode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _errcode2.default;
var EC = exports.EC = {
  ERR_SYSTEM_ERROR: -1,
  ERR_OK: 0,
  ERR_NO_SUCH_ENTITY: 40004,
  ERR_INSERT_DB_FAIL: 40005,
  ERR_UPDATE_DB_FAIL: 40006,
  ERR_ALREADY_EXIST: 40007,
  ERR_MISS_REQUIRE: 40008
};

var EM = exports.EM = require('./Errcode.cn').default(EC);