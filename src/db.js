import _debug from 'debug';
const debug = _debug('app:mongo');
import mongoose from 'mongoose';

/**
 * 根据url去连接mongodb,返回连接的实体对象connection.
 * @param {string} url
 */
export function connectDatabase(url, schemas) {
  if (!schemas) {
    debug('error! schemas is null!');
    return null;
  }
  // connect to default mongodb url.
  let conn = mongoose.createConnection(url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    poolSize: 20, // 默认为5

    keepAlive: true,
    keepAliveInitialDelay: 300000,

    reconnectTries: Number.MAX_VALUE // 无限重连的节奏
  });
  conn
    .then(ret => {
      debug(`connectDatabase ${url} ok`);
    })
    .catch(error => {
      debug(`connectDatabase ${url} error`, error);
    });

  [
    'connecting',
    'connected',
    'open',
    'disconnecting',
    'disconnected',
    'close',
    'reconnected',
    'error',
    'fullsetup',
    'all',
    'reconnectFailed'
  ].map(evt => {
    conn.on(evt, function() {
      debug(`database ${url} ${evt}`, arguments);
    });
  });
  // conn.on('error', function(error) {
  //   debug(`database ${url} error!`, error);
  // });
  // conn.on('open', function() {
  //   debug(`database ${url} open ok!`);
  // });

  Object.getOwnPropertyNames(schemas).map(schemaName => {
    if (schemaName) {
      let schema = schemas[schemaName];
      let lowercaseSchemaName = schemaName.toLowerCase();
      conn.model(lowercaseSchemaName, schema);
      return true;
    }
    return false;
  });

  return conn;
}

export var conns = {};
export var conn0 = null;

export function initDb (url, schemas, name) {
  if (!name) name='default';
  let conn = connectDatabase(url, schemas);
  conns[name] = conn;
  if (!conn0) conn0 = conn;
  return  conn;
}

export default conn0;
// export var conns;
