var imports   = require('soop').imports;
var fs        = imports.fs || require('fs');
var request   = imports.request || require('request');
var qs        = imports.qs || require('querystring');
var extend    = require('extend');
var KeyUtils  = imports.KeyUtils || require('./key-utils');
var config    = imports.config || require('../config');

/*
** BitPay REST Client
** ==================
** Instantiate with your private key to return a REST client that automatically
** handles request signing, tokens, and URI building.
*/
var BitPay = function(privateKey, options) {
  BitPay.super(this, arguments);

  var self = this;

  if (!privateKey) {
    // maybe we load automatically if not specified?
    throw new Error('Could not instantiate API without private key.');
  }

  // set the default facade 
  self._resetFacade();

  // by default, we want to sign all requests and self-initialize the client
  // by retrieving access token from the server. these should be set to false 
  // in `options` passed if you don't have an account or don't have a sin 
  // associated with your account see these examples:
  // - examples/generate-sin.js
  // - examples/add-sin-to-account.js
  self.defaults = {
    getTokens: true,
    signRequests: true
  };

  // override the defaults if needed and setup container for access tokens
  self.options  = extend(true, self.defaults, options || {});
  self.privkey  = privateKey;
  self.tokens   = {};
  self.apiHost  = config.apiHost;
  self.apiPort  = config.apiPort;

  // automatically get access tokens from server and emit "ready" event
  // when we can start using the client
  if (self.options.getTokens) self._getAccessTokens();
};

// inherit from EventEmitter
BitPay.parent = imports.parent || require('events').EventEmitter;

// assume another facade for the next request, this method returns the client
// so it can be chained like: client.as('payroll').get('payouts', function() {})
BitPay.prototype.as = function(facadeName) {
  var exemptFacade = (facadeName !== 'public' && facadeName !== 'user');

  if (exemptFacade && !this.tokens[facadeName]) {
    throw new Error('You do not have access to facade: ' + facadeName);
  }

  this.facade = facadeName;
  return this;
};

// internal method used for retrieving access tokens from the server and 
// updating the instances token dictionary, then fires the "ready" event 
BitPay.prototype._getAccessTokens = function() {
  var self = this;

  self.as('user').get('tokens', function(err, body) {
    if (err) return self.emit('error', err);
    
    body.forEach(function(tokenObj) {
      for (var facade in tokenObj) {
        self.tokens[facade] = tokenObj[facade];
      }
    });

    self.emit('ready');
  });
};

