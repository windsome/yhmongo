#!/usr/bin/env node

var cfg = {
  a:1,
  b:1
}

export const setCfg = (cfg1) => {
  cfg = cfg1;
}

export const getCfg = () => {
  return cfg;
}
export default cfg;
