var stream = require('stream');
var util   = require('util');

var EventParser = function() {
  stream.Transform.call(this, { objectMode: true });
};

util.inherits(EventParser, stream.Transform);

EventParser.prototype._transform = function(data, encoding, done) {
  var self  = this;
  var chunk = data.toString();

  // if the chunk is padding, trim it
  if (chunk.charAt(0) === ':') {
    chunk = chunk.substr(1).trim();
  }

  var messages = chunk.split('\n\n');

  // parse messages
  messages.forEach(function(msg) {
    var parts     = msg.split('\n');
    var eventType = null;
    var eventData = null;

    parts.forEach(function(part) {
      var key   = part.split(': ')[0];
      var value = part.split(': ')[1];

      if (key === 'event') {
        eventType = value
      }
      else if (key === 'data') {
        eventData = JSON.parse(value);
      }
    });

    if (eventType && eventData) {
      self.emit(eventType, eventData);
      self.push({ event: eventType, data: eventData });
    }
  });

  done();
};

module.exports = EventParser;
