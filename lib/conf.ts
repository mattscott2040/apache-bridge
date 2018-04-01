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
    private _beforeConf: null|fs.WriteStream; // To be deprecated in v1.x
    private _directives: null|fs.WriteStream;

    path: undefined|boolean|string|null;
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
        this._beforeConf = null; // To be deprecated in v1.x
        this._directives = null;
        this.path;
        this.finished = false;

        if(callback) {
            this.on('finished', callback);
        }

    }

     /**
     * Add a startup argument.
     * @param {string} arg
     * @param {string} [val]
     */

    addArgument (arg: string, val?: string) {

        const allowedArgs = ['-d','-f','-C','-c','-D','-e','-E','-T','-X','-k','-n','-w'];
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
        if(this.path === false) {
            args.push('-f', path.join(__dirname, '../..', 'conf', 'blank.conf'));
        } else if(typeof this.path === 'string') {
            args.push('-f', path.resolve(this.path));
        }
        return args;
    }
    
    /**
     * Add a directive to load before main config file (-C flag) - To be deprecated in v1.x
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
     * Alias for addDirective() - To be deprecated in v1.x
     * @public
     */

    afterConf = (directive: string): Conf => {
        return this.addDirective(directive);
    }

     /**
     * Add a directive to load after main config file (-c flag).
     * @param {string} directive
     * @public
     */

    addDirective = (directive: string): Conf => {
        if(this.finished) {
            throw new Error('Could not add directive `' + directive + '`: Configuration cannot be edited after conf.end() has been called.');
        }
        if(directive) {
            if(!this._directives) {
                let file = tmp.fileSync().name;
                this._directives = fs.createWriteStream(file);
                this.addArgument('-c', 'Include "' + path.resolve(file) + '"')
                    .on('finished', () => {
                        if(this._directives) {
                            this._directives.close;
                        }
                    });
            }
            this._directives.write(directive + os.EOL);
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
        return this.addDirective('Include "' + path.resolve(file) + '"');
    }

     /**
     * Load a module (after main config).
     * @param {string} module
     * @param {string} file
     * @public
     */

    loadModule = (module: string, file: string): Conf => {
        return this
            .addDirective('<IfModule !' + module + '>')
            .addDirective('LoadModule ' + module + ' "' + file + '"')
            .addDirective('</IfModule>')
    }

     /**
     * Stop configuring (and optionally append a directive).
     * @param {string} [directive]
     * @public
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
 * @public
 */

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
