'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initDb = exports.conns = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

// export var conn0 = null;

var initDb = exports.initDb = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(url, schemas, name) {
    var conn;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!name) name = 'default';
            _context.next = 3;
            return connectDatabase(url, schemas);

          case 3:
            conn = _context.sent;

            conns[name] = conn;
            if (!conns['default']) conns['default'] = conn;
            // if (!conn0) conn0 = conn;
            return _context.abrupt('return', conn);

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function initDb(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

exports.connectDatabase = connectDatabase;
exports.$db = $db;

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('yh:mongo:db');


/**
 * 根据url去连接mongodb,返回连接的实体对象connection.
 * @param {string} url
 */
function connectDatabase(url, schemas) {
  if (!schemas) {
    debug('error! schemas is null!');
    return null;
  }
  // connect to default mongodb url.
  var conn = _mongoose2.default.createConnection(url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    poolSize: 20, // 默认为5

    keepAlive: true,
    keepAliveInitialDelay: 300000,

    reconnectTries: Number.MAX_VALUE // 无限重连的节奏
  });

  ['connecting', 'connected', 'open', 'disconnecting', 'disconnected', 'close', 'reconnected', 'error', 'fullsetup', 'all', 'reconnectFailed'].map(function (evt) {
    conn.on(evt, function () {
      debug('database ' + url + ' ' + evt, arguments);
    });
  });
  // conn.on('error', function(error) {
  //   debug(`database ${url} error!`, error);
  // });
  // conn.on('open', function() {
  //   debug(`database ${url} open ok!`);
  // });

  (0, _getOwnPropertyNames2.default)(schemas).map(function (schemaName) {
    if (schemaName) {
      var schema = schemas[schemaName];
      var lowercaseSchemaName = schemaName.toLowerCase();
      conn.model(lowercaseSchemaName, schema);
      return true;
    }
    return false;
  });

  return conn.then(function (ret) {
    debug('connectDatabase ' + url + ' ok');
    return conn;
  }).catch(function (error) {
    debug('connectDatabase ' + url + ' error', error);
    return conn;
  });

  // return conn;
}

var conns = exports.conns = {};function $db(name) {
  if (!name) name = 'default';
  var conn = conns[name];
  debug('$db', name, conn && conn.name);
  return conn;
}
// export default conn0;
// export var conns;