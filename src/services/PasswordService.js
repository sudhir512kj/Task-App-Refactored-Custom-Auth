/*
 * File: PasswordService (src/services/PasswordService.js)
 *
 * Description: Houses functions having to do with user passwords, such as hashing and comparing hashes.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 06:28 PM (Local), 11:28 PM (Zulu)
 */

class PasswordService {
    constructor({ bcrypt }) {
        // Dependency Injection
        this.bcrypt = bcrypt;
    }

    /**
     * @description The plaintext password to be hashed.
     *
     * @param    {String} plainTextPassword The original unsafe plain-text password.
     * @param    {Number} [saltRounds=8]    The salting rounds (default 8)
     * @returns  {String} The computed hash.
     * @memberof PasswordService
     */
    async hash(plainTextPassword, saltRounds = 8) {
        return this.bcrypt.hash(plainTextPassword, 8);
    }

    /**
     * @description Compare a plainText password with a hashed password to check for a match.
     *
     * @param    {String} plainText The plaintext password.
     * @param    {String} hashed    The hashed password.
     * @returns  The match result.
     * @memberof PasswordService
     */
    async compare(plainText, hashed) {
        // Return without await as to not wrap in an unnecessary promise since async functions return a promise by default. This will resolve with the
        // match or reject with an error.
        return this.bcrypt.compare(plainText, hashed);
    }
}

module.exports = PasswordService;