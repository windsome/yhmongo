import _debug from 'debug';
const debug = _debug('yh:mongo:dbcached:redis');
import redis from 'redis';
import bluebird from 'bluebird';
import Bull from 'bull';

// Q.promisifyAll(redis.RedisClient.prototype);
// Q.promisifyAll(redis.Multi.prototype);

bluebird.promisifyAll(redis);

export var redisClients = {};
export function initRedis(url, name) {
  if (!name) name = 'default';
  let client = redis.createClient(url);
  redisClients[name] = client;
  if (!redisClients['default']) redisClients['default'] = client;
  debug('initRedis', url, name, Object.getOwnPropertyNames(redisClients));
  return client;
}
export function $r(name) {
  if (!name) name = 'default';
  let client = redisClients[name];
  debug('$r', name, !!client);
  return client;
}

export var bullClients = {};
export function initBull(url, name) {
  if (!name) name = 'default';
  let client = new Bull('redis-update-key-queue', url);
  bullClients[name] = client;
  if (!bullClients['default']) bullClients['default'] = client;
  debug('initBull', url, name, Object.getOwnPropertyNames(bullClients));
  return client;
}
export function $b(name) {
  if (!name) name = 'default';
  let client = bullClients[name];
  debug('$b', name, !!client);
  return client;
}
