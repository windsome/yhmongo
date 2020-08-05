#!/usr/bin/env node
var  cfg1 = require('./lib').default;
var  setCfg = require('./lib').setCfg;
console.log('testfun2 before update cfg', cfg1);
setCfg({a:2,c:2});
console.log('testfun2 after do setCfg({a:2,c:2})', cfg1);

