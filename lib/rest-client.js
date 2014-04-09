var imports  = require('soop').imports;
var fs       = imports.fs || require('fs');
var request  = imports.request || require('request');
var qs       = imports.qs || require('querystring');
var extend   = require('extend');
var KeyUtils = imports.KeyUtils || require('./key-utils');
var config   = imports.config || JSON.parse(fs.readFileSync('../config.json'));

var BitPay = function(privateKey, options) {
  BitPay.super(this, arguments);

  var self = this;

  if (!privateKey) {
    // maybe we load automatically if not specified?
    throw new Error('Could not instantiate API without private key.');
  }

  self._resetFacade();

  self.defaults = {
    getTokens: true,
    signRequests: true
  };
  self.options  = extend(true, self.defaults, options || {});
  self.privkey  = privateKey;
  self.tokens   = {};
  self.apiHost  = config.apiHost;
  self.apiPort  = config.apiPort;

  if (self.options.getTokens) self._getAccessTokens();
};

BitPay.parent = imports.parent || require('events').EventEmitter;

BitPay.prototype.as = function(facadeName) {
  if (facadeName !== 'public' && !this.tokens[facadeName]) {
    throw new Error('You do not have access to facade: ' + facadeName);
  }
  this.facade = facadeName;
  return this;
};

/*
** Private Methods
*/
BitPay.prototype._getAccessTokens = function() {
  var self = this;

  self.as('public').get('tokens', function(err, body) {
    if (err) return self.emit('error', err);
    
    body.forEach(function(tokenObj) {
      for (var facade in tokenObj) {
        self.tokens[facade] = tokenObj[facade];
      }
    });

    self.emit('ready');
  });
};

BitPay.prototype._sendRequest = function() {
  var self     = this;
  var args     = Array.prototype.slice.call(arguments);
  var method   = args[0];
  var path     = args[1];
  var data     = (typeof args[2] === 'function') ? {} : args[2];
  var lastArg  = args[args.length - 1];
  var callback = (typeof lastArg === 'function') ? lastArg : new Function();
  var protocol = (this.apiPort === 443 || config.forceSSL) ? 'https:' : 'http:';
  var apiUri   = this.apiHost + ':' + this.apiPort
  var url      = protocol + '//' + apiUri + '/' + path;
  
  if (!data.nonce) data.nonce = new Date().getTime();
  if (method === 'POST' && !data.guid) data.guid = this._createGuid();
  if (!data.token) data.token = this.tokens[this.facade];

  var options  = { method: method, url: url, strictSSL: false };
  var contract = '' + options.url;

  if (method === 'POST' || method === 'PUT') {
    options.body = JSON.stringify(data);
    contract += options.body;
  }
  else {
    options.qs = data;
    contract += '?' + qs.stringify(options.qs);
  }

  options.headers = {'content-type': 'application/json'};

  if (self.options.signRequests) {
    options.headers['x-pubkey']    = KeyUtils.getPubKey(this.privkey);
    options.headers['x-signature'] = KeyUtils.sign(contract, this.privkey);
  }
  
  console.log(url)

  var req = request(options, function(err, res, body) {
    if (err) return callback(err);

    try {
      body = JSON.parse(body);
    }
    catch(e) {
      return callback(e);
    }
    
    if (res.statusCode !== 200) return callback(body);

    var processedResults;
    var data = body.data || body;

    if (typeof data === 'string') {
      processedResults = data;
    }
    else if (data instanceof Array) {
      processedResults = data.map(function(obj) {
        return self._processResponse(obj, path);
      });
    }
    else {
      processedResults = self._processResponse(data, path);
    }

    callback(null, processedResults);
  });

  this._resetFacade();
  
  return req;
};

BitPay.prototype._processResponse = function(entity, path) {
  var self        = this;
  var methods     = ['get', 'post', 'put', 'delete'];
  var hasIdInPath = path.indexOf(entity.id) !== -1;
  var path        = hasIdInPath ? (path + '/') : (path + '/' + entity.id + '/');

  Object.defineProperty(entity, 'path', { value: path });

  methods.forEach(function(m) {
    Object.defineProperty(entity, m, { 
      value: function() {
        var args      = Array.prototype.slice.call(arguments);
        var boundArgs = self._resourceArgs.apply(entity, args);
        self[m].apply(self, boundArgs);
      }
    });
  });

  return entity;
};

BitPay.prototype._resourceArgs = function() {
  var entity   = this;
  var args     = Array.prototype.slice.call(arguments);
  var path     = (typeof args[0] === 'string') ? entity.path + args[0] : entity.path;
  var data     = (typeof args[1] === 'function') ? (args[0] || {}) : args[1];
  var lastArg  = args[args.length - 1];
  var callback = (typeof lastArg === 'function') ? lastArg : new Function();
  
  data.token = entity.token;
  
  return [path, data, callback];
};

BitPay.prototype._createGuid = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  };
  function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + 
           s4() + s4();
  };
  return guid();
};

BitPay.prototype._resetFacade = function() {
  return this.facade = 'merchant';
};

/*
** Convenience Methods
*/
BitPay.prototype.get = function() {
  var args = Array.prototype.slice.call(arguments);
  return this._sendRequest.apply(this, ['GET'].concat(args));
};

BitPay.prototype.post = function() {
  var args = Array.prototype.slice.call(arguments);
  return this._sendRequest.apply(this, ['POST'].concat(args));
};

BitPay.prototype.put = function() {
  var args = Array.prototype.slice.call(arguments);
  return this._sendRequest.apply(this, ['PUT'].concat(args));
};

BitPay.prototype.delete = function() {
  var args = Array.prototype.slice.call(arguments);
  return this._sendRequest.apply(this, ['DELETE'].concat(args));
};

module.exports = require('soop')(BitPay);
