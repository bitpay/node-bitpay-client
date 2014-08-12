module.exports = {
  "apiHost": process.env.BITPAY_API_HOST || "test.bitpay.com",
  "apiPort": process.env.BITPAY_API_PORT || 443,
  "forceSSL": process.env.BITPAY_ENFORCE_SSL || true,
  "keyPassword": process.env.BITPAY_KEY_PASSWORD || "",
  "configDir": process.env.BITPAY_CONFIG_DIR || process.env['HOME'] + "/.bitpay",
}
