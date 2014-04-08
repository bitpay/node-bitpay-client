BitPay Node.js API Client
==========================

A Node.js module and command line client for interacting with BitPay's Cryptographically Secure API.

## Getting Started

Install using [Node Package Manager](https://www.npmjs.org/).

```
~# npm install bitpay-api
```

Alternatively, for using the CLI, install globally.

```
~# sudo npm install -g bitpay-api
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

### Programmatically (using Capabilities-based interface)

```js
var BitPay  = require('bitpay-api');
var privkey = fs.readFileSync('path/to/private.key');
var client  = new BitPay(privkey);

// listen for client ready
client.on('ready', function() {
    // get a list of invoices
    var merchant = client.merchant;
    merchant.getInvoices(function(err, invoices) {
        // get refunds for the first invoice
        var invoice = invoices[0];
        invoice.getRefunds(function(err, refunds) {
            console.log(refunds);
        });
    });
});
```

### Command Line (using Capabilities-based interface)

```
~# bitpay-api merchant getInvoices
~# bitpay-api <invoice-token> getRefunds
```
