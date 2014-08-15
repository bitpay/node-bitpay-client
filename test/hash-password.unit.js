var should = require('should');

describe('hashPassword', function() {

  var hashPassword = require('../lib/hash-password');
  var cleartext    = 'mypassword';
  var hashedtext   = null;
  var storedhash   = null;

  it('should successfully hash the text', function(done) {
    hashPassword(cleartext, function(err, hash) {
      should.not.exist(err);
      should.exist(hash);
      hashedtext = hash;
      done();
    });
  });

  it('should hash the hashed text', function(done) {
    hashPassword(hashedtext, function(err, doublehash) {
      should.not.exist(err);
      should.exist(doublehash);
      storedhash = doublehash;
      done();
    });
  });

  it('should match the hashed password with the stored hash', function(done) {
    hashPassword(cleartext, function(err, hash) {
      hash.should.equal(hashedtext);
      hashPassword(hash, function(err, stored) {
        stored.should.equal(storedhash);
        done();
      })
    });
  });

});
