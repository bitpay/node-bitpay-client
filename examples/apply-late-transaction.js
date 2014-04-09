var fs         = require('fs');
var async      = require('async');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var config     = require('../config')
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  client.get('invoices/6sGCDUhxyuXza1N3YY6LwU', function(err, invoice) {
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
