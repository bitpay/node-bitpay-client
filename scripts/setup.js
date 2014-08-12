var fs       = require('fs');
var conf     = require(__dirname + '/../config');

var isWin    = process.env.platform === 'win32';
var HOME     = process.env[isWin ? 'USERPROFILE' : 'HOME'];
var confPath = conf.configDir;

// check if we have a ~/.bitpay directory
if (!fs.existsSync(confPath)) {
  console.log('Creating config directory at ' + confPath + '...');
  fs.mkdirSync(confPath);
}
else {
  console.log('Config directory already exists at ' + confPath);
}

if (!fs.existsSync(confPath + '/config.json')) {
  console.log('Creating config file...');
  fs.writeFileSync(confPath + '/config.json', JSON.stringify(conf, null, 2));
}
else {
  console.log('Config file already exists at ' + confPath + '/config.json');
}
