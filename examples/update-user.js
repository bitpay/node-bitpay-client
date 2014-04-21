var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var config     = require('../config');
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  client.as('user').get('user', function(err, user) {
    console.log(user)
    user.put({
      phone: '123-456-7890',
      name: 'Satoshi Nakamoto'
    }, function(err, user) {
      console.log(err || user);
    });
  });

});
