// DEST=dev DEBUG="app:*" node ./test_initdata.js

require('babel-register');
var init_database = require('../../src/initdata/index').default;

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
Promise.resolve(1)
  .then(ret => {
    return init_database().then(result => {
      console.log('init_database result:', result);
    });
  })
  .then(ret => {
    console.log('_retrieve result:', ret);
    return ret;
  });
