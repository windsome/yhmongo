import _debug from 'debug';
const debug = _debug('app:mw:dbcached:_base');
import config from '../../config';

if (!config.bull) {
  debug(
    new Error('error! no config.bull! will default use redis://127.0.0.1:6379!')
  );
}

export const cfg = config.bull;

export default cfg;
