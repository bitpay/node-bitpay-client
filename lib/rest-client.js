var fs           = require('fs');
var request      = require('request');
var qs           = require('qs');
var extend       = require('extend');
var bitauth      = require('bitauth');
var EventEmitter = require('events').EventEmitter;
var util         = require('util');

var isWin        = process.platform === 'win32';
var HOME         = process.env[isWin ? 'USERPROFILE' : 'HOME'];
var defaultConf  = require(HOME + '/.bitpay/config.json');

/*
** BitPay REST Client
** ==================
** Instantiate with your private key to return a REST client that automatically
** handles request signing, tokens, and URI building.
*/
var RESTClient = function(privateKey, options) {
  EventEmitter.call(this);

  var self    = this;
  var options = options || { config: {} };

  options.config = extend(true, defaultConf, options.config);

  // by default, we want to sign all requests and self-initialize the client
  // by retrieving access token from the server. these should be set to false
  // in `options` passed if you don't have an account or don't have a sin
  // associated with your account see these examples:
  // - examples/generate-sin.js
  // - examples/add-client-to-account.js
  self.defaults = {
    getTokens: !!privateKey,
    signRequests: !!privateKey,
    useSession: false
  };

  // override the defaults if needed and setup container for access tokens
  self.options       = extend(true, self.defaults, options);
  self.privkey       = privateKey;
  self.tokens        = {};
  self.apiHost       = options.config.apiHost;
  self.apiPort       = options.config.apiPort;
  self.useSession    = options.config.useSession;
  self.sessionId     = null;
  self.requestNumber = 1;

  // set the default facade
  self._resetFacade();

  var createSession = function(next) {
    // Create a session if they are enabled
    if (self.options.useSession) {
      self._createSession(next);
    } else {
      next();
    }
  };

  createSession(function(err) {
    if(err) {
      return self.emit('error', err);
    }

    // automatically get access tokens from server and emit "ready" event
    // when we can start using the client
    if (self.options.getTokens) {
      return self._getAccessTokens();
    }

    // if we aren't getting access tokens, then we are ready
    process.nextTick(function() {
      self.emit('ready');
    });
  });
};

// inherit from EventEmitter
util.inherits(RESTClient, EventEmitter);

// assume another facade for the next request, this method returns the client
// so it can be chained like: client.as('payroll').get('payouts', function() {})
RESTClient.prototype.as = function(facadeName) {
  var exemptFacade = (facadeName !== 'public' && facadeName !== 'user');

  // if (exemptFacade && !this.tokens[facadeName]) {
  //   throw new Error('You do not have access to facade: ' + facadeName);
  // }

  this.facade = facadeName;
  return this;
};

