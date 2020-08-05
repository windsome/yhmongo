测试从js模块中引入变量,且变量发生改变后,原变量发生改变后,其他文件引入的变量是否跟随改变,是否跟时序有关联.
1. 当修改的是变量内部的值时, 其他文件引用的变量会跟随改变.
```
#lib.js中
export var obj = {a:1,b:1};
#test1.js中修改obj中变量
obj.a=1
# test2.js中引用obj
obj会发生变化.
```
2. 当修改的变量本身,其他文件的引用不会改变,都是初始值.
```
#lib.js中
export var obj2 = 0;
#test1.js中修改obj中变量
let arg1 = require('./lib').obj2;
arg1=3
# test2.js中引用obj
let arg2 = require('./lib').obj2;
arg2 == 0 未发生改变.
```
