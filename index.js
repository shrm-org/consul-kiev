'use strict';

var lodash = require('lodash');
var consul = require('consul');

class ConsulKiev {

  constructor (host, port){
    this.consul = consul({
      host: host,
      secure: true,
      port: port || 8500
    });
  }

  _transformValue(value){
    if (value == 'null') {
      return null;
    };

    if (value != null){
      if ((lodash.includes(['true', 'false'], value) == true) || (value.match(/^[\-]?[1-9][0-9]*$/) != null) || (value.match(/^\[/) != null)) {
          try {
            return JSON.parse(value);
          }
          catch (ex) {
            // no-op
          };
      };
    };

    return value;
  }

  // callback(err, values)
  getValues(key, callback){
    let self = this;
    self.consul.kv.get({ key: key, recurse: true }, function(err, result){
      if (err != null){
        return callback(err, null);
      };

      let keySegments = lodash.compact(key.split('/')).length;
      let values = {};
      lodash.forEach(result, function(node){
        // if manipulating k/v store through the web ui, seem to get keys ending with /
        if (lodash.endsWith(node.Key, '/') == true) { return };

        let key = lodash.slice(node.Key.split('/'), keySegments).join('.');
        lodash.set(values, key, self._transformValue(node.Value));
      });

      return callback(null, values);
    });
  }

}

module.exports = ConsulKiev;
