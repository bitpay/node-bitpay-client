var assert     = require('assert');
var fs         = require('fs');
var BitPay     = require('../lib/rest-client');

var HOME       = process.env['HOME'];
var config     = require('../config');
var KeyUtils   = require('../lib/key-utils');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);

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
