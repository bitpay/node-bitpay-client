var assert     = require('assert');
var fs         = require('fs');
var BitPay     = require('../lib/rest-client');

var config     = require('../config');
var bitauth    = require('bitauth');
var encPrivkey = fs.readFileSync( config.configDir + '/api.key').toString();
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);

var client     = new BitPay( privkey , {
  sticky: true
});

describe('Key API', function() {

  describe('add new key', function() {
    it('should create a new key', function(done) {
      var sin = bitauth.generateSin();

      bitpay.as('public').post('keys', {
          sin:   sin.sin
        , email: 'test@bitpay.com'
        , label: 'test-key-generated'
      },  done );
    });
  });

  describe('approve added key', function() {
    it('should create and approve a key', function(done) {
      var sin = bitauth.generateSin();

      bitpay.as('public').post('keys', {
          sin:   sin.sin
        , email: 'test@bitpay.com'
        , label: 'test-key-generated'
      }, function(err, newKey) {

        console.log( 'will be approving ', newKey);
        bitpay.as('user').get('keys', function(err, userKeys) {

          for (var i = 0; i < userKeys.length; i++) {
            console.log( userKeys[ i ] );
            if (userKeys[ i ].id === newKey.id) {
              var keyToApprove = userKeys[i];
            }
          }

          keyToApprove.put({
            approved: true
          }, function(err, resultingKey) {
            console.log(err || resultingKey);
            done(err, resultingKey); // TODO: fix
          });
        });
      });
    });
  });

});
