var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var config     = require('../config');
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  var updateData = {
    smsNumber: '555-555-5555',
    merchantName: 'Bill Merchant',
    merchantAddress1: '1234 Merchant Ave',
    merchantAddress2: '',
    merchantCity: 'Merchantville',
    merchantState: 'NJ',
    merchantZip: '08033',
    cartPOSsoftware: 'Aloha',
    pricingCurrency: 'USD',
    payoutCurrency: 'BTC',
    payoutPercentage: 50,
    transactionSpeed: 'medium',
    notifyOnPaid: true,
    notifyOnComplete: true,
    planId: 3
  };

  client.as('user').get('orgs', function(err, orgs) {
    var org = orgs[0];
    org.put(updateData, function(err, org) {
      console.log(err || org);
    });
  });

});
