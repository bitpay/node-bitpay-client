var fs         = require('fs');
var HOME       = process.env['HOME'];
var bitauth    = require('bitauth');
var bitpay     = require('../index');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var privkey    = bitauth.decrypt('', encPrivkey); // decrypt with your key pass
var client     = bitpay.createClient(privkey);

var data = {
  amount: 400,
  currency: 'USD',
  reference: '12345',
  effectiveDate: 1390246334,
  pricingMethod: 'vwapPrev24hBitstamp',
  notificationURL: 'https://svr03psmy.myco.com/advice/bpb',
  instructions: [
    {
      label: 'BillGates',
      address: 'mfahwRvbhQVtMWvdHWsdgVGYgimqqzZEXB',
      amount: 50
    },{
      label: 'TimCook',
      address: 'mfadguj41aYgEwPATAFnkKcKQNqhpNTrdi',
      amount: 50
    },{
      label: 'SatyaNadella',
      address: 'mfZJUVDcKii3GgX3xfD6gFUGMfuh9cLuf6',
      amount: 300
    }
  ]
};

client.on('error', function(err) {
  console.log(err);
});

client.on('ready', function() {

  client.as('payroll').post('payouts', data, function(err, payoutrequest) {
    console.log(err || payoutrequest)
  });

});
