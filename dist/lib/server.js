"use strict";
/*!
 * server
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
var conf = require("./conf");
var ping = require("./ping");
/**
 * Create a new Apache server.
 * @return {Server}
 * @param {Server~confListener} callback
 */
exports.createServer = function (callback) {
    return new Server(callback);
};
/**
 * Class representing an Apache server.
 * @class
 * */
var Server = /** @class */ (function (_super) {
    __extends(Server, _super);
    /**
     * Callback for new Server().
     * @callback Server~confListener
     * @param {Conf} conf - Apache config object
     */
    /**
     * Create a new Apache server.
     * @param {Server~confListener} callback
     * @constructor
     */
    function Server(callback) {
        var _this = _super.call(this) || this;
        _this.bin = '';
        _this._conf = conf.createConf();
        _this.listening = false;
        _this._starting = false;
        _this._stopping = false;
        _this._process = null;
        if (callback) {
            _this.once('configure', callback);
        }
        return _this;
    }
    /**
     * Callback for apache.listen().
     * @callback Server~callback
     * @param {null|Error} err - Null on success, Error on failure
     */
    /**
     * Start Apache server.
     * @param {number} [port=80]
     * @param {string} [hostname=localhost]
     * @param {Server~callback} [callback]
     */
    Server.prototype.listen = function (port, hostname, callback) {
        var _this = this;
        if (port === void 0) { port = 80; }
        if (hostname === void 0) { hostname = 'localhost'; }
        var self = this;
        var run;
        var autolisten = true; // Add Listen directive
        // Restart if already running
        if (this._starting || this.listening) {
            return this.close(this.listen.bind(this, port, hostname, callback));
        }
        // Set private _starting flag
        this._starting = true;
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
            var abortHandler;
            var listeningHandler;
            var exitHandler;
            var errorHandler;
            var stderr48Handler;
            var removeHandlers;
            var pingUntil;
            args = [];
            /**
             * In order to have a proper callback, we have to know
             * what port to ping, so we might as well add a Listen
             * directive instead of relying on the user to have to
             * edit their httpd.conf. However, IF a mathing Listen
             * directive is in the conf, this causes an error. So
             * we will listen for that error and retry with
             * autolisten false.
             */
            if (autolisten) {
                args.push('-c', '"Listen ' + hostname + ':' + port + '"');
            }
            // These help keep Apache bound to the Node process
            args.push('-X', '-DNO_DETACH');
            args = args.concat(_this._conf.getArguments());
            if (_this.bin) {
                httpdPath = path.join(_this.bin, httpdPath);
            }
            /**
             * We're going to setup all of these listeners
             * in advnace so that they are easy to unstage later.
             */
            /**
             * Handle premature 'error' event from httpd child process
             * @param {Error} err
             * @private
             */
            abortHandler = function (err) {
                // Prevent handlers from firing once the server has aborted
                _this.removeListener('listening', listeningHandler);
                _this._process.stderr.removeListener('data', stderr48Handler);
                // Clear private _starting flag
                _this._starting = false;
            };
            /**
             * Handle 'listening' event
             * @private
             */
            listeningHandler = function () {
                // Prevent abortHandler from firing once the server is listening
                _this._process.removeListener('error', abortHandler);
                _this._process.stderr.removeListener('data', stderr48Handler);
                // Execute 'listening' callback
                if (callback) {
                    callback();
                }
            };
            /**
             * Handle 'exit' event
             * @private
             */
            exitHandler = function (code, signal) {
                // Prevent handler from firing once the server has exited
                _this.removeListener('listening', listeningHandler);
                // Clear status flags
                _this.listening = false;
                _this._starting = false;
                _this._stopping = false;
                // Trigger 'close' event
                _this.emit('close');
            };
            /**
             * Handle 'error' event
             * @private
             */
            errorHandler = function (err) {
                _this.emit('error', err);
            };
            /**
             * This is the error that listens for that
             * duplicate-Listen directive error above (see note
             * with the autolisten conditional). The error
             * in question is '(48)Address already in use...'
             * We'll check for any error that starts with '(48)'.
             * If so, autolisten is set to false, all listeners
             * are cancelled, and we retry.
             */
            /**
             * Handle stderr 'data' event
             * @private
             */
            stderr48Handler = function (data) {
                var err = data.toString();
                // Try again if error starts with '(48)'
                if (autolisten && err.lastIndexOf('(48)', 0) === 0) {
                    // Remove listeners
                    _this.removeListener('listening', listeningHandler);
                    _this._process.removeListener('error', abortHandler);
                    _this._process.removeListener('error', errorHandler);
                    _this._process.removeListener('exit', exitHandler);
                    _this._process.stderr.removeListener('data', stderr48Handler);
                    // Disable autolisten
                    autolisten = false;
                    // Try again on exit
                    _this._process.on('exit', run);
                }
                else {
                    process.stdout.write(err);
                }
            };
            // Assign 'listening' event handler
            _this.once('listening', listeningHandler);
            // Spawn httpd child process
            _this._process = spawn(httpdPath, args, { shell: true });
            // Handle early termination events
            _this._process.once('error', abortHandler);
            // Bubble up 'error' event
            _this._process.on('error', errorHandler);
            // Exit triggers close event
            _this._process.once('exit', exitHandler);
            // Try again on stderr #48
            _this._process.stderr.on('data', stderr48Handler);
            /**
             * Ping until response
             * @private
             */
            (pingUntil = function () {
                // Ping, then keep pinging on error/failure, or trigger start
                ping(port, hostname, function (err, success) {
                    if (_this._starting) {
                        if (err) {
                            _this.emit('error', err);
                        }
                        else if (success) {
                            _this.listening = true;
                            _this._starting = false;
                            _this.emit('listening');
                        }
                        else {
                            pingUntil();
                        }
                    }
                });
            })();
        };
        // First check to see if the requested 
        // address is available
        ping(port, hostname, function (err, success) {
            if (_this._starting) {
                if (err) {
                    _this.emit('error', err);
                }
                else if (!success) {
                    _this._conf.once('finished', run);
                    if (!_this.listenerCount('configure')) {
                        _this.once('configure', function (conf) { return conf.end(); });
                    }
                    _this.emit('configure', _this._conf);
                }
                else {
                    _this.emit('error', 'Address already in use: ' + hostname + ':' + port);
                }
            }
        });
    };
    /**
     * Stop Apache server.
     * @param {Apache~callback} [callback]
     * @return {Server}
     */
    Server.prototype.close = function (callback) {
        var _this = this;
        var starting = this._starting;
        var exitHandler = function (code, signal) {
            if (callback) {
                callback();
            }
        };
        // Close is only valid if httpd child_process is running
        if (this.listening || this._starting) {
            this._stopping = true;
            this._process.once('exit', exitHandler);
            this._process.kill('SIGKILL');
            this._process.once('error', function () {
                // Cancel if kill fails
                _this._stopping = false;
                _this._process.removeListener('exit', exitHandler);
            });
        }
        else if (callback) {
            callback(new Error('Apache is not running.'));
        }
        return this;
    };
    return Server;
}(events.EventEmitter));
exports.Server = Server;
