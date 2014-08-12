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

describe('Application API', function() {

  var bitpay = client.as('public');

  describe('create application', function() {
    it('should create an application', function(done) {
      bitpay.post('applications', {
        users: [{
            email: 'eric+test@bitpay.com'
          , firstName: 'Eric'
          , lastName: 'Martindale'
          , phone: '+1 (919) 374-2020'
        }],
        orgs: [{
            name: 'Test Org'
          , address1: '3432 Piedmont Rd.'
          , city: 'Atlanta'
          // TODO: allow submission of Numbers
          , zip: '30305'
          , country: 'USA'
        }]
      }, done );
    });
  });

});
