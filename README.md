BitPay Node.js API Client
==========================
[![Build Status](https://travis-ci.org/bitpay/node-bitpay-client.svg)](https://travis-ci.org/bitpay/node-bitpay-client)
[![Coverage Status](https://coveralls.io/repos/bitpay/node-bitpay-client/badge.png?branch=master)](https://coveralls.io/r/bitpay/node-bitpay-client?branch=master)

A Node.js module and command line client for interacting with
[BitPay's Cryptographically Secure API](https://bitpay.com/api).

## Getting Started

Install using [Node Package Manager](https://www.npmjs.org/).

```
~# npm install bitpay
```

If you do not use NPM to install (instead cloning this repository), you will
need to run the following from the project root:

```
~# npm run setup
```

## Usage

### CLI

Use the `bitpay` command line program to generate your client keys and
associate them with your account.

```
~# cd bitpay && npm link
~# bitpay keygen
~# bitpay pair
```

If you switch your environment a lot, you can avoid editing your config file:

```
~# bitpay config --use prod
~# bitpay config --use test
```

You can even create custom preset configurations:

```
~# bitpay config --set apiHost --value gordon.bp
~# bitpay config --save local
~# bitpay config --use local
```

Last but not least, you can issue API requests directly from the command line:

```
~# bitpay request -T merchant -R invoices -P '{"dateStart":"2014-01-01"}'
```

For more information on how to use the CLI, run:

```
~# bitpay --help
```

### Module

Require the BitPay API and create a client instance using your private key.

```js
var bitpay  = require('bitpay');
var privkey = fs.readFileSync('path/to/private.key');
var client  = bitpay.createClient(privkey);
```

The client will automatically retrieve your access tokens and emit a *ready*
event when you can start sending requests.

```js
client.on('ready', function() {
    client.get('invoices', function(err, invoices) {
        console.log(err || invoices);
    });
});
```

When resources are returned, they get extended with the same methods as the
`client`, so you can chain requests onto them. For instance, to get the refunds
associated with the first invoice returned from the example above:

```js
client.get('invoices', function(err, invoices) {
    invoices[0].get('refunds', function(err, refunds) {
        console.log(err || refunds);
    });
});
```

### Overloading Configuration

The BitPay client loads a configuration file from `~/.bitpay/config.json` by
default, which it creates after installation. You can override this default
configuration, by passing a `config` value in the options argument.

Example:

```js
var client = bitpay.createClient(privKey, {
  config: {
    apiHost: 'bitpay.com',
    apiPort: 443
  }
});
```

### Assuming a Different Facade

Some operations in the API are only available to certain "facades", which
restrict access to different functionality. By default, all requests are sent
using the **merchant** facade. To assume a different facade, you can use the
`as()` method.

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

All of the `client` methods return a `Stream`, which you may use for more
custom implementations. Here is a very rudimentary example using
[Clarinet](https://github.com/dscape/clarinet), a streaming JSON parser.

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
