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
    private _includes;
    file: undefined | boolean | string | null;
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
     * Alias for addArgument() - To be deprecated in v1.x
     * @param {string} arg
     * @param {string} [val]
     * @return {Conf}
     */
    addArgument(arg: string, val?: string): Conf;
    /**
     * Add a startup argument.
     * @param {string} arg
     * @param {string} [val]
     * @return {Conf}
     * @private
     */
    _addArgument(arg: string, val?: string): Conf;
    /**
     * Alias for getArguments() - To be deprecated in v1.x
     * @return {Conf}
     * @return {array}
     */
    toArray(): string[];
    /**
     * Get startup arguments.
     * @return {array}
     */
    getArguments(): string[];
    /**
     * Alias for prependDirective() - To be deprecated in v1.x
     * @param {string} directive
     * @return {Conf}
     */
    beforeConf: (directive: string) => Conf;
    /**
     * Add a directive to load before main config file (-C flag)
     * @param {string} directive
     * @return {Conf}
     */
    prependDirective: (directive: string) => Conf;
    /**
     * Alias for addDirective() - To be deprecated in v1.x
     * @param {string} directive
     * @return {Conf}
     */
    afterConf: (directive: string) => Conf;
    /**
     * Add a directive to load after main config file (-c flag).
     * @param {string} directive
     * @return {Conf}
     */
    addDirective: (directive: string) => Conf;
    /**
     * Define a parameter (-D flag).
     * @param {string} parameter
     * @return {Conf}
     */
    define: (parameter: string) => Conf;
    /**
     * Include a file (after main config).
     * @param {string} file
     * @return {Conf}
     */
    include: (file: string) => Conf;
    /**
     * Load a module (after main config).
     * @param {string} module
     * @param {string} file
     * @return {Conf}
     */
    loadModule: (module: string, file?: string | undefined) => Conf;
    /**
     * Stop configuring (and optionally append a directive).
     * @param {string} [directive]
     */
    end: (directive?: string | undefined) => void;
}
