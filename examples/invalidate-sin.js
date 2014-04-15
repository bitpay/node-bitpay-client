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

  client.get('keys', function(err, sins) {
    // invalidate the oldest sin
    var sin = sins[sins.length - 1];
    sin.delete(function(err, result) {
      console.log(err || result);
    });
  });

});
