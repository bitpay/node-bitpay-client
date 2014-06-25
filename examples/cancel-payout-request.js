var fs         = require('fs');
var async      = require('async');
var bitauth    = require('bitauth');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var config     = require('../config');
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  client.as('payroll').get('payouts', { status: 'new' }, function(err, requests) {
    
    var firstRequest = requests[0];

    firstRequest.put({ status: 'cancelled'}, function(err, req) {
      console.log(err || req);
    });

  });

});




