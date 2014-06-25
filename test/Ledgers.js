var assert     = require('assert');
var fs         = require('fs');
var BitPay     = require('../lib/rest-client');

var HOME       = process.env['HOME'];
var config     = require('../config');
var bitauth    = require('bitauth');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);

var client     = new BitPay( privkey , {
  sticky: true
});

describe('Ledger API', function() {

  var bitpay = client.as('user');

  describe('get ledgers', function() {
    it('should provide a list of available ledgers', function(done) {
      client.as('merchant').get('ledgers', done );
    });
  });

});
