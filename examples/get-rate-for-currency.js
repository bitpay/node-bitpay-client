var BitPay     = require('../lib/rest-client');
var client     = new BitPay();

client.as('public').get('rates/usd', function(err, data) {
  console.log(err || data);
});

