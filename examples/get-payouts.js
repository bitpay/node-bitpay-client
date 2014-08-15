var fs         = require('fs');
var HOME       = process.env['HOME'];
var bitauth    = require('bitauth');
var bitpay     = require('../index');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var privkey    = bitauth.decrypt('', encPrivkey); // decrypt with your key pass
var client     = bitpay.createClient(privkey);

client.on('error', function(err) {
    console.log(err);
});

client.on('ready', function() {

  client.as('payroll').get('payouts', { status: 'new' }, function(err, request) {
    console.log(err || request);
  });

});
