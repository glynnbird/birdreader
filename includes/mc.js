var moment = require('moment');
var mc = {};

// fake memcache
var set = function(key, value) {
  var ts = moment().add(3,'minutes').unix();
  var item = { value: value, ts:ts};
  mc[key] = item;
};

var get = function(key) {
  var ts = moment().unix();
  if(typeof mc[key] != "undefined" && ts < mc[key].ts) {
    return mc[key].value;
  }
  return null;
};

module.exports = {
  set: set,
  get: get
}