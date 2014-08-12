/*
** bitpay-client
*/

var RESTClient = require('./lib/rest-client');

module.exports = {
  createClient: function(secret, options) {
    return new RESTClient(secret, options);
  },
  Client: RESTClient
};
