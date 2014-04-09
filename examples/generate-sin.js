var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var keypath    = HOME + '/.bp/api.key';

var sin        = KeyUtils.generateSin();
var encPrivKey = KeyUtils.encrypt('', sin.priv);

console.log(sin);
console.log('Encrypted private key: ' + encPrivKey);

// prevent overwriting of existing keys after multiple executions.
if (fs.existsSync( keypath )) {
  var hash = require('crypto').createHash('sha1').update( fs.readFileSync( keypath ) );
  fs.renameSync( keypath , HOME + '/.bp/api.' + hash.digest('hex').substring(0, 5) + '.key' );
}

fs.writeFileSync( keypath , encPrivKey);
