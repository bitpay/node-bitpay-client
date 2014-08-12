var fs         = require('fs');
var bitauth    = require('bitauth');
var HOME       = process.env['HOME'];
var BitPay     = require('../index');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var config     = require(HOME + '/.bitpay/config');
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);
var client     = BitPay.createClient(privkey);

var data = {
  price: 100,
  currency: 'USD',
  notificationURL: 'http://your-ipn-server'
};

client.on('error', function(err) {
    console.log(err);
});

client.on('ready', function() {

  client.as('merchant').post('invoices', data, function(err, invoice) {
    console.log(err || invoice);
  });

});
