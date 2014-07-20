BitPay Node.js API Client
==========================

A Node.js module and command line client for interacting with [BitPay's Cryptographically Secure API](https://test.bitpay.com/api).

> Note: This API is currently only available in our *test* environment (test.bitpay.com) and is not yet ready for production.

## Getting Started

Install using [Node Package Manager](https://www.npmjs.org/).

```
~# npm install bitpay
```

## Usage

### CLI

Use the `bitpay` command line program to generate your client keys and associate them with your account.

```
~# cd bitpay && sudo npm link
~# bitpay keygen
~# bitpay keyapprove
~# bitpay keyrevoke
```

For more information on how to use the CLI, run:

```
~# bitpay --help
```

You can check to make sure you have correctly set up your client keys by running:

```
~# bitpay who
```

### Module

Require the BitPay API and create a client instance using your private key.

```js
var BitPay  = require('bitpay');
var privkey = fs.readFileSync('path/to/private.key');
var client  = new BitPay(privkey);
```

The client will automatically retrieve your access tokens and emit a *ready* event when you can start sending requests.

```js
client.on('ready', function() {
    client.get('invoices', function(err, invoices) {
        console.log(err || invoices);
    });
});
```

When resources are returned, they get extended with the same methods as the `client`, so you can chain requests onto them. For instance, to get the refunds associated with the first invoice returned from the example above:

```js
client.get('invoices', function(err, invoices) {
    invoices[0].get('refunds', function(err, refunds) {
        console.log(err || refunds);
    });
});
```

### Overloading Configuration

The BitPay client loads a configuration file from the root of the module. If you do not commit your `node_modules` to source control, you will need to overload the `config` dependency from within your own code.
This can be done easily using a tool like [Soop](https://github.com/gasteve/node-soop) or [Proxyquire](https://github.com/thlorenz/proxyquire).

Example using Soop:

```js
var soop = require('soop');
var BitPay = soop.load('bitpay', {
  config: { /* ... */ }
});
```

Example using Proxyquire:

```js
var proxyquire = require('proxyquire');
var BitPay = proxyquire('bitpay', {
  '../config': { /* ... */ }
});
```

### Assuming a Different Facade

Some operations in the API are only available to certain "facades", which restrict access to different functionality. By default, all requests are sent using the **merchant** facade. To assume a different facade, you can use the `as()` method.

```js
client.as('payroll').get('payouts', { status: 'new' }, function(err, payouts) {
    async.eachSeries(payouts, function(payout, done) {
        payout.put({ status: 'cancelled' }, done);
    }, function(err) {
        console.log('Cancelled all new payout requests.');
    });
});
```

### Streaming Responses

All of the `client` methods return a `Stream`, which you may use for more custom implementations. Here is a very rudimentary example using [Clarinet](https://github.com/dscape/clarinet), a streaming JSON parser.

```js
var parser = require('clarinet').createStream();
var count  = 0;

parser.on('key', function(key) {
  if (key === 'id') {
    parser.once('value', function(val) {
      count++;
      console.log('Got invoice: ' + val);
    });
  }
});

parser.on('end', function() {
  console.log('Streamed ' + count + ' invoices!');
});

client.get('invoices').pipe(parser);
```
