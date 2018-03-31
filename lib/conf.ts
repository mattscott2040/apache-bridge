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
import os = require('os');
import tmp = require('tmp');
import fs = require('fs');

'use strict';

/**
 * Create a new Apache config.
 * @return {Conf}
 * @param {Conf~confListener} callback
 * @public
 */

export const createConf = (callback?: () => void): Conf => {
    return new Conf(callback);
}

/** 
 * Class representing an Apache config. 
 * @class
 * */
export class Conf extends events.EventEmitter {

    private _arguments: Array<string>;
    private _beforeConf: null|fs.WriteStream;
    private _afterConf: null|fs.WriteStream;

    file: undefined|boolean|string|null;
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
        this._beforeConf = null;
        this._afterConf = null;
        this.file;
        this.finished = false;

        if(confListener) {
            this.on('finish', confListener);
        }

    }

     /**
     * Add a startup argument.
     * @param {string} flag
     * @param {string} [arg]
     */

    addArgument (flag: string, arg?: string) {

        const allowedFlags = ['-d','-f','-C','-c','-D','-e','-E','-T','-X','-k','-n','-w'];
        let sanitizedArg;

        if(arg) {
            sanitizedArg = capitalize(arg.replace(/^-*(.*)$/, "$1").replace(/\"/g, '\\"'));
        }
    
        if(this.finished) {
            let msg = 'Could not add argument `' + flag;
            if(sanitizedArg) {
                msg += ' ' + sanitizedArg;
            }
            msg += '`: Configuration cannot be edited after conf.end() has been called.';
            throw new Error(msg);
        }

        if(allowedFlags.indexOf(flag) === -1) {
            return this;
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
            this._arguments.push('"' + sanitizedArg + '"');
        }
    
        return this;
    
    }
    
     /**
     * Alias for getArguments() - To be deprecated in v1.x
     * @public
     */

    toArray () {
        return this.getArguments();
    }

     /**
     * Get startup arguments.
     * @public
     */

    getArguments () {
        let args = this._arguments;
        if(this.file === false) {
            args.push('-f', path.join(__dirname, '../..', 'conf', 'blank.conf'));
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
        if(this.finished) {
            throw new Error('Could not add directive `' + directive + '`: Configuration cannot be edited after conf.end() has been called.');
        }
        if(directive) {
            if(!this._beforeConf) {
                let file = tmp.fileSync().name;
                this._beforeConf = fs.createWriteStream(file);
                this.addArgument('-C', 'Include ' + file)
                    .on('finished', this._beforeConf.close);
            }
            this._beforeConf.write(directive + os.EOL);
        }
        return this;
    }

     /**
     * Add a directive to load after main config file (-c flag).
     * @param {string} directive
     * @public
     */

    afterConf = (directive: string): Conf => {
        if(this.finished) {
            throw new Error('Could not add directive `' + directive + '`: Configuration cannot be edited after conf.end() has been called.');
        }
        if(directive) {
            if(!this._afterConf) {
                let file = tmp.fileSync().name;
                this._afterConf = fs.createWriteStream(file);
                this.include(file)
                    .on('finished', this._afterConf.close);
            }
            this._afterConf.write(directive + os.EOL);
        }
        return this;
    }

     /**
     * Define a parameter (-D flag).
     * @param {string} parameter
     * @public
     */

    define = (parameter: string): Conf => {
        return this.addArgument('-D', parameter);
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
        if(directive) {
            this.afterConf(directive);
        }
        if(this.finished) {
            return;
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
