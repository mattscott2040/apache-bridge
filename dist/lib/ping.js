"use strict";
/*!
 * apache
 * Copyright(c) 2018 Matt Scott
 * MIT Licensed
 */
var http = require("http");
var ping = function (port, hostname, callback) {
    http.request({
        method: 'HEAD',
        hostname: hostname,
        port: port
    }, function (res) {
        var statusCodeType;
        // If statusCode is defined
        if (res.statusCode) {
            // Get first digit from statusCode
            statusCodeType = Number(res.statusCode.toString()[0]);
            // If digit is 2-5, then return success
            if ([2, 3, 4, 5].indexOf(statusCodeType) !== -1) {
                return callback(null, true);
            }
        }
        // Return failure if empty or invalid statusCode
        callback(null, false);
    }).on('error', function (err) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
            // Return failure if ECONNREFUSED
            callback(null, false);
        }
        else {
            // Return error
            callback(err);
        }
    }).end();
};
module.exports = ping;
