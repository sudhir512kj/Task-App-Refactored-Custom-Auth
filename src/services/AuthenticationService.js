/* 
 * File: AuthenticationService.js (src/services/AuthenticationService.js)
 *
 * Description: Handles authentication token related operations for the user, namely, JSON Web Token signing and verification.
 */

/**
 * @description Handles authentication token related operations for the user, namely, JSON Web Token signing and verification.
 *
 * @class AuthenticationService
 */
class AuthenticationService {
    constructor({ jwt }) {
        this.jwt = jwt;
    }

    /**
     * @description Generates a JSON Web Token.
     *
     * @param   {String} id The ID with which to populate the token payload. See https://jwt.io/ for more information about JWTs.
     * @returns {String} The signed token.
     * @memberof AuthenticationService
     */
    generateAuthToken(id) {
        // Generate a JSON Web Token for the user.
        return this.jwt.sign({ _id: id.toString() }, process.env.JWT_SECRET);
    }

    /**
     * @description Verifies a JSON Web Token.
     *
     * @param    {String} token The token to verify.
     * @returns  {Object} The decoded payload object.
     * @memberof AuthenticationService
     */
    verifyAuthToken(token) {
        // Attempt to verify the JSON Web Token for the user.
        return this.jwt.verify(token, process.env.JWT_SECRET);
    }
}

module.exports = AuthenticationService;