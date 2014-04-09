var fs         = require('fs');
var KeyUtils   = require('../lib/key-utils');
var HOME       = process.env['HOME'];
var keypath    = HOME + '/.bp/api.key';
var config     = require('../config')
var stdin      = process.stdin;

console.log('--------');
console.log("[Note: for ease of use in other examples this password will be saved in plaintext to config.json]");
console.log('--------')
console.log("Password to encrypt your key with? (hit enter for no pw)");
stdin.setRawMode(true);
stdin.setEncoding('utf8')
stdin.resume();

//CLI password entry
var password = '';
stdin.on('data', function (ch) {
  ch = ch + "";

  switch (ch) {
    case "\n":
    case "\r":
    case "\u0004":
      // They've finished typing their password
      process.stdout.write('\n');
      stdin.setRawMode(false);
      stdin.pause();
      savePassword(false, password);
      break;
    case "\u0003":
      // Ctrl-C
      savePassword( true);
      break;
    default:
      // More passsword characters
      process.stdout.write('*');
      password += ch;
      break;
  }
});

//Save encryption password
function savePassword(canceled, text) {
  if (canceled) {
    console.log('Canceled');
    process.exit();
  }

  var sin        = KeyUtils.generateSin();
  var encPrivKey = KeyUtils.encrypt(text, sin.priv);

  config.keyPassword = text;
  fs.writeFileSync('../config.json', JSON.stringify(config, null, 4));
  process.stdin.pause();

  console.log(sin);
  console.log('Encrypted private key: ' + encPrivKey);

// prevent overwriting of existing keys after multiple executions.
  if (fs.existsSync( keypath )) {
    var hash = require('crypto').createHash('sha1').update( fs.readFileSync( keypath ) );
    fs.renameSync( keypath , HOME + '/.bp/api.' + hash.digest('hex').substring(0, 5) + '.key' );
  }

  fs.writeFileSync( keypath , encPrivKey);
}




