var imports = require('soop').imports;
var request = imports.request || require('request');
var config  = imports.config || JSON.parse(fs.readFileSync('../config.json'));

var BitPay = function(privateKey) {
  BitPay.super(this, arguments);

  if (!privateKey) {
    // maybe we load automatically if not specified?
    throw new Error('Could not instantiate API without private key.');
  }

  this.facade  = 'merchant';
  this.privkey = privateKey;
  this.tokens  = {};
  this.apiHost = config.apiHost;
  this.apiPort = config.apiPort;
};

BitPay.parent = imports.parent || require('events').EventEmitter;

BitPay.prototype._sendRequest(method, path, callback) {


  this._resetFacade();
};

BitPay.protostype.as = function(facadeName) {
  if (!tokens[facadeName]) {
    throw new Error('You do not have access to facade: ' + facadeName);
  }
  this.facade = facadeName;
  return this;
};

BitPay.prototype.resetFacade = function() {
  // reset facade
  this.facade = 'merchant';
};

/*
** Convenience Methods
*/
BitPay.prototype.get = function(path, callback) {
  this._sendRequest('GET', path, callback);
};

BitPay.prototype.post = function(path, callback) {
  this._sendRequest('POST', path, callback);
};

BitPay.prototype.put = function(path, callback) {
  this._sendRequest('PUT', path, callback);
};

BitPay.prototype.delete = function(path, callback) {
  this._sendRequest('DELETE', path, callback);
};
