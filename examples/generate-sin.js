var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];

var sin        = KeyUtils.generateSin();
var encPrivKey = KeyUtils.encrypt('', sin.priv);

console.log(sin);
console.log('Encrypted private key: ' + encPrivKey);
fs.writeFileSync(HOME + '/.bp/api.key', encPrivKey);
