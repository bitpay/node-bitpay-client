var proxyquire = require('proxyquire');
var should     = require('should');
var sinon      = require('sinon');
var bitauth    = require('bitauth');

describe('RESTClient', function() {

  var sin = bitauth.generateSin();

  var RESTClient = proxyquire('../lib/rest-client', {
    'request': sinon.stub().returnsArg(0).callsArgWithAsync(1, null, {
      statusCode: 200
    }, '{ "data": [{}] }')
  });

  describe('#new', function() {

    it('should create an instance of the client without a secret', function(done) {
      var client = new RESTClient();
      client.defaults.getTokens.should.equal(false);
      client.defaults.signRequests.should.equal(false);
      client.on('ready', done);
    });

    it('should create an instance of the client with a secret', function(done) {
      var client = new RESTClient(sin.priv);
      client.defaults.getTokens.should.equal(true);
      client.defaults.signRequests.should.equal(true);
      client.on('ready', done);
    });

    it('should override default configuration if provided', function(done) {
      var client = new RESTClient(sin.priv, {
        config: {
          apiHost: 'myhost',
          apiPort: 'myport',
          forceSSL: false
        }
      });
      client.apiHost.should.equal('myhost');
      client.apiPort.should.equal('myport');
      done();
    });

  });

  describe('#as', function() {

    it('should change the client facade', function(done) {
      var client = new RESTClient(sin.priv);
      client.as('public').facade.should.equal('public');
      done();
    });

    it('should reset the client facade after request', function(done) {
      var client = new RESTClient(sin.priv);
      client.as('public').get('rates', function(err, data) {
        should.not.exist(err);
        client.facade.should.equal('merchant');
        done();
      });
    });

  });

  describe('#_sendRequest', function() {

    it('should sign the request if a secret is given', function(done) {
      var request = new RESTClient(sin.priv).get('rates');
      should.exist(request.headers['x-pubkey']);
      should.exist(request.headers['x-signature']);
      done();
    });

    it('should send the GET verb using client.get()', function(done) {
      var request = new RESTClient().get('rates');
      request.method.should.equal('GET');
      done();
    });

    it('should send the PUT verb using client.put()', function(done) {
      var request = new RESTClient().put('rates');
      request.method.should.equal('PUT');
      done();
    });

    it('should send the POST verb using client.post()', function(done) {
      var request = new RESTClient().post('rates');
      request.method.should.equal('POST');
      done();
    });

    it('should send the DELETE verb using client.delete()', function(done) {
      var request = new RESTClient().delete('rates');
      request.method.should.equal('DELETE');
      done();
    });

  });

  describe('#_processResponse', function() {

    it('should extend the response with new verb methods', function(done) {
      var client = new RESTClient();
      client.get('rates', function(err, data) {
        should.not.exist(err);
        data[0].get.should.be.type('function');
        data[0].put.should.be.type('function');
        data[0].post.should.be.type('function');
        data[0].delete.should.be.type('function');
        done();
      });
    });

  });

  describe('#_createGuid', function() {

    it('should create a proper guid', function(done) {
      var client = new RESTClient();
      client._createGuid().should.have.length(36);
      done();
    });

  });

});
