// DEST=dev DEBUG="app:*" node ./test_ops.js

require('babel-register');
var ops = require('../../src/dbcached/ops');

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
    return ops
      ._retrieve('mark', { limit: 10 })
      .then(ret => {
        console.log('_retrieve result:', JSON.stringify(ret));
        return ops._retrieve('mark', { limit: 10, skip: 10 });
      })
      .then(ret => {
        console.log('_retrieve result:', JSON.stringify(ret));
        return ret;
      });
  })
  .then(ret => {
    console.log('begin test *One');
    return ops
      ._createOne('mark', {
        status: 0,
        author: '5ba27cc3a70db45dd108b541',
        table: 'postTest',
        target: '5ba5b9632e0d697f5cbedf45'
      })
      .then(result => {
        console.log('_createOne result:', result);
        return ops._updateOne('mark', { _id: result._id }, { status: 2 });
      })
      .then(result => {
        console.log('_updateOne result:', result);
        return ops._findOne('mark', { table: 'postTest' });
      })
      .then(result => {
        var id = result.result.result[0];
        console.log('_findOne result:', result, ', id:', id);
        return ops._deleteOne('mark', { _id: id });
      })
      .then(result => {
        console.log('_deleteOne result:', result);
        return result;
      });
  })
  .then(ret => {
    console.log('');
    console.log('');
    console.log('');
    console.log('');
    console.log('begin test *OneById');
    return ops
      ._createOne('mark', {
        status: 0,
        author: '5ba27cc3a70db45dd108b541',
        table: 'postTest2',
        target: '5ba5b9632e0d697f5cbedf45'
      })
      .then(result => {
        console.log('_createOne result:', result);
        return ops._updateOneById('mark', result._id);
      })
      .then(result => {
        console.log('_updateOneById result:', result);
        return ops._findOneById('mark', result._id);
        // }).then(result=>{
        //     var id = result.result.result[0];
        //     console.log('_findOneById result:', result, ', id:', id);
        //     return ops._deleteOneById('mark', id);
      })
      .then(result => {
        console.log('_deleteOneById result:', result);
        return result;
      });
  })
  .then(ret => {
    console.log('');
    console.log('');
    console.log('');
    console.log('begin test _createMany');
    return ops
      ._createMany('mark', [
        {
          status: 0,
          author: '5ba27cc3a70db45dd108b541',
          table: 'postTest3',
          target: '5ba5b9632e0d697f5cbedf45'
        },
        {
          status: 1,
          author: '5ba27cc3a70db45dd108b541',
          table: 'postTest3',
          target: '5ba5b9632e0d697f5cbedf45'
        },
        {
          status: 2,
          author: '5ba27cc3a70db45dd108b541',
          table: 'postTest3',
          target: '5ba5b9632e0d697f5cbedf45'
        }
      ])
      .then(ret => {
        console.log('_createMany result:', ret);
        return ops._updateMany('mark', { table: 'postTest3' }, { status: 3 });
      })
      .then(ret => {
        console.log('_updateMany result:', ret);
        return ops._retrieve('mark', {
          where: { table: 'postTest3' },
          limit: 10
        });
      })
      .then(ret => {
        console.log('_retrieve result:', ret);
        return ret;
      });
  })
  .then(ret => {
    console.log('finish');
    return ret;
  });
