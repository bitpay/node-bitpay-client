var BitPay     = require('../lib/rest-client');
var client     = new BitPay();

client.as('public').get('currencies', function(err, data) {
  console.log(err || data)
});

