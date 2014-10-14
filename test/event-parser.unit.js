var should = require('should');
var stream = require('stream');

describe('EventParser', function() {

  var EventParser = require('../lib/event-parser');

  it('should successfully parse the stream', function(done) {
    var events = new stream.Readable();
    var parser = new EventParser();

    events._read = function() {
      events.push('event: test\ndata: {"foo":"bar"}');
      events.push(null);
    };

    parser.on('test', function(data) {
      data.foo.should.equal('bar');
      done();
    });

    events.pipe(parser);
  });

  it('should gracefully handle bad data', function(done) {
    var events = new stream.Readable();
    var parser = new EventParser();

    events._read = function() {
      events.push('blah blah blah\tbad: \n\n data');
      events.push(null);
    };

    events.on('end', function() {
      done();
    });

    events.pipe(parser);
  });

});
