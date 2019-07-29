/* 
 * File: AuthenticationService.js (src/services/AuthenticationService.js)
 *
 * Description: 
 */

class AuthenticationService {
    constructor({ jwt }) {
        this.jwt = jwt;
    }

    generateAuthToken(id) {
        // Generate a JSON Web Token for the user.
        return this.jwt.sign({ _id: id.toString() }, process.env.JWT_SECRET);
    }

    verifyAuthToken(token) {
        // Attempt to verify the JSON Web Token for the user.
        return this.jwt.verify(token, process.env.JWT_SECRET);
    }
}

module.exports = AuthenticationService;