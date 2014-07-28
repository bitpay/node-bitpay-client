var fs         = require('fs');
var bitauth    = require('bitauth');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var config     = require('../config');
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);

var client = new BitPay();

var data = {
  users: [{
    'email': 'satoshi+1@nakamoto.com',
    'firstName': 'Satoshi',
    'lastName': 'Nakamoto',
    'phone': '1234567890',
    'agreedToTOSandPP': true
  }],
  orgs: [{
    'name': 'Bitcoin',
    'address1': '100 Main St.',
    'city': 'Atlanta',
    'state': 'GA',
    'zip': '30305',
    'country': 'United States',
    'isNonProfit': false,
    'industry': 'Accounting',
    'website': 'bitcoin.org',
    'cartPos': 'Drupal'
  }]
};

client.as('public').post('applications', data, function(err, data) {
  console.log(err || data);
});
