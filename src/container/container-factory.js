/*
 * File: container.js (src/container/container.js)
 *
 * Description: This file auto-loads modules/classes/services/helpers/controllers/etc. into the Awilix Dependency Injection Container/Injected Service Locator.
 * 
 * Created by Jamie Corkhill on 06/17/2019 at 10:22 PM (Local), 06/18/2019 at 03:22 AM (Zulu)
 */

const awilix = require('awilix');

// Third-party NPM Modules
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Third-party pre-configured SDKs:
const aws = require('./../config/AWS/aws');

// Configuration
const appConfig = require('./../config/application/config');

// Default Factory Function
module.exports = () => {
    // Create the DI Container.
    const container = awilix.createContainer({
        injectionMode: awilix.InjectionMode.PROXY
    });

    // Load modules for Adapters, Repositories, and Services.
    container.loadModules([
        [
            '../adapters/**/*.js',
            {
                register: awilix.asClass,
                lifetime: awilix.Lifetime.SINGLETON,
            }
        ],
        [
            '../repositories/**/*.js',
            {
                register: awilix.asClass,
                lifetime: awilix.Lifetime.SCOPED
            }
        ],
        [
            '../services/**/*.js',
            {
                register: awilix.asClass,
                lifetime: awilix.Lifetime.SCOPED
            }
        ],
    ], {
            cwd: __dirname,
            formatName: 'camelCase'
    });

    // Load modules for Models.
    container.loadModules([
        [
            '../models/**/*.js', 
            {
                register: awilix.asValue,
                lifetime: awilix.Lifetime.TRANSIENT
            }
        ],
    ], {
            cwd: __dirname,
            formatName: name => `${name.charAt(0).toUpperCase()}${name.substring(1)}`
    });

    
    container.register({
        // Register third-party NPM Modules.
        sharp: awilix.asValue(sharp),
        aws: awilix.asValue(aws),
        jwt: awilix.asValue(jwt),
        bcrypt: awilix.asValue(bcrypt),
        appConfig: awilix.asValue(appConfig)
    });

    // User context
    container.register('context', awilix.asFunction(() => ({ user: null })).scoped());

    return container;
};