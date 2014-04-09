BitPay Node.js API Client
==========================

A Node.js module and command line client for interacting with [BitPay's Cryptographically Secure API](https://bitpay.com/api).

## Getting Started

Install using [Node Package Manager](https://www.npmjs.org/).

```
~# npm install bitpay-api
```

## Usage

### Programmatically (using RESTful interface)

```js
var BitPay  = require('bitpay-api');
var privkey = fs.readFileSync('path/to/private.key');
var client  = new BitPay(privkey);

// listen for client ready
client.on('ready', function() {
    // get a list of invoices
    client.get('invoices', function(err, invoices) {
        // get refunds for the first invoice
        var invoice = invoices[0];
        invoice.get('refunds', function(err, refunds) {
            console.log(refunds);
        });
    }); 
});

client.on('error', function(err) {
    console.log(err);
});
```

