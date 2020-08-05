// DEST=dev DEBUG="app:*" node ./test_ops.js

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('test:cached:query');
var mongo = require('../../lib');
var cached = require('../../lib/dbcached');
const schemas = require('../schemas').schemas;

mongo.initDb('mongodb://admin:admin@localhost:27017/test_eshop?authSource=admin',schemas).then(ret => {
  cached.initRedis('redis://:1234567890@localhost:6379/1')
  cached.initBull('redis://:1234567890@localhost:6379/2')
  cached.initExpire();

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
    return cached
      ._retrieve('mark', { limit: 10 })
      .then(ret => {
        debug('_retrieve result:', JSON.stringify(ret));
        return cached._retrieve('mark', { limit: 10, skip: 10 });
      })
      .then(ret => {
        debug('_retrieve result:', JSON.stringify(ret));
        return ret;
      });
  })
  .then(ret => {
    debug('begin test *One');
    return cached
      ._createOne('mark', {
        status: 0,
        author: '5ba27cc3a70db45dd108b541',
        table: 'postTest',
        target: '5ba5b9632e0d697f5cbedf45'
      })
      .then(result => {
        debug('_createOne result:', result);
        return cached._updateOne('mark', { _id: result._id }, { status: 2 });
      })
      .then(result => {
        debug('_updateOne result:', result);
        return cached._findOne('mark', { table: 'postTest' });
      })
      .then(result => {
        var id = result.result.result[0];
        debug('_findOne result:', result, ', id:', id);
        return cached._deleteOne('mark', { _id: id });
      })
      .then(result => {
        debug('_deleteOne result:', result);
        return result;
      });
  })
  .then(ret => {
    debug('');
    debug('');
    debug('');
    debug('');
    debug('begin test *OneById');
    return cached
      ._createOne('mark', {
        status: 0,
        author: '5ba27cc3a70db45dd108b541',
        table: 'postTest2',
        target: '5ba5b9632e0d697f5cbedf45'
      })
      .then(result => {
        debug('_createOne result:', result);
        return cached._updateOneById('mark', result._id);
      })
      .then(result => {
        debug('_updateOneById result:', result);
        return cached._findOneById('mark', result._id);
        // }).then(result=>{
        //     var id = result.result.result[0];
        //     debug('_findOneById result:', result, ', id:', id);
        //     return ops._deleteOneById('mark', id);
      })
      .then(result => {
        debug('_deleteOneById result:', result);
        return result;
      });
  })
  .then(ret => {
    debug('');
    debug('');
    debug('');
    debug('begin test _createMany');
    return cached
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
        debug('_createMany result:', ret);
        return cached._updateMany('mark', { table: 'postTest3' }, { status: 3 });
      })
      .then(ret => {
        debug('_updateMany result:', ret);
        return cached._retrieve('mark', {
          where: { table: 'postTest3' },
          limit: 10
        });
      })
      .then(ret => {
        debug('_retrieve result:', ret);
        return ret;
      });
  })
  .then(ret => {
    debug('finish');
    return ret;
  });

});