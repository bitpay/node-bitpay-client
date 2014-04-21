var fs         = require('fs');
var async      = require('async');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var config     = require('../config');
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  var payload = {
    items: [
      { price: 10, quantity: 1, description: 'thing' }
    ],
    name: 'Bill Merchant',
    address1: '1234 Fake St',
    city: 'Atlanta',
    state: 'GA',
    zip: '30305',
    country: 'USA',
    email: 'bill.merchant@bitpay.com',
    phone: '5555555555',
    dueDate: new Date('2014-05-30'),
    currency: 'USD',
    showRate: true
  };

  client.post('bills', payload, function(err, bill) {
    console.log(err || bill);
  });

});




