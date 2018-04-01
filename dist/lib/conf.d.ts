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
 * @param {Conf~finishedListener} callback
 * @public
 */
export declare const createConf: (callback?: (() => void) | undefined) => Conf;
/**
 * Class representing an Apache config.
 * @class
 * */
export declare class Conf extends events.EventEmitter {
    private _arguments;
    private _beforeConf;
    private _directives;
    path: undefined | boolean | string | null;
    finished: boolean;
    /**
     * Callback for conf.end().
     * @callback Conf~finishedListener
     */
    /**
     * Create a new Apache config.
     * @param {Conf~finishedListener} callback
     * @constructor
     */
    constructor(callback?: () => void);
    /**
    * Add a startup argument.
    * @param {string} arg
    * @param {string} [val]
    */
    addArgument(arg: string, val?: string): this;
    /**
    * Alias for getArguments() - To be deprecated in v1.x
    * @public
    */
    toArray(): string[];
    /**
    * Get startup arguments.
    * @public
    */
    getArguments(): string[];
    /**
     * Add a directive to load before main config file (-C flag) - To be deprecated in v1.x
     * @param {string} directive
     * @public
     */
    beforeConf: (directive: string) => Conf;
    /**
    * Alias for addDirective() - To be deprecated in v1.x
    * @public
    */
    afterConf: (directive: string) => Conf;
    /**
    * Add a directive to load after main config file (-c flag).
    * @param {string} directive
    * @public
    */
    addDirective: (directive: string) => Conf;
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
