/*!
 * server
 * Copyright(c) 2018 Matt Scott
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

import events = require('events');
import spawn = require('cross-spawn');
import path = require('path');
import conf = require('./conf');
import ping = require('./ping');

/**
 * Create a new Apache server.
 * @return {Server}
 * @param {Server~confListener} callback
 */

export const createServer = (callback?: (conf: conf.Conf) => void): Server => {
    return new Server(callback);
}

/** 
 * Class representing an Apache server. 
 * @class
 * */
export class Server extends events.EventEmitter {

    bin: string;
    listening: boolean;
    _conf: conf.Conf;
    _starting: boolean;
    _stopping: boolean;
    _process: any;

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

    constructor (callback?: (conf: conf.Conf) => void) {

        super();
        
        this.bin = '';
        this._conf = conf.createConf();
        this.listening = false;

        this._starting = false;
        this._stopping = false;
        this._process = null;

        if(callback) {
            this.once('configure', callback);
        }

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
     * @return {Server}
     */

    listen (port = 80, hostname = 'localhost', callback?: () => void) {
        
        let run: () => void;
        let autolisten = true; // Add Listen directive

        // Restart if already running
        if(this._starting || this.listening) {
            return this.close(this.listen.bind(this, port, hostname, callback));
        }

        // Set private _starting flag
        this._starting = true;
    
        // Set default port and hostname

        if(!port) {
            port = 80;
        }
    
        if(!hostname) {
            hostname = 'localhost';
        }

        /**
         * Run Apache httpd.
         * @private
         */

        run = (): void => {

            let args: string[];
            let httpdPath = 'httpd';
            let abortHandler: (err: Error) => void;
            let listeningHandler: () => void;
            let exitHandler: (code: number, signal: string) => void;
            let errorHandler: (err: Error) => void;
            let stderr48Handler: (data: Buffer|string) => void;
            let removeHandlers: () => void;
            let pingUntil: () => void;
    
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
            if(autolisten) {
                args.push('-c', '"Listen ' + hostname + ':' + port + '"');
            }
            
            // These help keep Apache bound to the Node process
            args.push('-X', '-DNO_DETACH');
            
            args = args.concat(this._conf.getArguments());

            if(this.bin) {
                httpdPath = path.join(this.bin, httpdPath);
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

            abortHandler = (err): void => {
                // Prevent handlers from firing once the server has aborted
                this.removeListener('listening', listeningHandler);
                this._process.stderr.removeListener('data', stderr48Handler);
                // Clear private _starting flag
                this._starting =  false;
            }

            /**
             * Handle 'listening' event
             * @private
             */

            listeningHandler = (): void => {
                // Prevent abortHandler from firing once the server is listening
                this._process.removeListener('error', abortHandler);
                this._process.stderr.removeListener('data', stderr48Handler);
                // Execute 'listening' callback
                if(callback) {
                    callback();
                }
            }

            /**
             * Handle 'exit' event
             * @private
             */
            exitHandler = (code: number, signal: string) => {
                // Prevent handler from firing once the server has exited
                this.removeListener('listening', listeningHandler);
                // Clear status flags
                this.listening = false;
                this._starting = false;
                this._stopping = false;
                // Trigger 'close' event
                this.emit('close');
            }

            /**
             * Handle 'error' event
             * @private
             */
            errorHandler = (err: Error) => {
                this.emit('error', err);
            }

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
            stderr48Handler = (data: Buffer|string) => {
                let err = data.toString();
                // Try again if error starts with '(48)'
                if(autolisten && err.lastIndexOf('(48)', 0) === 0) {
                    // Remove listeners
                    this.removeListener('listening', listeningHandler);
                    this._process.removeListener('error', abortHandler);
                    this._process.removeListener('error', errorHandler);
                    this._process.removeListener('exit', exitHandler);
                    this._process.stderr.removeListener('data', stderr48Handler);
                    // Disable autolisten
                    autolisten = false;
                    // Try again on exit
                    this._process.on('exit', run);
                } else {
                    process.stdout.write(err);
                }
            }

            // Assign 'listening' event handler
            this.once('listening', listeningHandler);

            // Spawn httpd child process
            this._process = spawn(httpdPath, args, {shell: true});

            // Handle early termination events
            this._process.once('error', abortHandler);

            // Bubble up 'error' event
            this._process.on('error', errorHandler);

            // Exit triggers close event
            this._process.once('exit', exitHandler);

            // Try again on stderr #48
            this._process.stderr.on('data', stderr48Handler);

            /**
             * Ping until response
             * @private
             */

            (pingUntil = () => {
                // Ping, then keep pinging on error/failure, or trigger start
                ping(port, hostname, (err, success) => {
                    if(this._starting) {
                        if(err) {
                            this.emit('error', err);
                        } else if(success) {
                            this.listening = true;
                            this._starting = false;
                            this.emit('listening');
                        } else {
                            pingUntil();
                        }
                    }
                });
            })();
        }

        // First check to see if the requested 
        // address is available

        ping(port, hostname, (err, success) => {
            if(this._starting) {
                if(err) {
                    this.emit('error', err);
                } else if(!success) {
                    this._conf.once('finished', run);
                    if(!this.listenerCount('configure')) {
                        this.once('configure', (conf) => conf.end());
                    }
                    this.emit('configure', this._conf);
                } else {
                    this.emit('error', 'Address already in use: ' + hostname + ':' + port)
                }
            }
        });

        return this;
    }

    /**
     * Stop Apache server.
     * @param {Apache~callback} [callback]
     * @return {Server}
     */

    close (callback?: (err?: Error) => void) {
        let starting = this._starting;
        let exitHandler = (code: number, signal: string) => {
            if(callback) {
                callback();
            }
        };
        // Close is only valid if httpd child_process is running
        if(this.listening || this._starting) {
            this._stopping = true;
            this._process.once('exit', exitHandler);
            this._process.kill('SIGKILL');
            this._process.once('error', () => {
                // Cancel if kill fails
                this._stopping = false;
                this._process.removeListener('exit', exitHandler);
            });
        } else if(callback) {
            callback(new Error('Apache is not running.'));
        }
        return this;
    }

}
