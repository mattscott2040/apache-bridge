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

export const createServer = lib_server.createServer;
export const createConf = lib_conf.createConf;
export const Server = lib_server.Server;
export const Conf = lib_conf.Conf;