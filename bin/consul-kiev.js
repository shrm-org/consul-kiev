#!/usr/bin/env node

"use strict";

const help = `Usage:
  consul-kiev --server <server> --port <port> --key <key> --watch <output file/path> --file-per-key
  consul-kiev -k <key>
  consul-kiev -s <server> -k <key> -w <output file>
  consul-kiev -s <server> -k <key> -w <output path> --file-per-key
`;

const minimist = require("minimist");
let argv = minimist(process.argv.slice(2));
console.debug(argv);

if (argv["help"] || argv["h"]) {
  console.log(help);
  process.exit(0);
}

const fs = require("fs-extra");
const path = require("path");
const lodash = require("lodash");
const ConsulKiev = require("../index.js");

let opts = {
  host: argv["s"] || argv["server"] || "localhost",
  port: argv["p"] || argv["port"] || 8500,
  key: argv["k"] || argv["key"],
  watch: argv["w"] || argv["watch"],
  filePerKey: argv["file-per-key"]
};

if (opts.key == null) {
  console.error(`ERROR: consul key is required. use -k or --key`);
  process.exit(-1);
}

function filePerKeyChangeHandler(data) {
  lodash.each(data, (val, key) => {
    try {
      let keyFileToWrite = path.join(opts.watch, key);
      fs.outputFileSync(keyFileToWrite, val);
      console.log(
        `${new Date()} kiev.watch ${opts.key} changes written to ${keyFileToWrite}`
      );
    } catch (err) {
      console.error(`ERROR: kiev.watch(${keyFileToWrite})\n`, err);
    }
  });
}

function singleFilePerChangeHandler(data) {
  fs.outputJson(opts.watch, data, { spaces: 2 }, err => {
    if (err) {
      console.error(`ERROR: kiev.watch(${opts.key}, ${opts.watch})\n`, err);
    } else {
      console.log(
        `${new Date()} kiev.watch ${opts.key} changes written to ${opts.watch}`
      );
    }
  });
}

// consul extraction

let kiev = new ConsulKiev(opts["host"], opts["port"]);

if (opts.watch) {
  opts.watch = path.normalize(opts.watch);

  let watch = kiev.consul.watch({
    method: kiev.consul.kv.get,
    options: { key: opts.key, recurse: true }
  });

  watch.on("change", function(data, res) {
    data = kiev.processValues(opts.key, data);
    if (opts.filePerKey == null) {
      singleFilePerChangeHandler(data);
    } else {
      filePerKeyChangeHandler(data);
    }
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