// internal method used for retrieving access tokens from the server and
// updating the instances token dictionary, then fires the "ready" event
RESTClient.prototype._getAccessTokens = function() {
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
RESTClient.prototype._sendRequest = function() {
  var self         = this;
  var originalArgs = arguments;
  var args         = Array.prototype.slice.call(arguments);
  var method       = args[0];
  var path         = args[1];
  var data         = (typeof args[2] === 'function') ? {} : args[2] || {};
  var lastArg      = args[args.length - 1];
  var callback     = (typeof lastArg === 'function') ? lastArg : new Function();
  var useSSL       = (self.apiPort === 443 || self.options.config.forceSSL);
  var protocol     = useSSL ? 'https:' : 'http:';
  var apiUri       = self.apiHost + ':' + self.apiPort
  var url          = protocol + '//' + apiUri + '/' + path;

  // No longer add a nonce. Instead add sessionId and requestNumber if
  // sessions are enabled
  if(self.sessionId) {
    data.sessionId = self.sessionId;
    data.requestNumber = self.requestNumber;
  }

  // if we are creating a new resource, then generate a guid and pass it along
  if (method === 'POST' && !data.guid) {
    data.guid = self._createGuid();
  }

  // if we already have a resource token, then don't execute the following code
  if (!data.token) {
    // if we are passed a token (as a facade) directly, then set the token to it
    if (self.facade !== 'public' && self.facade !== 'user') {
      data.token = self.facade;
    }

    // unless a resource token is given, pass the facade token
    if (self.tokens[self.facade]) {
      data.token = self.tokens[self.facade];
    }
  }

  // start building the request options
  var options  = { method: method, url: url, strictSSL: false, timeout: 5000 };
  // the contract is the string we sign for the server to verify we sent the
  // request - this is url + body (if body exists)
  this._dataToSign = '' + options.url;

  // if we are creating or updating a resource, then send data as JSON payload

  if (method === 'POST' || method === 'PUT') {
    options.body = JSON.stringify(data);
    this._dataToSign += options.body;
  }
  // otherwise create a querystring and use it instead
  else {
    options.qs = data;
    if (Object.keys(options.qs).length > 0) {
      this._dataToSign += '?' + qs.stringify(options.qs);
    }
  }

  // we always send JSON data
  options.headers = {'content-type': 'application/json'};

  // add the appropriate auth headers if we need to sign the request
  if (self.options.signRequests && this.facade !== 'public') {
    options.headers['x-identity'] = bitauth.getPublicKeyFromPrivateKey(this.privkey);
    options.headers['x-signature'] = bitauth.sign(this._dataToSign, this.privkey);
  }

  // send the formed request to the server
  var tries = 0;
  var data2 = data; // For some bizarre reason data is null in handleResponse. Why???
  var req = request(options, handleResponse);

  function handleResponse(err, res, body) {
    tries++;

    if (err) {
      // Handle timeouts. Try to send the same thing one more time.
      // With Api Sessions, the server caches the last response
      if(err.code === 'ETIMEDOUT' && data2 && data2.sessionId && tries < 2) {
        return request(options, handleResponse);
      } else {
        return callback(err);
      }
    }

    // Increment requestNumber
    self.requestNumber++;

    // we should always receive JSON
    try {
      body = JSON.parse(body);
    }
    // if not, something is wrong
    catch(e) {
      return callback(new Error('Server did not return JSON and gave statusCode ' + res.statusCode));
    }

    // if we get anything but 200, that's an error
    if (res.statusCode !== 200) {
      // Handle session timeout
      if(body && body.error === 'Invalid or expired sessionId') {
        // Create a new session and try again
        self._createSession(function(err) {
          if(err) {
            return callback(err);
          }

          return self._sendRequest.apply(self, originalArgs);
        });
      }

      return callback(body);
    }

    if (body.errors && body.errors.length) return callback(body);

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
  };

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
RESTClient.prototype._processResponse = function(entity, path) {
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
RESTClient.prototype._resourceArgs = function() {
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
RESTClient.prototype._createGuid = function() {
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
RESTClient.prototype._resetFacade = function() {
  return (!this.options.sticky) ? this.facade = 'merchant' : true;
};

// Code to create a session
RESTClient.prototype._createSession = function(callback) {
  var self = this;

  self.sessionId = null;

  self.as('public').post('sessions', function(err, sessionId) {
    if (err) return callback(err);

    self.sessionId = sessionId;
    self.requestNumber = 1;
    callback();
  });
};

// and here is the meat of the public API, methods that correspond to the HTTP
// verbs you wish to use for a request. these extend from the client and from
// individual resources returned from requests.
RESTClient.prototype.get = function() {
  var args = Array.prototype.slice.call(arguments);
  return this._sendRequest.apply(this, ['GET'].concat(args));
};

RESTClient.prototype.post = function() {
  var args = Array.prototype.slice.call(arguments);
  return this._sendRequest.apply(this, ['POST'].concat(args));
};

RESTClient.prototype.put = function() {
  var args = Array.prototype.slice.call(arguments);
  return this._sendRequest.apply(this, ['PUT'].concat(args));
};

RESTClient.prototype.delete = function() {
  var args = Array.prototype.slice.call(arguments);
  return this._sendRequest.apply(this, ['DELETE'].concat(args));
};

// just give them teh codez already!
module.exports = RESTClient;
