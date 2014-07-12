var fs         = require('fs');
var async      = require('async');
var bitauth    = require('bitauth');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var config     = require('../config');
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

if (process.argv.length < 3) {
  console.log("Usage apply-late-transaction.js [invoiceID]");
  return;
}

client.on('error', function(err) {
    console.log(err);
});

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
