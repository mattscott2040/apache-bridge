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
         * Alias for prependDirective() - To be deprecated in v1.x
         * @param {string} directive
         * @return {Conf}
         */
        _this.beforeConf = function (directive) {
            return _this.prependDirective(directive);
        };
        /**
         * Add a directive to load before main config file (-C flag)
         * @param {string} directive
         * @return {Conf}
         */
        _this.prependDirective = function (directive) {
            if (_this.finished) {
                throw new Error('Could not add directive `' + directive + '`: Configuration cannot be edited after conf.end() has been called.');
            }
            if (directive) {
                if (!_this._includes.C) {
                    var file = tmp.fileSync().name;
                    _this._includes.C = fs.createWriteStream(file);
                    _this._arguments.push('-C', '"Include \\"' + file + '\\""');
                    _this.on('finished', function () {
                        if (_this._includes.C) {
                            _this._includes.C.close;
                        }
                    });
                }
                _this._includes.C.write(directive + os.EOL);
            }
            return _this;
        };
        /**
         * Alias for addDirective() - To be deprecated in v1.x
         * @param {string} directive
         * @return {Conf}
         */
        _this.afterConf = function (directive) {
            return _this.addDirective(directive);
        };
        /**
         * Add a directive to load after main config file (-c flag).
         * @param {string} directive
         * @return {Conf}
         */
        _this.addDirective = function (directive) {
            if (_this.finished) {
                throw new Error('Could not add directive `' + directive + '`: Configuration cannot be edited after conf.end() has been called.');
            }
            if (directive) {
                if (!_this._includes.c) {
                    var file = tmp.fileSync().name;
                    _this._includes.c = fs.createWriteStream(file);
                    _this._arguments.push('-c', '"Include \\"' + file + '\\""');
                    _this.on('finished', function () {
                        if (_this._includes.c) {
                            _this._includes.c.close;
                        }
                    });
                }
                _this._includes.c.write(directive + os.EOL);
            }
            return _this;
        };
        /**
         * Define a parameter (-D flag).
         * @param {string} parameter
         * @return {Conf}
         */
        _this.define = function (parameter) {
            return _this.addArgument('-D', parameter);
        };
        /**
         * Include a file (after main config).
         * @param {string} file
         * @return {Conf}
         */
        _this.include = function (file) {
            return _this.addDirective('Include "' + path.resolve(file) + '"');
        };
        /**
         * Load a module (after main config).
         * @param {string} module
         * @param {string} file
         * @return {Conf}
         */
        _this.loadModule = function (module, file) {
            if (!module) {
                return _this;
            }
            if (!file) {
                file = module.replace(/^(.*)_module$/, 'modules/mod_$1.so');
            }
            return _this
                .addDirective('<IfModule !' + module + '>')
                .addDirective('LoadModule ' + module + ' "' + file + '"')
                .addDirective('</IfModule>');
        };
        /**
         * Stop configuring (and optionally append a directive).
         * @param {string} [directive]
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
        _this._includes = {
            C: null,
            c: null
        };
        _this.file;
        _this.finished = false;
        if (callback) {
            _this.on('finished', callback);
        }
        return _this;
    }
    /**
     * Alias for addArgument() - To be deprecated in v1.x
     * @param {string} arg
     * @param {string} [val]
     * @return {Conf}
     */
    Conf.prototype.addArgument = function (arg, val) {
        return this._addArgument(arg, val);
    };
    /**
     * Add a startup argument.
     * @param {string} arg
     * @param {string} [val]
     * @return {Conf}
     * @private
     */
    Conf.prototype._addArgument = function (arg, val) {
        if (arg === '-c') {
            if (val) {
                return this.addDirective(val);
            }
            else {
                return this;
            }
        }
        if (arg === '-C') {
            if (val) {
                return this.prependDirective(val);
            }
            else {
                return this;
            }
        }
        var allowedArgs = ['-d', '-f', '-D', '-e', '-E', '-T', '-X', '-k', '-n', '-w'];
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
     * @return {Conf}
     * @return {array}
     */
    Conf.prototype.toArray = function () {
        return this.getArguments();
    };
    /**
     * Get startup arguments.
     * @return {array}
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
 * @return {string}
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
