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

describe('Organization API', function() {

  var bitpay = client.as('user');

  /*/describe('create organization', function() {
    it('should create an organization', function(done) {
      bitpay.post('organizations', done );
    });
  });/**/

});
