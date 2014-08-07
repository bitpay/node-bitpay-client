var read    = require('read');
var fs      = require('fs');
var bitauth = require('bitauth');

var CliUtils = function(bitpayInput, bitpayOutput) {
  this.input         = bitpayInput;
  this.output        = bitpayOutput;
  this.secret        = null;
  this.recursions    = 1;
  this.maxRecursions = 3;
}

CliUtils.prototype.getSecret = function(keypassword, callback) {
  var secret = null;

  try {
    secret = bitauth.decrypt(
      keypassword,
      fs.readFileSync(this.input + '/api.key').toString()
    );
    callback(null, secret);
  }
  catch(err) {
    callback(err, secret);
  }
}

CliUtils.prototype.recursiveGetSecret = function(keypassword, done) {
  var self = this;

  self.getSecret(keypassword, function(err, output) {
    if (err) {
      // ask for key password
      read({
        prompt: 'Enter Key Password: ',
        silent: true
      }, function(err, input) {
        if (err) {
          return console.log(err);
        }

        if (self.recursions < self.maxRecursions) {
          self.recursions++;
          self.recursiveGetSecret(input, done);
        }
        else {
          console.log('Exiting.');
          process.exit();
        }
      })
    }
    else {
      done(output);
    }
  })
}

module.exports = CliUtils;
