var fs         = require('fs');
var async      = require('async');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var config     = require('../config');
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

if (process.argv.length < 3) {
  console.log("Usage apply-late-transaction.js [invoiceID]");
  return;
}

client.on('ready', function() {

  client.get('invoices/' + process.argv[2], function(err, invoice) {
    invoice.get('orphans', function(err, orphans) {
      console.log(orphans);
      
      async.eachSeries(orphans, function(orph, next) {

        invoice.post('tx-requests', { orphanId: orph.id }, function(err, req) {
          console.log(err || req);
          next();
        });

      });

    });
  });

});