// generic request wrapper which handles forming a request, signing it, and 
// processing the results
BitPay.prototype._sendRequest = function() {
  var self     = this;
  var args     = Array.prototype.slice.call(arguments);
  var method   = args[0];
  var path     = args[1];
  var data     = (typeof args[2] === 'function') ? {} : args[2] || {};
  var lastArg  = args[args.length - 1];
  var callback = (typeof lastArg === 'function') ? lastArg : new Function();
  var protocol = (this.apiPort === 443 || config.forceSSL) ? 'https:' : 'http:';
  var apiUri   = this.apiHost + ':' + this.apiPort
  var url      = protocol + '//' + apiUri + '/' + path;
  
  console.log(url)

  // create a nonce, unless one is explicitly specified
  if (!data.nonce) data.nonce = new Date().getTime();
  // if we are creating a new resource, then generate a guid and pass it along
  if (method === 'POST' && !data.guid) data.guid = this._createGuid();
  // unless a resource token is given, pass the facade token
  if (!data.token && this.tokens[this.facade]) {
    data.token = this.tokens[this.facade];
  }

  // start building the request options
  var options  = { method: method, url: url, strictSSL: false };
  // the contract is the string we sign for the server to verify we sent the 
  // request - this is url + body (if body exists)
  var contract = '' + options.url;

  // if we are creating or updating a resource, then send data as JSON payload
  if (method === 'POST' || method === 'PUT') {
    options.body = JSON.stringify(data);
    contract += options.body;
  }
  // otherwise create a querystring and use it instead
  else {
    options.qs = data;
    contract += '?' + qs.stringify(options.qs);
  }

  // we always send JSON data
  options.headers = {'content-type': 'application/json'};

  // add the appropriate auth headers if we need to sign the request
  if (self.options.signRequests && this.facade !== 'public') {
    options.headers['x-pubkey']    = KeyUtils.getPubKey(this.privkey);
    options.headers['x-signature'] = KeyUtils.sign(contract, this.privkey);
  }

  // send the formed request to the server
  var req = request(options, function(err, res, body) {
    if (err) return callback(err);

    // we should always receive JSON
    try {
      body = JSON.parse(body);
    }
    // if not, something is wrong
    catch(e) {
      return callback(e);
    }
    
    // if we get anything bu 200, that's an error 
    if (res.statusCode !== 200) return callback(body);

    var processedResults;
    // we wrap results in a facade object on the server before sending it back
    // we are only concerned with the data though, so let's ignore any other
    var data = body.data || body;

    // if we just have a string, just pass it along
    if (typeof data === 'string') {
      processedResults = data;
    }
    // if we have a list of results, we need to process them, so we can perform
    // further operations on those resources
    else if (data instanceof Array) {
      processedResults = data.map(function(obj) {
        return self._processResponse(obj, path);
      });
    }
    // same goes for a single result
    else {
      processedResults = self._processResponse(data, path);
    }

    // all done
    if (callback) callback(null, processedResults);
  });

  // back to merchant facade for next request
  this._resetFacade();
  
  // we return the request object, so that it can be piped to another stream
  // if the user so fancies - however note that this method will circumvent
  // result processing - so you are on your own there
  return req;
};

// supplements results from the API with methods of their own, allowing you to 
// keep performing more actions on resources returned 
// - it's turtles all the way down!
BitPay.prototype._processResponse = function(entity, path) {
  var self        = this;
  var methods     = ['get', 'post', 'put', 'delete'];
  // build the resource's own uri and path
  var hasIdInPath = path.indexOf(entity.id) !== -1;
  var identifier  = entity.id ? entity.id + '/' : '';
  var path        = hasIdInPath ? (path + '/') : (path + '/' + identifier);

  // save the path to the resource as a non-enumerable
  Object.defineProperty(entity, 'path', { value: path });

  // for every HTTP verb we support, define a method on the resource that 
  // points to the existing method at the top level, but bind the arguments
  // to this specific resource
  methods.forEach(function(m) {
    Object.defineProperty(entity, m, { 
      value: function() {
        var args      = Array.prototype.slice.call(arguments);
        var boundArgs = self._resourceArgs.apply(entity, args);
        self[m].apply(self, boundArgs);
      }
    });
  });

  // voila! fancy!
  return entity;
};

// when called within the context of a resource, we get back an array of args
// to pass to our HTTP verb methods, so the call is bound to the resource
BitPay.prototype._resourceArgs = function() {
  var entity   = this;
  var args     = Array.prototype.slice.call(arguments);
  var path     = (typeof args[0] === 'string') ? entity.path + args[0] : entity.path;
  var noPath   = (typeof args[0] === 'object');
  var data     = (typeof args[1] === 'function') ? ((noPath) ? args[0] : {}) : (args[1] || {});
  var lastArg  = args[args.length - 1];
  var callback = (typeof lastArg === 'function') ? lastArg : new Function();

  data.token = entity.token;
  
  return [path, data, callback];
};

// helper for generating GUIDs (which are required for POSTs)
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

// we call this after every request, so any request not using the merchant
// facade, should be prefaced with `.as(facade)`
BitPay.prototype._resetFacade = function() {
  return this.facade = 'merchant';
};

// and here is the meat of the public API, methods that correspond to the HTTP
// verbs you wish to use for a request. these extend from the client and from
// individual resources returned from requests.
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

// just give them teh codez already!
module.exports = require('soop')(BitPay);
