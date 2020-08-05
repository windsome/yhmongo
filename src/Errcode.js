import ErrCode from 'errcode';
export default ErrCode;

export const EC = {
  ERR_SYSTEM_ERROR: -1,
  ERR_OK: 0,
  ERR_NO_SUCH_ENTITY: 40004,
  ERR_INSERT_DB_FAIL: 40005,
  ERR_UPDATE_DB_FAIL: 40006,
  ERR_ALREADY_EXIST: 40007,
  ERR_MISS_REQUIRE: 40008
};

export const EM = require('./Errcode.cn').default(EC);
