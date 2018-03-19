/*!
 * apache
 * Copyright(c) 2018 Matt Scott
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

import events = require('events');
import http = require('http');

/**
 * Callback for ping().
 * @callback pingCallback
 * @param {null|Error} err - Null on no error
 * @param {boolean} success - Just because no error doesn't mean successful.
 */

/**
 * Ping hostname/port.
 * @param {number} port
 * @param {string} hostname
 * @param {pingCallback} callback
 * @param {boolean} [until] - Repeat until success (true) or failure (false)
 * @param {number} [timeout] - How long to repeat

 * @public
 */

export {};

let ping = (port: number, hostname: string, callback: (err: any, success?: boolean) => void) => {

    http.request({
        method: 'HEAD',
        hostname: hostname,
        port: port
    }, (res) => {
        let statusCodeType: number;
        // If statusCode is defined
        if(res.statusCode) {
            // Get first digit from statusCode
            statusCodeType = Number(res.statusCode.toString()[0]);
            // If digit is 2-5, then return success
            if ([2, 3, 4, 5].indexOf(statusCodeType) !== -1) {
                return callback(null, true);
            }
        }
        // Return failure if empty or invalid statusCode
        callback(null, false);
    }).on('error', (err: any) => {
        if(err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
            // Return failure if ECONNREFUSED
            callback(null, false);
        } else {
            // Return error
            callback(err);
        }
    }).end();

}

export = ping;