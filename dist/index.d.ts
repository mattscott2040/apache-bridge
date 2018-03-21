/*!
 * apache-bridge
 * Copyright(c) 2018 Matt Scott
 * MIT Licensed
 */
/**
 * Module exports.
 * @public
 */
import lib_server = require('./lib/server');
import lib_conf = require('./lib/conf');
export declare const createServer: (callback?: ((conf: lib_conf.Conf) => void) | undefined) => lib_server.Server;
export declare const createConf: () => lib_conf.Conf;
export declare const Server: typeof lib_server.Server;
export declare const Conf: typeof lib_conf.Conf;
