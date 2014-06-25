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

describe('Currency API', function() {

  var bitpay = client.as('public');

  describe('get currencies', function() {
    it('should provide a list of currencies', function(done) {
      client.get('currencies', done );
    });
  });

});
