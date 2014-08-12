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

describe('Payout API', function() {

  var bitpay = client.as('payroll');

  describe('create payout', function() {
    it('should create a payout object', function(done) {
      client.as('payroll').post('payouts', {
        instructions: [
          { amount: 10, address: 'foo' }
        ]
      }, done );
    });
  });

});
