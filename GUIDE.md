# Using BitPay with Node.js

## Prerequisites
To follow this guide, you must have [a working BitPay Client ID](http://dev.bitpay.com/docs/getting-started.html).

## Node.js Quick Start

Using BitPay with your Node.js project is extremely simple.  Once you've [registered a BitPay account][bitpay registration], install the `bitpay` project via <abbr title="node package manager" class="tooltipped">npm</abbr>:

```bash
$ cd <your project folder>
$ npm install bitpay --save
```
You'll notice that we've added the `--save` parameter to automatically save the BitPay library to your `package.json` file.

Now, in your Node application, creating an Invoice is as simple as follows:

### Creating An Invoice

```javascript
var bitpay  = require('bitpay');
var privkey = fs.readFileSync('path/to/private.key');
var client  = bitpay.createClient( privkey );

client.on('ready', function() {
  client.post('invoices', function(err, invoice) {
    console.log(err || invoice);
  });
});

```
You will receive either an `err` if any error took place, or an `invoice` if the invoice was successfully created.

### Issuing A Refund
Every Invoice on BitPay has a "refunds" subcollection.  To create a refund request, POST into it:

```javascript
client.post('invoices/:invoiceID/:refunds', function(err, refundRequest) {
  
});
```

[bitpay registration]: https://bitpay.com/start
