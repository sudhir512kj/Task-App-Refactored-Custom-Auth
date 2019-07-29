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

    async hash(plainTextPassword) {
        return this.bcrypt.hash(plainTextPassword, 8);
    }

    async compare(passwordOne, passwordTwo) {
        return this.bcrypt.compare(passwordOne, passwordTwo);
    }
}

module.exports = PasswordService;