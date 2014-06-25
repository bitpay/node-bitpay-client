var fs         = require('fs');
var bitauth    = require('bitauth');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var config     = require('../config');
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);

var client = new BitPay();

var data = {
  email: 'gordon@bitpay.com',
  id: bitauth.getSin(privkey),
  label: 'my nodejs app'
};

client.as('public').post('clients', data, function(err, data) {
  console.log(err || data);
});
