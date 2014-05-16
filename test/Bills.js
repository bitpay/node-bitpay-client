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

describe('Bill API', function() {

  describe('create bill', function() {
    it('should create a bill', function(done) {
      bitpay.as('merchant').post('bills', {
        // TODO: test various inputs
      }, done );
    });
  });

  describe('create bill', function() {
    it('should create and update a bill', function(done) {
      bitpay.as('merchant').post('bills', {
        // TODO: test various inputs
      }, function(err, bill) {

        var item = {
            description: 'Test item'
          , price: 1.00
          , quantity: 1
        }

        bitpay.as('merchant').put('bill/' + bill.id , {
          items: [ item ]
        }, function(updateErr, updatedBill) {

          done( err || updateErr , updatedBill);
        } );

      });
    });
  });

});