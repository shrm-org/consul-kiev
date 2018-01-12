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
c.getValues('foo/bar', function(err, results){
  // check err, use results
});
```

API
------------------------
`getValues(key, callback)`

  * Extracts from consul recursively from given `key`
  * Transforms values within consul based on types
  * Supports arrays via JSON within consul values (very hackish; subject to change)
  * `callback(err, results)`
      * results is an object based on key/values

License
------------------------

MIT. Copyright 2017: SHRM, @bmoelk.
