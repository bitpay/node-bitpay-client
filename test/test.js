var assert = require('assert');
var BitPay     = require('../lib/rest-client');
var client     = new BitPay();

describe('Public API', function(){

  var bitpay = client.as('public');

  describe('get rates', function(){
    it('should serve a list of rates', function(done){
      bitpay.get('rates', done );
    });
  });
  describe('get single rate', function(){
    it('should serve a single rates', function(done){
      bitpay.get('rates/usd', done );
    });
  });
  describe('get currencies', function(){
    it('should serve a list of currencies', function(done){
      bitpay.get('currencies', done );
    });
  });
  describe('create key', function() {
    it('should successfully generate and submit a sin', function(done) {
      var KeyUtils = require('../lib/key-utils');
      var sin = KeyUtils.generateSin();

      bitpay.post('keys', {
          sin:   sin
        , email: 'test@bitpay.com'
        , label: 'test key'
      }, done );

    });
  });
  /*/describe('approve key', function() {
    it('should successfully generate and submit a sin', function(done) {
      bitpay.put('keys', {
        verificationCode:
      }, done );
    });
  }); /**/

  

  describe('create application', function() {
    it('should successfully create an application', function(done) {

      var data = {
        users: [ {
            email: 'test@bitpay.com'
          , firstName: 'Test'
          , lastName: 'User'
          , phone: '+1 (855) 424-8729'
        } ],
        orgs: [ {
            name: 'BitPay Test'
          , address1: '123 Test St.'
          , city: 'Atlanta'
        } ]
      }

      bitpay.post( 'applications' , data , done );
    });
  });


});
