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

  var payload = {
    items: [
      { price: 10, quantity: 1, description: 'thing' }
    ],
    name: 'Bill Merchant',
    address1: '1234 Fake St',
    city: 'Atlanta',
    state: 'GA',
    zip: '30305',
    country: 'USA',
    email: 'bill.merchant@bitpay.com',
    phone: '5555555555',
    dueDate: new Date('2014-05-30'),
    currency: 'USD',
    showRate: true
  };

  client.post('bills', payload, function(err, bill) {
    console.log(err || bill);
  });

});
