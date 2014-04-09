var fs         = require('fs');
var async      = require('async');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var privkey    = KeyUtils.decrypt('', encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  client.as('payroll').get('payouts/CDpiwsLZkSYy3NMZoNH9SP', function(err, request) {
    console.log(err || request);
  });

});




