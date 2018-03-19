/// <reference types="node" />
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
import config = require('./conf');
/**
 * Create a new Apache server.
 * @return {class}
 * @public
 */
export declare let createServer: () => Apache;
/**
 * Class representing an Apache server.
 * @class
 * */
export declare class Apache extends events.EventEmitter {
    bin: string;
    status: null | string;
    timeout: number;
    /**
     * Create a new Apache server.
     * @constructor
     */
    constructor(onConfigure?: (conf: config.ApacheConf) => void);
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
    start(port?: number, hostname?: string, callback?: (err: null | Error) => void): void;
    /**
    * Stop Apache server.
    * @param {Apache~callback} [callback]
    * @public
    */
    stop(callback?: (err: null | Error, msg?: string) => void): void;
}
