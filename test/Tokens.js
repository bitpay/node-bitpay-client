var assert     = require('assert');
var fs         = require('fs');
var BitPay     = require('../lib/rest-client');

var config     = require('../config');
var bitauth    = require('bitauth');
var encPrivkey = fs.readFileSync( config.configDir + '/api.key').toString();
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);

var client     = new BitPay( privkey , {
  sticky: true
});

describe('User API', function() {

  var bitpay = client.as('user');

  describe('get user', function() {
    it('should provide the current user', function(done) {
      bitpay.get('user', done );
    });
  });

  describe('modify user', function() {
    it('should modify the current user', function(done) {
      var newNumber = Math.random();
      bitpay.put('user', {
        phone: newNumber
      }, done );
    });
  });

});
