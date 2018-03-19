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
'use strict';
/**
 * Create a new Apache config.
 * @return {Conf}
 * @public
 */
exports.createConf = function () {
    return new Conf();
};
/**
 * Class representing an Apache config.
 * @class
 * */
var Conf = /** @class */ (function (_super) {
    __extends(Conf, _super);
    /**
     * Callback for new Httpd().
     * @callback Conf~confListener
     */
    /**
     * Create a new Apache config.
     * @param {Conf~confListener} confListener
     * @constructor
     */
    function Conf(confListener) {
        var _this = _super.call(this) || this;
        /**
        * Add a directive to load before main config file (-C flag).
        * @param {string} directive
        * @public
        */
        _this.beforeConf = function (directive) {
            return _this._addArgument('-C', directive);
        };
        /**
        * Add a directive to load after main config file (-c flag).
        * @param {string} directive
        * @public
        */
        _this.afterConf = function (directive) {
            return _this._addArgument('-c', directive);
        };
        /**
        * Define a parameter (-D flag).
        * @param {string} parameter
        * @public
        */
        _this.define = function (parameter) {
            return _this._addArgument('-D', parameter);
        };
        /**
        * Include a file (after main config).
        * @param {string} file
        * @public
        */
        _this.include = function (file) {
            return _this.afterConf('Include "' + path.resolve(file) + '"');
        };
        /**
        * Load a module (after main config).
        * @param {string} module
        * @param {string} file
        * @public
        */
        _this.loadModule = function (module, file) {
            return _this
                .afterConf('<IfModule !' + module + '>')
                .afterConf('LoadModule ' + module + ' "' + file + '"')
                .afterConf('</IfModule>');
        };
        /**
        * Stop configuring (and optionally append a directive).
        * @param {string} [directive]
        * @public
        */
        _this.end = function (directive) {
            if (_this.finished) {
                return;
            }
            if (directive) {
                _this.afterConf(directive);
            }
            _this.finished = true;
            _this.emit('finished');
        };
        _this._arguments = [];
        _this.file = true;
        _this.finished = false;
        if (confListener) {
            _this.on('finish', confListener);
        }
        return _this;
    }
    /**
    * Add a startup argument.
    * @param {string} flag
    * @param {string} [argument]
    * @private
    */
    Conf.prototype._addArgument = function (flag, arg) {
        var allowedFlags = ['-d', '-f', '-C', '-c', '-D', '-e', '-E', '-T', '-X', '-k', '-n', '-w'];
        var sanitizedArg;
        if (this.finished) {
            return this;
        }
        if (allowedFlags.indexOf(flag) === -1) {
            return this;
        }
        if (arg) {
            sanitizedArg = capitalize(arg.replace(/^-*(.*)$/, "$1"));
        }
        if (flag !== 'T' && flag !== 'w' && !sanitizedArg) {
            if (arg) {
                throw new Error('The flag `' + flag + '` requires an argument, but `' + arg + '` is invalid.');
            }
            else {
                throw new Error('The flag `' + flag + '` requires an argument, but none was given.');
            }
        }
        this._arguments.push(flag);
        if (sanitizedArg) {
            this._arguments.push(sanitizedArg);
        }
        return this;
    };
    /**
    * Get startup arguments.
    * @public
    */
    Conf.prototype.toArray = function () {
        var args = this._arguments;
        if (!this.file) {
            args.push('-f', path.resolve('conf/blank.conf'));
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
