// DEBUG="yh*,test*" node ./test_query.js 

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('test:cached:query');
const query = require('../../src/dbcached/query');

/**
 * 测试
 */
let item = {
  _id:'5b210fea77c0a27c84c0ea10',
  vehicle: '京A12345',
  status: 0,
  user: '5b210fea77c0a27c84c0ea20',
  company: '5b210fea77c0a27c84c0ea23',
  createdAt: 1544631840000,
  desc: {
    count: 100
  }
}
let item2 = {
  _id:'5b210fea77c0a27c84c0ea11',
  vehicle: '京A1234567',
  status: 1,
  user: '5b210fea77c0a27c84c0ea20',
  company: '5b210fea77c0a27c84c0ea23',
  createdAt: 1544631850000,
  desc: {
    count: 2000
  }
}
let queries = [
  { company: '5b210fea77c0a27c84c0ea23' },
  { vehicle: '京A12345' },
  { status: 0, 'desc.count': { $gt: 1, $lt: 1000 } },
  { vehicle: '京A12345', status: 0 },
  { $or: [{ vehicle: '京A12345' }, { status: 0 }] },
  {
    company: '5b210fea77c0a27c84c0ea23',
    $or: [{ vehicle: '京A12345' }, { status: 0 }]
  },
  {
    createdAt: { $gt: '2018-06-20T10:10:10Z', $lt: '2018-06-27T10:10:10Z' }
  },
  { createdAt: { $gt: 1544631840000, $lt: 1544631940000 } },
]

let start = new Date().getTime();
debug('deal item1')
queries.map(q => {
  let start = new Date().getTime();
  let result = query.itemFulfillQuery(item, q);
  debug('query', (new Date().getTime() - start)/1000, result, q);
});
debug('deal item2\n\n')
queries.map(q => {
  let start = new Date().getTime();
  let result = query.itemFulfillQuery(item2, q);
  debug('query', (new Date().getTime() - start)/1000, result, q);
});
debug('time elapse', (new Date().getTime() - start)/1000);
