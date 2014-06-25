#!/usr/bin/env node

var isWin   = process.env.platform === 'win32';
var HOME    = process.env[isWin ? 'USERPROFILE' : 'HOME'];
var bitpay  = require('commander');
var BitPay  = require('../lib/rest-client');
var fs      = require('fs');
var bitauth = require('bitauth');

// ensure the existence of the default in/out directory
if (!fs.existsSync(HOME + '/.bitpay')) {
  fs.mkdirSync(HOME + '/.bitpay');
}

bitpay
  .version('0.0.1')
  .option('-o, --output [directory]', 'export directory for keys', HOME + '/.bitpay')
  .option('-i, --input [directory]', 'import directory for keys', HOME + '/.bitpay')
  .option('-p, --password [password]', 'password for encrypting/decrypting your key', '')
  .option('-e, --email [email]', 'your bitpay email address');

bitpay
  .command('keygen')
  .description('generate key pair to associate with account')
  .action(function() {
    if (fs.existsSync(bitpay.output + '/api.key') || fs.existsSync(bitpay.output + '/api.pub')) {
      return bitpay.confirm('Keys already exist at ' + bitpay.output + '. Do you wish to overwrite them?', function(ok) {
        if (ok) saveKeys();
        else process.exit();
      });
    }

    saveKeys();

    function saveKeys() {
      var sin    = bitauth.generateSin();
      var secret = bitauth.encrypt(bitpay.password, sin.priv);
      // write the files
      fs.writeFileSync(bitpay.output + '/api.key', secret);
      fs.writeFileSync(bitpay.output + '/api.pub' , sin.sin);
      console.log('Keys saved to:', bitpay.output);
    };
  });

bitpay
  .command('login')
  .description('associate client identity with your bitpay account')
  .action(function() {
    if (!bitpay.email) {
      return console.log('Error:', 'You must supply your BitPay email address')
    }
    if (!fs.existsSync(bitpay.input + '/api.key')) {
      return console.log('Error:', 'Access key not found, did you run `bitpay keygen`?');
    }
    var secret = fs.readFileSync(bitpay.input + '/api.key').toString();
    var client = new BitPay();
    // handle errors
    client.on('error', function(err) {
      console.log('Error:', err);
    });
    // associate key
    client.as('public').post('clients', {
      id: bitauth.getSin(bitauth.decrypt(bitpay.password, secret)),
      email: bitpay.email,
      label: 'node-bitpay-client'
    }, function(err, result) {
      if (err) return console.log('Error:', err.error);
      console.log('Key associated! Check your email to approve access.');
    });
  });

bitpay
  .command('logout')
  .description('invalidate client access key from your bitpay account')
  .action(function() {
    if (!fs.existsSync(bitpay.input + '/api.key')) {
      return console.log('Error:', 'Access key not found, did you run `bitpay login`?');
    }
    var sin    = fs.readFileSync(bitpay.input + '/api.pub').toString();
    var secret = bitauth.decrypt(
      bitpay.password,
      fs.readFileSync(bitpay.input + '/api.key').toString()
    );
    var client = new BitPay(secret, { sticky: true });
    // handle errors
    client.on('error', function(err) {
      console.log('Error:', err);
    });
    // associate key
    client.on('ready', function() {
      client.as('user').get('clients', function(err, clients) {
        if (err) return console.log('Error:', err.error);
        clients.forEach(function(key) {
          if (key.id === sin) {
            key.put({ disabled: true }, function(err) {
              if (err) return console.log('Error:', err.error);
              fs.unlinkSync(bitpay.input + '/api.pub');
              fs.unlinkSync(bitpay.input + '/api.key');
              console.log('Key invalidated successfully! You are now logged out.');
            });
          }
        });
      });
    });
  });

bitpay
  .command('whoami')
  .description('retrieve user information for your account')
  .action(function() {
    if (!fs.existsSync(bitpay.input + '/api.key')) {
      return console.log('Error:', 'Access key not found, did you run `bitpay login`?');
    }
    var secret = bitauth.decrypt(
      bitpay.password,
      fs.readFileSync(bitpay.input + '/api.key').toString()
    );
    var client = new BitPay(secret);
    // handle errors
    client.on('error', function(err) {
      console.log('Error:', err);
    });
    // get user info
    client.on('ready', function() {
      client.as('user').get('user', function(err, user) {
        if (err) return console.log('Error:', err.error);
        console.log(
          '\nName: ' + user.name + '\nEmail: ' + user.email + '\nPhone: ' + user.phone
        );
      });
    });
  });

bitpay.parse(process.argv);

if (!bitpay.args.length) return bitpay.help();
