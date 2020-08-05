require('babel-register');
var  cfg1 = require('./lib').default;
console.log('1 testmain cfg1=', cfg1);
require('./testfun2');
console.log('2 testmain testfun2 cfg1=', cfg1);
var  cfg2= require('./lib').default;
console.log('3 testmain  after require cfg2=', cfg2,',cfg1=',cfg1);
console.log('结论为不能这么更新');

