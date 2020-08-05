require('babel-register');
var  getCfg = require('./lib').getCfg;
console.log('1 testmain cfg1=', getCfg());
require('./testfun1');
console.log('2 testmain testfun1 cfg1=', getCfg());

