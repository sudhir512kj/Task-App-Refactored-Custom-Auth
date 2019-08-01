/*
 * File: config.js (src/config/application/config.js)
 *
 * Description: This file contains all of the application wide configuration, for everything from environment variables to business logic defaults. It'll
 * likely be quite large, and I use the Ice Factory Pattern (which I wouldn't actually call a pattern) to return getters for the config information. This
 * permits us to ensure that the config variables are never accidentally mutated. The Ice Factory "Pattern" employed here, with its getters, ensures that
 * config data is indeed immutable.
 * 
 * For reference, if you are unaware of what the Ice Factory "Pattern" is, it's the same as a normal factory in that it is a function returning an object,
 * it's just that the object is frozen (hence "Ice Factory") with `Object.freeze`.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 10:45 PM (Local), 07/29/2019 at 03:45 AM (Zulu)
 */

/**
 * @description Exposes an interface to access all application configuration, including business logic config and dev/prod config.
 * @returns {*} Frozen API
 */
const applicationConfigurationAPI = Object.freeze({
    server: {
        getPort: () => process.env.PORT
    },
    AWS: {
        getAccessKeyID: () => process.env.AWS_ACCESS_KEY_ID,
        getSecretAccessKey: () => process.env.AWS_SECRET_ACCESS_KEY
    },
    firebase: {
        getFirebaseURL: () => process.env.FIREBASE_URL
    },
    database: {
        url: {
            getDatabaseURL: () => process.env.MONGODB_URL
        }
    },
    cloudStorage: {
        buckets: {
            getMainBucket: () => 'jamie-first-test-bucket'
        },
        avatars: {
            getDefaultAvatarPaths: () => ({ original: 'original', small: 'small', large: 'large' })
        }
    }
});

module.exports = applicationConfigurationAPI;
