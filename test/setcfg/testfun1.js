#!/usr/bin/env node
var  cfg1 = require('./lib').default;
var  setCfg = require('./lib').setCfg;
console.log('testfun1 before update cfg', cfg1);
cfg1.a = 2;
console.log('testfun1 after do cfg1.a = 2', cfg1);

