/*!
 * conf
 * Copyright(c) 2018 Matt Scott
 * MIT Licensed
 */
'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies.
 * @private
 */
var events = require("events");
var path = require("path");
var os = require("os");
var tmp = require("tmp");
var fs = require("fs");
'use strict';
/**
 * Create a new Apache config.
 * @return {Conf}
 * @param {Conf~finishedListener} callback
 * @public
 */
exports.createConf = function (callback) {
    return new Conf(callback);
};
/**
 * Class representing an Apache config.
 * @class
 * */
var Conf = /** @class */ (function (_super) {
    __extends(Conf, _super);
    /**
     * Callback for conf.end().
     * @callback Conf~finishedListener
     */
    /**
     * Create a new Apache config.
     * @param {Conf~finishedListener} callback
     * @constructor
     */
    function Conf(callback) {
        var _this = _super.call(this) || this;
        /**
         * Add a directive to load before main config file (-C flag) - To be deprecated in v1.x
         * @param {string} directive
         * @public
         */
        _this.beforeConf = function (directive) {
            if (_this.finished) {
                throw new Error('Could not add directive `' + directive + '`: Configuration cannot be edited after conf.end() has been called.');
            }
            if (directive) {
                if (!_this._beforeConf) {
                    var file = tmp.fileSync().name;
                    _this._beforeConf = fs.createWriteStream(file);
                    _this.addArgument('-C', 'Include ' + file)
                        .on('finished', _this._beforeConf.close);
                }
                _this._beforeConf.write(directive + os.EOL);
            }
            return _this;
        };
        /**
        * Alias for addDirective() - To be deprecated in v1.x
        * @public
        */
        _this.afterConf = function (directive) {
            return _this.addDirective(directive);
        };
        /**
        * Add a directive to load after main config file (-c flag).
        * @param {string} directive
        * @public
        */
        _this.addDirective = function (directive) {
            if (_this.finished) {
                throw new Error('Could not add directive `' + directive + '`: Configuration cannot be edited after conf.end() has been called.');
            }
            if (directive) {
                if (!_this._directives) {
                    var file = tmp.fileSync().name;
                    _this._directives = fs.createWriteStream(file);
                    _this.include(file)
                        .on('finished', function () {
                        if (_this._directives) {
                            _this._directives.close;
                        }
                    });
                }
                _this._directives.write(directive + os.EOL);
            }
            return _this;
        };
        /**
        * Define a parameter (-D flag).
        * @param {string} parameter
        * @public
        */
        _this.define = function (parameter) {
            return _this.addArgument('-D', parameter);
        };
        /**
        * Include a file (after main config).
        * @param {string} file
        * @public
        */
        _this.include = function (file) {
            return _this.addDirective('Include "' + path.resolve(file) + '"');
        };
        /**
        * Load a module (after main config).
        * @param {string} module
        * @param {string} file
        * @public
        */
        _this.loadModule = function (module, file) {
            return _this
                .addDirective('<IfModule !' + module + '>')
                .addDirective('LoadModule ' + module + ' "' + file + '"')
                .addDirective('</IfModule>');
        };
        /**
        * Stop configuring (and optionally append a directive).
        * @param {string} [directive]
        * @public
        */
        _this.end = function (directive) {
            if (directive) {
                _this.addDirective(directive);
            }
            if (_this.finished) {
                return;
            }
            _this.finished = true;
            _this.emit('finished');
        };
        _this._arguments = [];
        _this._beforeConf = null; // To be deprecated in v1.x
        _this._directives = null;
        _this.file;
        _this.finished = false;
        if (callback) {
            _this.on('finished', callback);
        }
        return _this;
    }
    /**
    * Add a startup argument.
    * @param {string} arg
    * @param {string} [val]
    */
    Conf.prototype.addArgument = function (arg, val) {
        var allowedArgs = ['-d', '-f', '-C', '-c', '-D', '-e', '-E', '-T', '-X', '-k', '-n', '-w'];
        var sanitizedVal;
        if (val) {
            sanitizedVal = capitalize(val.replace(/^-*(.*)$/, "$1").replace(/\"/g, '\\"'));
        }
        if (this.finished) {
            var msg = 'Could not add argument `' + arg;
            if (sanitizedVal) {
                msg += ' ' + sanitizedVal;
            }
            msg += '`: Configuration cannot be edited after conf.end() has been called.';
            throw new Error(msg);
        }
        if (allowedArgs.indexOf(arg) === -1) {
            return this;
        }
        if (arg !== 'T' && arg !== 'w' && !sanitizedVal) {
            if (val) {
                throw new Error('The argument `' + arg + '` requires an argument, but `' + val + '` is invalid.');
            }
            else {
                throw new Error('The argument `' + arg + '` requires an argument, but none was given.');
            }
        }
        this._arguments.push(arg);
        if (sanitizedVal) {
            this._arguments.push('"' + sanitizedVal + '"');
        }
        return this;
    };
    /**
    * Alias for getArguments() - To be deprecated in v1.x
    * @public
    */
    Conf.prototype.toArray = function () {
        return this.getArguments();
    };
    /**
    * Get startup arguments.
    * @public
    */
    Conf.prototype.getArguments = function () {
        var args = this._arguments;
        if (this.file === false) {
            args.push('-f', path.join(__dirname, '../..', 'conf', 'blank.conf'));
        }
        else if (typeof this.file === 'string') {
            args.push('-f', path.resolve(this.file));
        }
        return args;
    };
    return Conf;
}(events.EventEmitter));
exports.Conf = Conf;
/**
 * Capitalize a string.
 * @param {string} str
 * @public
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
