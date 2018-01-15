"use strict";

const lodash = require("lodash");
const consul = require("consul");
const universalify = require("universalify");

class ConsulKiev {
  constructor(host, port) {
    this.consul = consul({
      host: host,
      secure: true,
      port: port || 8500
    });
    this.getValues = universalify.fromCallback(this.getValues);
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

      let key = lodash.slice(node.Key.split("/"), keySegments);
      lodash.set(values, key, this._transformValue(node.Value));
    });
    return values;
  }

  // callback(err, values)
  getValues(key, callback) {
    this.consul.kv.get({ key: key, recurse: true }, (err, result) => {
      if (err != null) {
        return callback(err, null);
      }

      let values = this.processValues(key, result);

      return callback(null, values);
    });
  }
}

module.exports = ConsulKiev;
