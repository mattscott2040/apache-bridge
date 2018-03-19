"use strict";
/*!
 * apache
 * Copyright(c) 2018 Matt Scott
 * MIT Licensed
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies.
 * @private
 */
var events = require("events");
var spawn = require("cross-spawn");
var path = require("path");
var config = require("./conf");
var ping = require("./ping");
/**
 * Create a new Apache server.
 * @return {class}
 * @public
 */
exports.createServer = function () {
    return new Apache();
};
/**
 * Class representing an Apache server.
 * @class
 * */
var Apache = /** @class */ (function (_super) {
    __extends(Apache, _super);
    /**
     * Create a new Apache server.
     * @constructor
     */
    function Apache(onConfigure) {
        var _this = _super.call(this) || this;
        _this.bin = '';
        _this.status = null;
        _this.timeout = 30000;
        if (onConfigure) {
            _this.on('configure', onConfigure);
        }
        return _this;
    }
    /**
     * Callback for Apache.start().
     * @callback Apache~callback
     * @param {null|Error} err - Null on success, Error on failure
     */
    /**
    * Start Apache server.
    * @param {number} [port=80]
    * @param {string} [hostname=localhost]
    * @param {Apache~callback} [callback]
    * @public
    */
    Apache.prototype.start = function (port, hostname, callback) {
        var _this = this;
        if (port === void 0) { port = 80; }
        if (hostname === void 0) { hostname = 'localhost'; }
        var self = this;
        var conf = config.createConf();
        var run;
        // Restart if already running
        if (this.status === 'STARTING' || this.status === 'LISTENING') {
            return this.stop(this.start.bind(this, port, hostname, callback));
        }
        // Set status
        this.status = 'STARTING';
        this.emit('starting');
        // Set default port and hostname
        if (!port) {
            port = 80;
        }
        if (!hostname) {
            hostname = 'localhost';
        }
        /**
         * Run Apache httpd.
         * @private
         */
        run = function () {
            var args;
            var httpdPath = 'httpd';
            var maybeAbort;
            var httpd;
            var interval = 500;
            var tries = 0;
            var pingUntil;
            args = ['-X', '-C', 'Listen ' + hostname + ':' + port];
            args.concat(conf.getArguments());
            if (_this.bin) {
                httpdPath = path.join(_this.bin, httpdPath);
            }
            // Setup main listeners...
            /**
             * Abort Apache.start(). Called on httpd child_process error and timeout.
             * @param {Error} err - Error from httpd child_process/timeout.
             * @private
             */
            maybeAbort = function (err) {
                if (_this.status === 'STARTING') {
                    _this.status = 'FINISHED';
                    _this.emit('abort', err);
                }
            };
            // Error event bubbles up from httpd child_process or passed from pingUntil() timeout.
            _this.once('error', maybeAbort);
            if (callback) {
                _this.on('abort', callback); // Send error to callback
                _this.on('start', callback); // Send success to callback
            }
            // Kill httpd on abort
            _this.on('abort', function () { return httpd.kill('SIGKILL'); });
            // Main listeners ready. Call httpd...
            httpd = spawn(httpdPath, args, { stdio: 'inherit' });
            // Setup httpd child_process listeners...
            // Error bubbles up
            httpd.on('error', function (err) { return _this.emit('error', err); });
            // Stop kills httpd
            _this.on('stop', function () {
                if (_this.status === 'STOPPING') {
                    httpd.kill('SIGKILL');
                }
            });
            // Exit triggers stop if not already stopping
            httpd.on('exit', function (code, signal) {
                _this.status = 'FINISHED';
                _this.emit('exit', code, signal);
            });
            // Catch SIGINT (CTRL+C)
            process.once('SIGINT', function () {
                process.emit('SIGINT');
                process.exit(0);
            });
            /**
             * Ping until response or timeout
             * @private
             */
            (pingUntil = function () {
                setTimeout(function () {
                    // If no timeout or time so far is less than timeout
                    if (!_this.timeout || ++tries * interval < _this.timeout) {
                        // Ping, then keep pinging on error/failure, or trigger start
                        ping(port, hostname, function (err, success) {
                            if (_this.status === 'STARTING') {
                                if (success) {
                                    _this.status = 'LISTENING';
                                    _this.emit('start');
                                }
                                else {
                                    pingUntil();
                                }
                            }
                        });
                        // if timeout then maybe abort
                    }
                    else {
                        maybeAbort(new Error('Apache timed out after ' + tries + ' tries.'));
                    }
                }, interval);
            })();
        };
        conf.on('finish', run);
        ping(port, hostname, function (err, success) {
            // Error should be ECONNREFUSED if hostname/port is not taken
            if (err && err.code !== 'ECONNREFUSED') {
                // Return error if not
                if (callback) {
                    callback(err);
                }
                // No error or error is ECONNREFUSED, AND no successful ping
            }
            else if (!success) {
                // Yay! We can proceed!
                if (!_this.listenerCount('configure')) {
                    _this.on('configure', function (conf) { return conf.end(); });
                }
                _this.emit('configure', conf);
                // Successful ping
            }
            else if (callback) {
                // Success = bad! Hostname:port is taken!
                callback(new Error(hostname + ':' + port + ' is not available.'));
            }
        });
    };
    /**
    * Stop Apache server.
    * @param {Apache~callback} [callback]
    * @public
    */
    Apache.prototype.stop = function (callback) {
        // Stop is only valid if httpd child_process is running
        if (this.status === 'STARTING' || this.status === 'LISTENING') {
            // Listen for stop (bubbles up from httpd chid_process exit)
            this.status = 'STOPPING';
            if (callback) {
                this.once('exit', callback.bind(null));
            }
            // Send kill signal to httpd child_process
            this.emit('stop');
        }
        else if (callback) {
            // Apache is not running - abort stop
            callback(new Error('Apache is not running.'));
        }
    };
    return Apache;
}(events.EventEmitter));
exports.Apache = Apache;
