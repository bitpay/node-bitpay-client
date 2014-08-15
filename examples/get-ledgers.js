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

  var today      = new Date().getTime();
  var oneWeekAgo = new Date(today - 1000 * 60 * 60 * 24 * 7).getTime();

  client.get('ledgers', function(err, data) {
    console.log(err || data);
  });

});
