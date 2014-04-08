var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var privkey    = KeyUtils.decrypt('', encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  client.get('invoices', function(err, data) {
    console.log(err || invoices)
  });

});
