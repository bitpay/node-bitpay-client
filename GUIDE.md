# Using BitPay with Node.js

## Prerequisites
To follow this guide, you must have [a working BitPay Client ID](http://dev.bitpay.com/docs/getting-started.html).

## Node.js Quick Start

Using BitPay with your Node.js project is extremely simple.  Once you've [registered a BitPay account][bitpay registration], install the `bitpay` project via <abbr title="node package manager" class="tooltipped">npm</abbr>:

```bash
$ npm install bitpay --save
```

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

[bitpay registration]: https://bitpay.com/start
