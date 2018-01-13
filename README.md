consul-kiev
========================

Opinionated extraction of values from consul kv store for node.

Install
------------------------

`npm install consul-kiev`

Test
------------------------

`npm test`

Usage
------------------------

```javascript
let c = new consulKiev('localhost');
c.getValues('foo/bar', (err, results) => {
  // check err, use results
});
```

or using promises:

```javascript
let c = new consulKiev('localhost');
c.getValues('foo/bar').then(results => {
  // use results
}).catch(err => {
  // handle err
});
```

cli:

```
$ consul-kiev -h
Usage:
  consul-kiev --server <server> --port <port> --key <key> --watch <output file>
  consul-kiev -k <key>
  consul-kiev -s <server> -k <key> -w <output file>

$ consul-kiev -k foo/bar
{
  baz: "figz"
}
```

API
------------------------
`getValues(key, [callback])`

  * Extracts from consul recursively from given `key`
  * Transforms values within consul based on types
  * Supports arrays via JSON within consul values (very hackish; subject to change)
  * `callback(err, results)`
      * results is an object based on key/values

License
------------------------

MIT. Copyright 2017-2018: SHRM, [Brian Moelk](https://github.com/bmoelk)
