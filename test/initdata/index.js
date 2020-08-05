import _debug from 'debug';
const debug = _debug('yh:mongo:test:initdata');
import data_user from './data_user';
import data_setting from './data_setting';
import * as ops from '../../src/ops';

export const init_setting = async arr => {
  for (let i = 0; i < arr.length; i++) {
    let item = ops._getFirstOfRetrieve(
      await ops._findOneById('setting', arr[i]._id)
    );
    if (item) {
      continue;
    }
    item = ops._getFirstOfRetrieve(await ops._createOne('setting', arr[i]));
    if (item) {
      debug('create setting:', JSON.stringify(item));
    }
  }
};

export const init_user = async arr => {
  for (let i = 0; i < arr.length; i++) {
    let item = ops._getFirstOfRetrieve(
      await ops._findOne('user', { phone: arr[i].phone })
    );
    if (item) {
      continue;
    }
    let result = ops._getFirstOfRetrieve(await ops._createOne('user', arr[i]));
    if (result) {
      debug('user:', JSON.stringify(result));
    }
  }
  // let resultAll = await findAndCountAll('user', {});
  // debug('user:', resultAll);
};

export const init_database = async () => {
  let hasUserRoot = false;
  let root = ops._getFirstOfRetrieve(
    await ops._findOne('user', { phone: 'root' })
  );
  if (root) {
    hasUserRoot = true;
  }
  try {
    if (!hasUserRoot) {
      await init_user(data_user);
      //   await init_post(data_post);
      //   await init_team(data_team);
      //   // await init_comment();
      //   // await init_pointflow();
      //   // await init_message();
    }
    await init_setting(data_setting);
  } catch (error) {
    debug('warning! db init error!', error);
  }
  return true;
};

export default init_database;
