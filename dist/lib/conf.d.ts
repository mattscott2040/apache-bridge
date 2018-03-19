/// <reference types="node" />
/*!
 * conf
 * Copyright(c) 2018 Matt Scott
 * MIT Licensed
 */
/**
 * Module dependencies.
 * @private
 */
import events = require('events');
/**
 * Create a new Apache config.
 * @return {Conf}
 * @public
 */
export declare const createConf: () => Conf;
/**
 * Class representing an Apache config.
 * @class
 * */
export declare class Conf extends events.EventEmitter {
    private _arguments;
    file: boolean | string;
    finished: boolean;
    /**
     * Callback for new Httpd().
     * @callback Conf~confListener
     */
    /**
     * Create a new Apache config.
     * @param {Conf~confListener} confListener
     * @constructor
     */
    constructor(confListener?: () => void);
    /**
    * Add a startup argument.
    * @param {string} flag
    * @param {string} [argument]
    * @private
    */
    _addArgument(flag: string, arg?: string): this;
    /**
    * Get startup arguments.
    * @public
    */
    toArray(): string[];
    /**
    * Add a directive to load before main config file (-C flag).
    * @param {string} directive
    * @public
    */
    beforeConf: (directive: string) => Conf;
    /**
    * Add a directive to load after main config file (-c flag).
    * @param {string} directive
    * @public
    */
    afterConf: (directive: string) => Conf;
    /**
    * Define a parameter (-D flag).
    * @param {string} parameter
    * @public
    */
    define: (parameter: string) => Conf;
    /**
    * Include a file (after main config).
    * @param {string} file
    * @public
    */
    include: (file: string) => Conf;
    /**
    * Load a module (after main config).
    * @param {string} module
    * @param {string} file
    * @public
    */
    loadModule: (module: string, file: string) => Conf;
    /**
    * Stop configuring (and optionally append a directive).
    * @param {string} [directive]
    * @public
    */
    end: (directive?: string | undefined) => void;
}
