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
 * @param {Conf~finishedListener} callback
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
    private _includes: {
        C: null|fs.WriteStream,
        c: null|fs.WriteStream
    };

    file: undefined|boolean|string|null;
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

    constructor (callback?: () => void) {

        super();
        this._arguments = [];
        this._includes = {
            C: null,
            c: null
        };
        this.file;
        this.finished = false;

        if(callback) {
            this.on('finished', callback);
        }

    }

    /**
     * Alias for addArgument() - To be deprecated in v1.x
     * @param {string} arg
     * @param {string} [val]
     * @return {Conf}
     */

    addArgument (arg: string, val?: string) {
        return this._addArgument(arg, val);
    }

    /**
     * Add a startup argument.
     * @param {string} arg
     * @param {string} [val]
     * @return {Conf}
     * @private
     */

    _addArgument (arg: string, val?: string) {

        if(arg === '-c') {
            if(val) {
                return this.addDirective(val);
            } else {
                return this;
            }
        }

        if(arg === '-C') {
            if(val) {
                return this.prependDirective(val);
            } else {
                return this;
            }
        }

        const allowedArgs = ['-d','-f','-D','-e','-E','-T','-X','-k','-n','-w'];
        let sanitizedVal;

        if(val) {
            sanitizedVal = capitalize(val.replace(/^-*(.*)$/, "$1").replace(/\"/g, '\\"'));
        }
    
        if(this.finished) {
            let msg = 'Could not add argument `' + arg;
            if(sanitizedVal) {
                msg += ' ' + sanitizedVal;
            }
            msg += '`: Configuration cannot be edited after conf.end() has been called.';
            throw new Error(msg);
        }

        if(allowedArgs.indexOf(arg) === -1) {
            return this;
        }
        
        if(arg !== 'T' && arg !== 'w' && !sanitizedVal) {
            if(val) {
                throw new Error('The argument `' + arg + '` requires an argument, but `' + val + '` is invalid.');
            } else {
                throw new Error('The argument `' + arg + '` requires an argument, but none was given.');
            }
        }
    
        this._arguments.push(arg);
    
        if(sanitizedVal) {
            this._arguments.push('"' + sanitizedVal + '"');
        }
    
        return this;
    
    }
    
    /**
     * Alias for getArguments() - To be deprecated in v1.x
     * @return {Conf}
     * @return {array}
     */

    toArray () {
        return this.getArguments();
    }

    /**
     * Get startup arguments.
     * @return {array}
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
     * Alias for prependDirective() - To be deprecated in v1.x
     * @param {string} directive
     * @return {Conf}
     */

    beforeConf = (directive: string): Conf => {
        return this.prependDirective(directive);
    }

    /**
     * Add a directive to load before main config file (-C flag)
     * @param {string} directive
     * @return {Conf}
     */

    prependDirective = (directive: string): Conf => {
        if(this.finished) {
            throw new Error('Could not add directive `' + directive + '`: Configuration cannot be edited after conf.end() has been called.');
        }
        if(directive) {
            if(!this._includes.C) {
                let file = tmp.fileSync().name;
                this._includes.C = fs.createWriteStream(file);
                this._arguments.push('-C', '"Include \\"' + file + '\\""');
                this.on('finished', () => {
                    if(this._includes.C) {
                        this._includes.C.close;
                    }
                });
            }
            this._includes.C.write(directive + os.EOL);
        }
        return this;
    }

    /**
     * Alias for addDirective() - To be deprecated in v1.x
     * @param {string} directive
     * @return {Conf}
     */

    afterConf = (directive: string): Conf => {
        return this.addDirective(directive);
    }

    /**
     * Add a directive to load after main config file (-c flag).
     * @param {string} directive
     * @return {Conf}
     */

    addDirective = (directive: string): Conf => {
        if(this.finished) {
            throw new Error('Could not add directive `' + directive + '`: Configuration cannot be edited after conf.end() has been called.');
        }
        if(directive) {
            if(!this._includes.c) {
                let file = tmp.fileSync().name;
                this._includes.c = fs.createWriteStream(file);
                this._arguments.push('-c', '"Include \\"' + file + '\\""');
                this.on('finished', () => {
                    if(this._includes.c) {
                        this._includes.c.close;
                        }
                    });
            }
            this._includes.c.write(directive + os.EOL);
        }
        return this;
    }

    /**
     * Define a parameter (-D flag).
     * @param {string} parameter
     * @return {Conf}
     */

    define = (parameter: string): Conf => {
        return this.addArgument('-D', parameter);
    }

    /**
     * Include a file (after main config).
     * @param {string} file
     * @return {Conf}
     */

    include = (file: string): Conf => {
        return this.addDirective('Include "' + path.resolve(file) + '"');
    }

    /**
     * Load a module (after main config).
     * @param {string} module
     * @param {string} file
     * @return {Conf}
     */

    loadModule = (module: string, file?: string): Conf => {
        if(!module) {
            return this;
        }
        if(!file) {
            file = module.replace(/^(.*)_module$/, 'modules/mod_$1.so');
        }
        return this
            .addDirective('<IfModule !' + module + '>')
            .addDirective('LoadModule ' + module + ' "' + file + '"')
            .addDirective('</IfModule>')
    }

    /**
     * Stop configuring (and optionally append a directive).
     * @param {string} [directive]
     */

    end = (directive?: string) => {
        if(directive) {
            this.addDirective(directive);
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
 * @return {string}
 */

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
