var fs         = require('fs');
var async      = require('async');
var bitauth    = require('bitauth');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var config     = require('../config');
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('error', function(err) {
    console.log(err);
});

client.on('ready', function() {

  client.post('bills', function(err, bill) {
    console.log(err || bill);
  });

});
