/*!
 * conf
 * Copyright(c) 2018 Matt Scott
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

import events = require('events');
import path = require('path');
import ping = require('./ping');

'use strict';

/**
 * Create a new Apache config.
 * @return {Conf}
 * @public
 */

export const createConf = (): Conf => {
    return new Conf();
}

/** 
 * Class representing an Apache config. 
 * @class
 * */
export class Conf extends events.EventEmitter {

    private _arguments: Array<string>;

    file: boolean|string;
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

    constructor (confListener?: () => void) {

        super();
        this._arguments = [];
        this.file = true;
        this.finished = false;

        if(confListener) {
            this.on('finish', confListener);
        }

    }

     /**
     * Add a startup argument.
     * @param {string} flag
     * @param {string} [argument]
     * @private
     */

    _addArgument (flag: string, arg?: string) {

        const allowedFlags = ['-d','-f','-C','-c','-D','-e','-E','-T','-X','-k','-n','-w'];
        let sanitizedArg;

        if(this.finished) {
            return this;
        }
    
        if(allowedFlags.indexOf(flag) === -1) {
            return this;
        }
        
        if(arg) {
            sanitizedArg = capitalize(arg.replace(/^-*(.*)$/, "$1"));
        }
    
        if(flag !== 'T' && flag !== 'w' && !sanitizedArg) {
            if(arg) {
                throw new Error('The flag `' + flag + '` requires an argument, but `' + arg + '` is invalid.');
            } else {
                throw new Error('The flag `' + flag + '` requires an argument, but none was given.');
            }
        }
    
        this._arguments.push(flag);
    
        if(sanitizedArg) {
            this._arguments.push(sanitizedArg);
        }
    
        return this;
    
    }
    
     /**
     * Get startup arguments.
     * @public
     */

    toArray () {
        let args = this._arguments;
        if(!this.file) {
            args.push('-f', path.resolve('conf/blank.conf'));
        } else if(typeof this.file === 'string') {
            args.push('-f', path.resolve(this.file));
        }
        return args;
    }
    
     /**
     * Add a directive to load before main config file (-C flag).
     * @param {string} directive
     * @public
     */

    beforeConf = (directive: string): Conf => {
        return this._addArgument('-C', directive);
    }

     /**
     * Add a directive to load after main config file (-c flag).
     * @param {string} directive
     * @public
     */

    afterConf = (directive: string): Conf => {
        return this._addArgument('-c', directive);
    }

     /**
     * Define a parameter (-D flag).
     * @param {string} parameter
     * @public
     */

    define = (parameter: string): Conf => {
        return this._addArgument('-D', parameter);
    }

     /**
     * Include a file (after main config).
     * @param {string} file
     * @public
     */

    include = (file: string): Conf => {
        return this.afterConf('Include "' + path.resolve(file) + '"');
    }

     /**
     * Load a module (after main config).
     * @param {string} module
     * @param {string} file
     * @public
     */

    loadModule = (module: string, file: string): Conf => {
        return this
            .afterConf('<IfModule !' + module + '>')
            .afterConf('LoadModule ' + module + ' "' + file + '"')
            .afterConf('</IfModule>')
    }

     /**
     * Stop configuring (and optionally append a directive).
     * @param {string} [directive]
     * @public
     */

    end = (directive?: string) => {
        if(this.finished) {
            return;
        }
        if(directive) {
            this.afterConf(directive);
        }
        this.finished = true;
        this.emit('finished');
    }

}

/**
 * Capitalize a string.
 * @param {string} str
 * @public
 */

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
