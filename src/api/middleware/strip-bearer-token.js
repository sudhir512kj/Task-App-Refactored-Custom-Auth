/*
 * File: strip-bearer-token.js (src/api/middleware/strip-bearer-token.js)
 *
 * Description: Strips the bearer token off the header of the request and puts it on req.locals.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 04:48 PM (Local), 09:48 PM (Zulu)
 */

const stripBearerToken = (req, res, next) => {
    try {
        // Strip off the Bearer Token
        req.token = req.header('Authorization').replace('Bearer ', '');
        next();
    } catch (e) {
        // We are not concerned with the implications of having no token here. (That'll be handled by other middleware).
        req.token = '';
        next();
    }
};

module.exports = stripBearerToken;