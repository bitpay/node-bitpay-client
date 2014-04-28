var assert = require('assert');
var BitPay     = require('../lib/rest-client');
var client     = new BitPay();

describe('User API', function(){
  var bitpay = client.as('user');

  describe('get keys', function(){
    it('should list some previously created keys', function(done) {
      bitpay.get('keys', done );
    });
  });

  describe('modify keys', function(){
    it('should modify some previously created keys', function(done) {
      bitpay.get('keys', function(err, keys) {

        // TODO: switch this to status: { type: String, enum: ['approved', 'disabled'] }
        bitpay.put('keys/' + keys[0].id , {
          status: 'approved' || 'disabled'
        }, done );

      });
    });
  });

  describe('get organizations', function() {
    it('should list available organizations', function(done) {
      bitpay.get('orgs', done );
    });
  });

  describe('modify an organization', function() {
    it('should successfully modify an organization', function(done) {
      bitpay.get('orgs', function(err, orgs) {

        var oldOrg = orgs[0];
        var newName = orgs[0].name + Math.random().substring(0, 5);

        bitpay.put('orgs/' + org.id , {
          name: newName
        } , function(err, newOrg) {

          assert.equal( newName , newOrg.name );
        });
      });
    });
  });

});
