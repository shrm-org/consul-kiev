"use strict";

var lodash = require("lodash");
var consul = require("consul");

class ConsulKiev {
  constructor(host, port) {
    this.consul = consul({
      host: host,
      secure: true,
      port: port || 8500
    });
  }

  _transformValue(value) {
    if (value == "null") {
      return null;
    }

    if (value != null) {
      if (
        lodash.includes(["true", "false"], value) == true ||
        value.match(/^[\-]?[1-9][0-9]*$/) != null ||
        value.match(/^\[/) != null
      ) {
        try {
          return JSON.parse(value);
        } catch (ex) {
          // no-op
        }
      }
    }

    return value;
  }

  processValues(key, rawValues) {
    let keySegments = lodash.compact(key.split("/")).length;
    let values = {};
    lodash.forEach(rawValues, node => {
      // if manipulating k/v store through the web ui, seem to get keys ending with /
      if (lodash.endsWith(node.Key, "/") == true) {
        return;
      }

      let key = lodash.slice(node.Key.split("/"), keySegments).join(".");
      lodash.set(values, key, this._transformValue(node.Value));
    });
    return values;
  }

  // callback(err, values)
  getValues(key, callback) {
    return new Promise((resolve, reject) => {
      this.consul.kv.get({ key: key, recurse: true }, (err, result) => {
        if (err != null) {
          return callback ? callback(err, null) : reject(err);
        }

        let values = this.processValues(key, result);

        return callback ? callback(null, values) : resolve(values);
      });
    });
  }
}

module.exports = ConsulKiev;
