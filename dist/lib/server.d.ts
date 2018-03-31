/// <reference types="node" />
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
import conf = require('./conf');
/**
 * Create a new Apache server.
 * @return {Server}
 * @param {Server~confListener} callback
 * @public
 */
export declare const createServer: (callback?: ((conf: conf.Conf) => void) | undefined) => Server;
/**
 * Class representing an Apache server.
 * @class
 * */
export declare class Server extends events.EventEmitter {
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
    constructor(callback?: (conf: conf.Conf) => void);
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
    * @public
    */
    listen(port?: number, hostname?: string, callback?: () => void): this | undefined;
    /**
    * Stop Apache server.
    * @param {Apache~callback} [callback]
    * @return {Server}
    * @public
    */
    close(callback?: (err?: Error) => void): this;
}
