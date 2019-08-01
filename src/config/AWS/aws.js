/*
 * File: aws.js (src/config/AWS/aws.js)
 *
 * Description: Handles the AWS Configuration Process.
 * 
 * Created by Jamie Corkhill on 06/30/2019 at 05:12 PM (Local), 10:12 PM (Zulu)
 */

// The AWS SDK
const aws = require('aws-sdk');

// Application config
const applicationConfig = require('./../../config/application/config');

aws.config.update({
    accessKeyId: applicationConfig.AWS.getAccessKeyID(),
    secretAccessKey: applicationConfig.AWS.getSecretAccessKey()
});

module.exports = aws;