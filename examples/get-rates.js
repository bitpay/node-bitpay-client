var BitPay     = require('../lib/rest-client');
var client     = new BitPay();

client.as('public').get('rates', function(err, rates) {
  console.log(err || rates);
});

