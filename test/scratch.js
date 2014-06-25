require('debug-trace')({ always: true });
var fs     = require('fs');
var assert = require('assert');
var async  = require('async');

var BitPay = require('../lib/rest-client');

var HOME       = process.env['HOME'];
var config     = require('../config');
var bitauth    = require('bitauth');
var encPrivkey = fs.readFileSync(HOME + '/.bitpay/api.key').toString();
var privkey    = bitauth.decrypt(config.keyPassword, encPrivkey);

// TODO: enable strict SSL
// TODO: enable 301 redirect following
var bitpay = new BitPay( privkey );

/*/function done(err, thing, res) {
  console.log(err || thing);
} /**/

// TODO: allow POST /users
// TODO: allow POST /orgs (and merge applications into this)
// wat
/*/bitpay.as('public').post('users', {
  email: 'eric@bitpay.com'
}, done );/**/

var sin = bitauth.generateSin();
var testContext = require('crypto').createHash('sha1').update( sin.sin ).digest('hex');

//var bitpay = new BitPay(  );

async.series([
  /*/function(done) {
    bitpay.as('public').post('keys', {
        sin:   bitauth.getSin( privkey )
      , email: 'eric@bitpay.com'
      , label: 'test-key-env'
    }, function(err, key) {
      console.log(err || key);
      done(null, key);
    });
  }, /**/
  function createApplication(done) {
    bitpay.as('public').post('applications', {
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
    }, function(err, data) {
      application = data;
      done(err, data);
    });
  },
  function addNewKey(done) {

    var bitauth = require('bitauth');
    var sin = bitauth.generateSin();

    bitpay.as('public').post('keys', {
        sin:   sin.sin
      , email: 'eric@bitpay.com'
      , label: 'test-key-generated'
    }, function(err, data) {
      key = data;
      done(err, data);
    });
  },
  function getAllKeys(done) {
    bitpay.as('user').get('keys', function(err, userKeys) {
      keys = userKeys;
      done(err, userKeys);
    });
  },
  function approveAddedKey(done) {
    var bitauth = require('bitauth');
    var sin = bitauth.generateSin();

    bitpay.as('public').post('keys', {
        sin:   sin.sin
      , email: 'eric@bitpay.com'
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
  },
  // TODO: allow GET of a specific key
  /*/function getApprovedKey(done) {
    bitpay.as('user').get('keys/' + key.id, done );
  }, /**/
  function getAllKeys(done) {
    bitpay.as('user').get('keys', done );
  },
  function getAllOrganizations(done) {
    bitpay.as('user').get('orgs', done );
  },
  // TODO: allow the creation of an organization
  /*/ function createAnOrganization(done) {
    bitpay.as('user').post('orgs', {

    }, done );
  }, /**/
  // TODO: disable this -- force this to be /users/:userID
  function getUser(done) {
    bitpay.as('user').get('user', done );
  },
  // TODO: disable this -- force this to be /users/:userID
  // this ia a great use case; different scopes will be able to
  // modify different properties of the user
  // TODO: allow from user scope
  function modifyUser(done) {
    var newNumber = Math.random();
    bitpay.as('user').put('user', {
      phone: newNumber
    }, function(err, user) {
      if (err) { console.log(err); }

      // TODO: get user again, to verify change
      done(null, err);
    });
  },
  // TODO: merge rates into this
  function getCurrencies(done) {
    bitpay.as('public').get('currencies', done );
  },
  // TODO: merge this into currencies
  function getRates(done) {
    bitpay.as('public').get('rates', done );
  },
  // TODO: merge this into currencies
  // TODO: pick random currencies, or try to get all
  function getSpecificRate(done) {
    bitpay.as('public').get('rates/usd', done );
  },
  // TODO: actually require fields
  function createBill(done) {
    console.log('createBill');
    bitpay.as('merchant').post('bills', {

    }, function(err, createdBill) {
      bill = createdBill;
      done(null, createdBill);
    });
  },
  function getBills(done) {
    bitpay.as('merchant').get('bills', done );
  },
  function getBill(done) {
    bitpay.as('merchant').get('bills/' + bill.id , done );
  },
  // TODO: determine why this test isn't functioning
  function updateBill(done) {
    var item = {
        description: 'Test item'
      , price: 1.00
      , quantity: 1
    }

    console.log('test item: ' , item)

    bitpay.as('merchant').put('bill/' + bill.id , {
      items: [ item ]
    }, function(err, updatedBill) {
      console.log(err || updatedBill);
      done(null, updatedBill);
    } );
  },
  // TODO: check if the bill has the correct updates
  function getCreatedBill(done) {
    console.log('tested ')
    bitpay.as('merchant').get('bills/' + bill.id , function(err, createdBill) {
      done(null, createdBill);
    } );
  },
  // TODO: test more than one currency
  function createInvoice(done) {
    bitpay.as('merchant').post('invoices', {
        price: 1.99
      , currency: 'USD'
    }, function(err, createdInvoice) {
      invoice = createdInvoice;

      console.log(err || createdInvoice);
      if (err) { console.log('^ err'); }
      done(null, createdInvoice);
    } );
  },
  // TODO: check if invoice from above exists
  function getInvoices(done) {
    bitpay.as('merchant').get('invoices', {
      dateStart: 0
    }, function(err, invoices) {
      
      console.log('invoices: ', err || invoices);
      done(null, invoices);
    });
  },
  function getInvoice(done) {
    bitpay.as('merchant').get('invoices/' + invoice.id , function(err, receivedInvoice) {
      console.log('invoice: ', err || receivedInvoice);
      
      done(err, receivedInvoice);
    });
  },
  // TODO: notifications
  // TODO: refunds
  function getLedgers(done) {
    bitpay.as('merchant').get('ledgers', function(err, receivedLedgers) {
      console.log('ledgers: ' , err || receivedLedgers);
      done(err, receivedLedgers);
    });
  },
  // TODO: get specific ledger
  function createPayout(done) {
    bitpay.as('payroll').post('payouts', {
      instructions: [
        { amount: 10, address: 'foo' }
      ]
    }, function(err, createdPayout) {
      done(err, createdPayout)
    });
  }
], function(err, results) {
  console.log(results);
  console.log(err);
  console.log('series complete');
});




