var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var privkey    = KeyUtils.decrypt('', encPrivkey);
var client     = new BitPay(privkey);

var data = {
  price: 100,
  currency: 'USD'
};

client.on('ready', function() {

  client.post('invoices', data, function(err, invoice) {
    console.log(err || data);

  });

});
