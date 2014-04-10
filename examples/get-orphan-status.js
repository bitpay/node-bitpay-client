var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var config     = require('../config');
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

if (process.argv.length < 3) {
  console.log("Usage: get-payout-request.js [invoiceID]");
  return;
}

client.on('ready', function() {
  client.get('invoices/' + process.argv[2], function(err, invoice) {
    if(err) console.log(err);
    invoice.get('orphans', function(err, txs) {
      console.log(err || txs)
    });
  });
});
