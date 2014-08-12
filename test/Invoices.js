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

describe('Invoice API', function() {

  var bitpay = client.as('merchant');

  describe('get invoices', function() {
    it('should provide a list of invoices', function(done) {
      client.get('invoices', done );
    });
  });

  describe('create invoice', function() {
    it('should create an invoice', function(done) {
      client.post('invoices', {
          price: 1.99
        , currency: 'USD'
      }, done );
    });
  });

});
