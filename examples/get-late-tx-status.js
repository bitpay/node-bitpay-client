var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var config     = require('../config');
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {
  client.get('invoices/6sGCDUhxyuXza1N3YY6LwU', function(err, invoice) {
    console.log(invoice);
    invoice.get('tx-requests', function(err, txs) {
      console.log(err || txs)
    });
  });
});
