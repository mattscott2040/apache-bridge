#!/usr/bin/env node

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
import options = require('commander');

export const createServer = lib_server.createServer;
export const createConf = lib_conf.createConf;
export const Server = lib_server.Server;
export const Conf = lib_conf.Conf;

options
    .version('0.1.0')
    .option('-b, --bin <bin>', 'Path to Apache bin directory')
    .option('-p, --port <port>', 'Port number')
    .option('-h, --hostname <hostname>', 'Hostname')
    .option('-f, --file <file>', 'Config file')
    .parse(process.argv);

const server = lib_server.createServer();

if(options.bin) {
    server.bin = options.bin;
}

if(options.file) {
    server.conf.file = options.file;
}

server.on('error', (err) => {
    console.log(err.toString());
});

server.on('close', () => {
    console.log('Apache stopped.');
});

console.log('Starting Apache...');
server.listen(options.port, options.hostname, () => {
    console.log('Apache is ready!');
});
