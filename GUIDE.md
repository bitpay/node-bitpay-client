title: Node.js Guide
github: https://github.com/bitpay/node-bitpay-client/edit/master/GUIDE.md
---
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
var BitPay  = require('bitpay');
var privkey = fs.readFileSync('path/to/private.key');
var bitpay  = BitPay.createClient( privkey );

bitpay.on('ready', function() {
  bitpay.post('invoices', function(err, invoice) {
    console.log(err || invoice);
  });
});

```
You will receive either an `err` if any error took place, or an `invoice` if the invoice was successfully created.

### Issuing A Refund
Every Invoice on BitPay has a "refunds" subcollection.  To create a refund request, POST into it:

```javascript
bitpay.post('invoices/:invoiceID/:refunds', function(err, refundRequest) {
  
});
```

### Create a Recurring Bill
```javascript
bitpay.post('subscriptions', {
  billData: {/*...*/},// type: Bill.  See the Bill Schema.
  schedule: 'monthly' // type: enumerable, ['weekly', 'monthly', 'quarterly', 'yearly']
})
```

Bill Schema: https://bitpay.com/api#resource-Bills


[bitpay registration]: https://bitpay.com/start
