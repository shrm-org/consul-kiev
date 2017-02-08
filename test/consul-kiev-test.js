'use strict';

const proxyquire = require('proxyquire');
const chai = require('chai'),
  assert = chai.assert;
const sinon = require('sinon');
const lodash = require('lodash');

var consulMock = {
  err: null,
  results: [],
  kv: {
    get: function(options, callback){
      callback(consulMock.err, consulMock.results);
    }
  }
}

const consulKiev = proxyquire('../index.js', {
  'consul': function(config){
    consulMock.config = config;
    return consulMock;
  }
});

describe('ConsulKiev', function(){

  describe('#constructor', function(){
    it('should setup a consul client with host and port', function(){
      let c = new consulKiev('localhost', 1234);
      assert.deepEqual(c.consul.config, {
        host: 'localhost',
        port: 1234,
        secure: true
      });
    });

    it('should default port to 8500', function(){
      let c = new consulKiev('localhost');
      assert.equal(c.consul.config.port, 8500);
    });
  });

  describe('#_transformValue', function(){
    var c = null;
    beforeEach(function(){
      c = new consulKiev('localhost');
    });

    it('should transform true/false strings to boolean values', function(){
      assert.equal(c._transformValue('true'), true);
      assert.equal(c._transformValue('false'), false);
    });

    it('should transform null string to a null value', function(){
      assert.equal(c._transformValue('null'), null);
    });

    it('should transform an numeric string to a numeric value', function(){
      assert.equal(c._transformValue('1234'), 1234);
      assert.equal(c._transformValue('03831'), 3831);
      assert.equal(c._transformValue('1.5'), 1.5);
    });

    it('should transform a string that starts with a "[" as a JSON array', function(){
      assert.deepEqual(c._transformValue('[1,2,3]'), [1,2,3]);
      assert.deepEqual(c._transformValue('[{"foo":1}, {"bar":2}]'), [{foo: 1}, {bar: 2}]);
    });
  });

  describe('#getValues', function(){
    var c = null;
    beforeEach(function(){
      c = new consulKiev('localhost');
      consulMock.err = null;
      consulMock.results = [
        {
          Key: "foo/bar/",
          Value: null
        },
        {
          Key: "foo/bar/service/",
          Value: null
        },
        {
          Key: "foo/bar/service/url",
          Value: "http://httpbin.org/"
        },
        {
          Key: "foo/bar/service/action",
          Value: "GET"
        },
        {
          Key: "foo/bar/things",
          Value: '[ {"name": 1}, {"name": 2} ]'
        }
      ];
      consulMock.expected = {
        service: {
          url: "http://httpbin.org/",
          action: "GET"
        },
        things: [
          {"name": 1},
          {"name": 2}
        ]
      };
    });

    it('should error if consul client has an error', function(done){
      consulMock.err = new Error("error");
      c.getValues("foo/bar", function(err, results){
        assert.isNotNull(err);
        assert.isDefined(err);
        done();
      });
    });

    it('should support nested keys', function(done){
      c.getValues("foo/bar", function(err, results){
        assert.isNull(err);
        assert.deepEqual(results, consulMock.expected);
        done();
      });
    });

    it('should transform all values from received keys', function(done){
      sinon.spy(c, "_transformValue");
      c.getValues("foo/bar", function(err, results){
        assert.equal(c._transformValue.callCount, 3);
        c._transformValue.restore();
        done();
      });
    });

    it('should handle keys that end with /', function(done){
      c.getValues("foo/bar/", function(err, results){
        assert.isNull(err);
        assert.deepEqual(results, consulMock.expected);
        done();
      });
    });

    it('should ignore keys prefixed with /', function(done){
      c.getValues("/foo/bar", function(err, results){
        assert.isNull(err);
        assert.deepEqual(results, consulMock.expected);
        done();
      });
    });
  });

});
