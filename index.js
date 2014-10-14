/*
** bitpay-client
*/

var RESTClient  = require('./lib/rest-client');
var EventParser = require('./lib/event-parser');

module.exports = {
  createClient: function(secret, options) {
    return new RESTClient(secret, options);
  },
  Client: RESTClient,
  EventParser: EventParser
};
