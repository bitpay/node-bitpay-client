var fs         = require('fs');
var bitauth    = require('bitauth');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var config     = require('../config');
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  client.get('bills', function(err, data) {
    var bill = data[0];
    console.log(bill);
    bill.put({ 
      status: 'ready', 
      email: 'gordon@bitpay.com' 
    }, function(err, bill) {
      console.log(err || bill);
    });

  });

});
