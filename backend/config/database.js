// Path: backend/config/database.js

const { MONGO_CONFIG } = require('./constants');

const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tlsAllowInvalidCertificates: true,
  retryWrites: false
};

module.exports = mongoConfig;