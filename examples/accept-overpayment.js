var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var config     = require('../config')
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);
var client     = new BitPay(privkey);

client.on('ready', function() {

  client.get('invoices/KLydw6yFiZrhSWsqMW6aSk', function(err, invoice) {
    if (!invoice) return console.log('Invoice not found.');
    invoice.post('adjustments', { type: 'acceptOverPayment' }, function(err, result) {
      console.log(err || result);
    });
  });

});
