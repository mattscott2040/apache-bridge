#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lib_server = require("./lib/server");
var lib_conf = require("./lib/conf");
var options = require("commander");
exports.createServer = lib_server.createServer;
exports.createConf = lib_conf.createConf;
exports.Server = lib_server.Server;
exports.Conf = lib_conf.Conf;
options
    .version('0.1.0')
    .option('-b, --bin <bin>', 'Path to Apache bin directory')
    .option('-p, --port <port>', 'Port number')
    .option('-h, --hostname <hostname>', 'Hostname')
    .option('-f, --file <file>', 'Config file')
    .parse(process.argv);
var server = lib_server.createServer();
if (options.bin) {
    server.bin = options.bin;
}
if (options.file) {
    server.conf.file = options.file;
}
server.on('error', function (err) {
    console.log(err.toString());
});
server.on('close', function () {
    console.log('Apache stopped.');
});
console.log('Starting Apache...');
server.listen(options.port, options.hostname, function () {
    console.log('Apache is ready!');
});
