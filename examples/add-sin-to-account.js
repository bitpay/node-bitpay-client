var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var BitPay     = require('../lib/rest-client');
var encPrivkey = fs.readFileSync(HOME + '/.bp/api.key').toString();
var config     = require('../config')
var privkey    = KeyUtils.decrypt(config.keyPassword, encPrivkey);

var client = new BitPay(privkey, { 
  getTokens: false,
  signRequests: false 
});

hashPassword('bitpay', function(err, hash) {

  var data = {
    email: 'gordon@bitpay.com',
    sin: KeyUtils.getSin(privkey),
    hashedPassword: hash
  };

  console.log(data);

  client.as('public').post('sins', data, function(err, data) {
    console.log(err || data);
  });

});


client.on('error', function(err) {
  console.log(err);
});

function hashPassword(password, callback) {
  var crypto     = require('crypto');
  var salt       = '..............';
  var iterations = 200;
  var keylen     = 64;

  crypto.pbkdf2(password, salt, iterations, keylen, function(err, derivedKey) {
    if(err) {
      console.log(err);
    }
    callback(err, derivedKey.toString('hex'));
  });
};
