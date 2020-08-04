export { connectDatabase, initDb, conn0 as db, conns } from './db';

export {
  _retrieve,
  _createOne,
  _deleteOne,
  _updateOne,
  _createMany,
  _updateMany,
  _deleteOneById,
  _updateOneById,
  _findOne,
  _findOneById,
  _getFirstOfRetrieve
} from './ops';
