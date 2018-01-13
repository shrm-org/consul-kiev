#!/usr/bin/env node

"use strict";

const help = `Usage:
  consul-kiev --server <server> --port <port> --key <key> --watch <output file>
  consul-kiev -k <key>
  consul-kiev -s <server> -k <key> -w <output file>
`;

const minimist = require("minimist");
let argv = minimist(process.argv.slice(2));
console.debug(argv);

if (argv["help"] || argv["h"]) {
  console.log(help);
  process.exit(0);
}

const fs = require("fs");
const lodash = require("lodash");
const ConsulKiev = require("../index.js");

let opts = {
  host: argv["s"] || argv["server"] || "localhost",
  port: argv["p"] || argv["port"] || 8500,
  key: argv["k"] || argv["key"],
  watch: argv["w"] || argv["watch"]
};

if (opts.key == null) {
  console.error(`ERROR: consul key is required. use -k or --key`);
  process.exit(-1);
}

let kiev = new ConsulKiev(opts["host"], opts["port"]);

if (opts.watch) {
  let watch = kiev.consul.watch({
    method: kiev.consul.kv.get,
    options: { key: opts.key, recurse: true }
  });

  watch.on("change", function(data, res) {
    data = kiev.processValues(opts.key, data);
    fs.writeFile(opts.watch, JSON.stringify(data, null, 2), err => {
      if (err) {
        console.error(`ERROR: kiev.watch(${opts.key}, ${opts.watch})\n`, err);
      } else {
        console.log(
          `${new Date()} kiev.watch ${opts.key} changes written to ${opts.watch}`
        );
      }
    });
  });

  watch.on("error", function(err) {
    console.error("ERROR:", err);
  });
} else {
  kiev
    .getValues(opts.key)
    .then(values => {
      console.log(values);
    })
    .catch(err => {
      console.error(`ERROR: kiev.getValues('${opts.key}')\n`, err);
      process.exit(-1);
    });
}
