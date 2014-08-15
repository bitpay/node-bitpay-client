var bitpay     = require('../index');
var client     = bitpay.createClient();

client.as('public').get('rates', function(err, rates) {
  console.log(err || rates);
});
