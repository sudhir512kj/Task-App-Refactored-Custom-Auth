const handleErrors = require('./handle-errors');
const stripBearerToken = require('./strip-bearer-token');
const verifyAuth = require('./verify-auth');

module.exports = {
    handleErrors,
    stripBearerToken,
    verifyAuth
};