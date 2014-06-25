var fs         = require('fs');
var bitauth    = require('bitauth');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var config     = require('../config');
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  var today      = new Date().getTime();
  var oneWeekAgo = new Date(today - 1000 * 60 * 60 * 24 * 7).getTime();

  client.get('ledgers/btc', { 
    startDate: oneWeekAgo,
    endDate: today
  }, function(err, data) {
    console.log(err || data)
  });

});
