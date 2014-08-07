#!/usr/bin/env node

var isWin        = process.env.platform === 'win32';
var HOME         = process.env[isWin ? 'USERPROFILE' : 'HOME'];
var bitpay       = require('commander');
var BitPay       = require('../index');
var fs           = require('fs');
var crypto       = require('crypto');
var read         = require('read');
var async        = require('async');
var bitauth      = require('bitauth');
var hashPassword = require('../lib/hash-password');
var CliUtils     = require('../lib/cli-utils');

// ensure the existence of the default in/out directory
if (!fs.existsSync(HOME + '/.bitpay')) {
  fs.mkdirSync(HOME + '/.bitpay');
}

bitpay
  .version('0.0.4')
  .option('-o, --output [directory]', 'export directory for keys', HOME + '/.bitpay')
  .option('-i, --input [directory]', 'import directory for keys', HOME + '/.bitpay')
  .option('-k, --keypassword [password]', 'password for encrypting/decrypting your key', '')
  .option('-p, --password [password]', 'password for your bitpay user', '')
  .option('-e, --email [email]', 'email for your bitpay user', '')
  .option('-t, --twofactor [code]', 'two-factor code for your bitpay user', '')

var utils = new CliUtils(bitpay.input, bitpay.output);

bitpay
  .command('keygen')
  .description('generate key pair to associate with your bitpay user')
  .action(function() {

    function saveKeys() {
      getPassword(function(keypassword) {
        console.log('Generating keys...');

        var sin    = bitauth.generateSin();
        var secret = bitauth.encrypt(keypassword, sin.priv);

        // write the files
        console.log('Writing keys...');

        fs.writeFileSync(bitpay.output + '/api.key', secret);
        fs.writeFileSync(bitpay.output + '/api.pub' , sin.sin);

        console.log('Keys saved to:', bitpay.output, '\r');

        process.exit();
      });
    };

    function getPassword(callback) {
      var keypassword = null;

      if (!bitpay.keypassword) {
        return read({
          prompt: 'Key Password (optional): ',
          silent: true
        }, function(err, input) {
          if (err) {
            return console.log(err);
          }

          if (input) {
            keypassword = input;

            //check again to make sure there wasn't a typo
            return read({
              prompt: 'Verify Key Password: ',
              silent: true
            }, function(err, input2) {
              if (err) {
                return console.log(err);
              }

              if (keypassword === input2) {
                return callback(keypassword);
              }

              console.log('Passwords did not match');
              process.exit();
            });
          }

          callback(input);

        });
      }

      callback(bitpay.keypassword)
    };

    var hasPrivateKey = fs.existsSync(bitpay.output + '/api.key');
    var hasPublicKey  = fs.existsSync(bitpay.output + '/api.pub');

    if (hasPrivateKey || hasPublicKey) {
      return bitpay.confirm(
        'Keys already exist at ' + bitpay.output + '. Do you wish to overwrite them?\n',
        function(ok) {
          if (ok) {
            return saveKeys()
          }

          console.log('Aborted.')
          process.exit();
        }
      );
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
    var client = BitPay.createClient();

    // handle errors
    client.on('error', function(err) {
      console.log('Error:', err);
    });

    function getEmail(callback) {
      if (!bitpay.email) {
        return read({
          prompt: 'BitPay User Email: ',
          silent: false
        }, function(err, input) {
          if (err) {
            return callback(err);
          }

          callback(null, input);
        });
      }

      callback(null, bitpay.email)
    };

    function getTwoFactorCode(callback) {
      if (!bitpay.twofactor) {
        return read({
          prompt: 'BitPay User Two-Factor Code (optional): ',
          silent: false
        }, function(err, input) {
          if (err) {
            return callback(err);
          }

          callback(null, input);
        })
      }

      callback(null, bitpay.twofactor)
    };

    function getPassword(callback) {
      if (!bitpay.password) {
        return read({
          prompt: 'BitPay User Password: ',
          silent: true
        }, function(err, input) {
          if (err) {
            return console.log(err);
          }

          hashPassword(input, function(err, hashedInput) {
            if (err) {
              return callback(err);
            }

            callback(null, hashedInput);
          });
        });
      };

      callback(bitpay.password)
    }

    async.series(
      [
        getEmail,
        getPassword,
        getTwoFactorCode
      ],
      function(err, results) {
        if (err) {
          return console.log(err);
        }

        var email         = results[0];
        var password      = results[1];
        var twoFactorCode = results[2];

        var payload = {
          id: sin,
          email: email,
          label: 'node-bitpay-client'
        };

        if (password) {
          payload.hashedPassword = password;
        }

        if (twoFactorCode) {
          payload.twoFactorCode = twoFactorCode;
        }

        client.as('public').post('clients', payload, function(err, result) {
          if (err) {
            return console.log('Error:', err);
          }

          console.log('Success!');
        });

      }
    );

  });




bitpay
  .command('logout')
  .description('invalidate client identity from your bitpay user')
  .action(function() {
    if (!fs.existsSync(bitpay.input + '/api.key')) {
      return console.log(
        'Error:', 'Access key not found, did you run `bitpay login`?'
      );
    }

    var sin = fs.readFileSync(bitpay.input + '/api.pub').toString();

    utils.recursiveGetSecret(bitpay.keypassword, function(secret) {
      var client = BitPay.createClient(secret, {
        sticky: true
      });

      // handle errors
      client.on('error', function(err) {
        console.log('Error:', err);
      });

      // associate key
      client.on('ready', function() {

        client.as('user').get('clients', function(err, clients) {
          if (err) {
            return console.log('Error:', err.error);
          }

          console.log('Invalidating keys...');

          clients.forEach(function(key) {
            if (key.id === sin) {
              key.put({
                disabled: true
              }, function(err) {
                if (err) {
                  return console.log('Error:', err.error);
                }

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
      return console.log(
        'Error:', 'Access key not found, did you run `bitpay login`?'
      );
    }

    utils.recursiveGetSecret(bitpay.keypassword, function(secret){
      var client = BitPay.createClient(secret);

      // handle errors
      client.on('error', function(err) {
        console.log('Error:', err);
      });

      // get user info
      client.on('ready', function() {
        client.as('user').get('user', function(err, user) {
          if (err) {
            return console.log('Error:', err.error);
          }

          console.log(
            '\nName: ' + user.name +
            '\nEmail: ' + user.email +
            '\nPhone: ' + user.phone
          );
        });
      });
    });

  });

bitpay.parse(process.argv);

if (!bitpay.args.length) return bitpay.help();
