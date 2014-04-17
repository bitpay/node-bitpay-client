var fs         = require('fs');
var async      = require('async');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var config     = require('../config');
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  client.as('user').get('keys', function(err, sins) {
    console.log(err || sins);
  });

});
