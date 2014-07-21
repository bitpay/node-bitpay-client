#!/usr/bin/env node

var isWin   = process.env.platform === 'win32';
var HOME    = process.env[isWin ? 'USERPROFILE' : 'HOME'];
var bitpay  = require('commander');
var BitPay  = require('../lib/rest-client');
var fs      = require('fs');
var crypto = require('crypto')
var read = require('read')
var bitauth = require('bitauth');

// ensure the existence of the default in/out directory
if (!fs.existsSync(HOME + '/.bitpay')) {
  fs.mkdirSync(HOME + '/.bitpay');
}

bitpay
  .version('0.0.3')
  .option('-o, --output [directory]', 'export directory for keys', HOME + '/.bitpay')
  .option('-i, --input [directory]', 'import directory for keys', HOME + '/.bitpay')
  .option('-k, --keypassword [password]', 'password for encrypting/decrypting your key', '')
  .option('-p, --password [password]', 'password for your bitpay user', '')
  .option('-e, --email [email]', 'email for your bitpay user', '')
  .option('-t, --twofactor [code]', 'two-factor code for your bitpay user', '')


var BitPayUtils = function(){
  this.secret = null;
  this.recursions = 1;
  this.maxRecursions = 3;
}

BitPayUtils.prototype.getSecret = function(keypassword, callback){
  var secret = null;
  try {
    secret = bitauth.decrypt(
      keypassword,
      fs.readFileSync(bitpay.input + '/api.key').toString()
    );
    callback(null, secret);
  } catch(err) {
    callback(err, secret);
  }
}

BitPayUtils.prototype.recursiveGetSecret = function(keypassword, done){
  
  var self = this;

  self.getSecret(keypassword, function(err, output){
    if (err) {
      // ask for key password
      read({ prompt: 'Enter Key Password: ', silent: true }, function(err, input) {
        if (err) return console.log(err);
        if ( self.recursions < self.maxRecursions ) {
          self.recursions++;
          self.recursiveGetSecret(input, done);
        } else {
          console.log('Exiting.')
          process.exit();
        }
      })
    } else {
      done(output)
    }
  })
}

var utils = new BitPayUtils();

bitpay
  .command('keygen')
  .description('generate key pair to associate with your bitpay user')
  .action(function() {

    var saveKeys = function(){
      getPassword(function(keypassword){
        console.log('Generating keys...')
        var sin    = bitauth.generateSin();
        var secret = bitauth.encrypt(keypassword, sin.priv);
        // write the files
        console.log('Writing keys...')
        fs.writeFileSync(bitpay.output + '/api.key', secret);
        fs.writeFileSync(bitpay.output + '/api.pub' , sin.sin);
        console.log('Keys saved to:', bitpay.output, '\r');
        process.exit()
      });
    }

    var getPassword = function(callback){
      var keypassword = null;
      if ( !bitpay.keypassword ) {
        read({ prompt: 'Key Password (optional): ', silent: true }, function(err, input) {
          if (err) return console.log(err);
          if (input) {
            keypassword = input;
            //check again to make sure there wasn't a typo
            read({ prompt: 'Verify Key Password: ', silent: true }, function(err, input2) {
              if (err) return console.log(err);
              if (keypassword == input2) {
                callback(keypassword);
              } else {
                console.log("Passwords didn't match");
                process.exit();
              }
            })
          } else {
            callback(input);
          }
        })
      } else {
        callback(bitpay.keypassword)
      }
    }

    if (fs.existsSync(bitpay.output + '/api.key') || fs.existsSync(bitpay.output + '/api.pub')) {
      return bitpay.confirm('Keys already exist at ' + bitpay.output + '. Do you wish to overwrite them?\r', function(ok) {
        if (ok) {
          saveKeys()
        } else {
          console.log('Aborted.')
          process.exit();
        }
      });
    }

    saveKeys();

  });

bitpay
  .command('login')
  .description('associate client identity with your bitpay user')
  .action(function() {

    if (!fs.existsSync(bitpay.input + '/api.key')) {
      return console.log('Error:', 'Access key not found, did you run `bitpay keygen`?');
    }
    var sin    = fs.readFileSync(bitpay.input + '/api.pub').toString();
    var client = new BitPay();

    // handle errors
    client.on('error', function(err) {
      console.log('Error:', err);
    });

    var getEmail = function(callback){
      if ( !bitpay.email ) {
        read({ prompt: 'BitPay User Email: ', silent: false }, function(err, input) {
          if (err) return console.log(err);
          callback(input);
        })
      } else {
        callback(bitpay.email)
      }
    }

    var getTwoFactorCode = function(callback){
      if ( !bitpay.twofactor ) {
        read({ prompt: 'BitPay User Two-Factor Code (optional): ', silent: false }, function(err, input) {
          if (err) return console.log(err);
          callback(input);
        })
      } else {
        callback(bitpay.twofactor)
      }
    }

    var getPasswordHashed = function(password, callback){
      crypto.pbkdf2(password, '..............', 200, 64, callback);
    }

    var getPassword = function(callback){
      if ( !bitpay.password ) {
        read({ prompt: 'BitPay User Password: ', silent: true }, function(err, input) {
          if (err) return console.log(err);
          callback(input)
        })
      } else {
        callback(bitpay.password)
      }
    }

    var email, hashedPassword, twoFactorCode

    getEmail(function(input){
      email = input;
      getPassword(function(passwordInput){
        getPasswordHashed(passwordInput, function(err, hashedInput){
          hashedPassword = hashedInput
          if (err) return console.log(err);
          getTwoFactorCode( function(codeInput){
            twoFactorCode = codeInput;
            client.as('public').post('clients', {
              id: sin,
              email: email,
              twoFactorCode: twoFactorCode,
              hashedPassword: hashedPassword.toString('hex'),
              label: 'node-bitpay-client'
            }, function(err, result) {
              if (err) return console.log('Error:', err.error);
              console.log('Key added and approved!');
            });
          })
        })
      })
    })
  });




bitpay
  .command('logout')
  .description('invalidate client identity from your bitpay user')
  .action(function() {
    if (!fs.existsSync(bitpay.input + '/api.key')) {
      return console.log('Error:', 'Access key not found, did you run `bitpay keyapprove`?');
    }

    var sin = fs.readFileSync(bitpay.input + '/api.pub').toString();

    utils.recursiveGetSecret(bitpay.keypassword, function(secret){
      var client = new BitPay(secret, { sticky: true });
      // handle errors
      client.on('error', function(err) {
        console.log('Error:', err);
      });
      // associate key
      client.on('ready', function() {
        client.as('user').get('clients', function(err, clients) {
          if (err) return console.log('Error:', err.error);
          console.log('Invalidating keys...')
          clients.forEach(function(key) {
            if (key.id === sin) {
              key.put({ disabled: true }, function(err) {
                if (err) return console.log('Error:', err.error);
                console.log('Key invalidated successfully! Deleting keys...');
                fs.unlinkSync(bitpay.input + '/api.pub');
                fs.unlinkSync(bitpay.input + '/api.key');
                console.log('Done.');
                process.exit();
              });
            }
          });
        });
      });
    });
  });

bitpay
  .command('whoami')
  .description('retrieve user information for your bitpay user')
  .action(function() {
    if (!fs.existsSync(bitpay.input + '/api.key')) {
      return console.log('Error:', 'Access key not found, did you run `bitpay keyapprove`?');
    }

    utils.recursiveGetSecret(bitpay.keypassword, function(secret){
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

  });

bitpay.parse(process.argv);

if (!bitpay.args.length) return bitpay.help();
