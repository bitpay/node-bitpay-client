var imports  = require('soop').imports;
var base58   = imports.base58 || require('base58-native');
var crypto   = imports.crypto || require('crypto');
var bitcore  = imports.bitcore || require('bitcore');
var SIN      = bitcore.SIN;
var SINKey   = bitcore.SINKey;
var Key      = bitcore.Key;
var coinUtil = bitcore.util;

var KeyUtils = function() {

};

KeyUtils.generateSin = function() {
  var sk = new SINKey();
  sk.generate();
  var obj = sk.storeObj();
  
  return obj;      
};

KeyUtils.getPubKey = function(privkey) {
  try {
    var key = new Key();
    key.private = new Buffer(privkey, 'hex');
    key.regenerateSync();
    return key.public.toString('hex');
  } catch (err) {
    console.log(err);
    return null;      
  }
};

KeyUtils.getSin = function(privkey) {
  try {
    var key = new Key();
    key.private = new Buffer(privkey, 'hex');
    key.regenerateSync();
    var pubkeyHash = coinUtil.sha256ripe160(key.public);
    var sin = new SIN(SIN.SIN_EPHEM, pubkeyHash);
    return sin.toString();
  } catch (err) {
    console.log(err);
    return null;      
  }
};

KeyUtils.sign = function(data, privkey) {
  var hash = coinUtil.sha256(data);

  try {
    var key = new Key();
    key.private = new Buffer(privkey, 'hex');
    return key.signSync(hash).toString('hex');
  } catch (err) {
    console.log(err.stack);
    console.log(err);
    return null;
  }      
};

KeyUtils.encrypt = function(password, str) {
  var aes256 = crypto.createCipher('aes-256-cbc', password);
  var a = aes256.update(str, 'utf8');
  var b = aes256.final();
  var buf = new Buffer(a.length + b.length);
  a.copy(buf, 0);
  b.copy(buf, a.length);
  return base58.encode(buf);    
};

KeyUtils.decrypt = function(password, str) {
  var aes256 = crypto.createDecipher('aes-256-cbc', password);
  var a = aes256.update(base58.decode(str));
  var b = aes256.final();
  var buf = new Buffer(a.length + b.length);
  a.copy(buf, 0);
  b.copy(buf, a.length);
  return buf.toString('utf8');
};

module.exports = require('soop')(KeyUtils);
