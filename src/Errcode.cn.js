export default EC => ({
  [EC.ERR_SYSTEM_ERROR]: '系统错误',
  [EC.OK]: '操作正常',
  [EC.ERR_NO_SUCH_ENTITY]: '没有该实体',
  [EC.ERR_INSERT_DB_FAIL]: '插入数据错',
  [EC.ERR_UPDATE_DB_FAIL]: '更新数据错',
  [EC.ERR_ALREADY_EXIST]: '数据已经存在',
  [EC.ERR_MISS_REQUIRE]: '缺少必填项'
});
