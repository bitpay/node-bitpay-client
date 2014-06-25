var fs         = require('fs');
var bitauth    = require('bitauth');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var config     = require('../config');
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

var data = {
  price: 100,
  currency: 'USD',
  notificationURL: 'http://your-ipn-server'
};

client.on('ready', function() {

  client.post('invoices', data, function(err, invoice) {
    console.log(err || invoice);
  });

});
