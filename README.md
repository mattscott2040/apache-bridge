# apache-bridge
**Start, stop, and configure Apache via Node.**

`apache-bridge` is a Node wrapper for [Apache HTTP Server](https://httpd.apache.org/docs/2.4/mod/core.html). This is not a replacement for Apache, so you must have Apache installed in order to use `apache-bridge` to connect.

## Table of Contents

* [Background](#background)
* [Installation](#installation)
* [Basic Usage](#basic-usage)
* [Advanced Usage](#advanced-usage)
* [Extensions](#extensions)
* [Documentation](#documentation)
   * [apache.createServer([confListener])](#apachecreateserverconflistener)
   * [Class: apache.Server](#class-apacheserver)
     * [Event: 'close'](#event-close)
     * [Event: 'configure'](#event-configure)
     * [Event: 'error'](#event-error)
     * [Event: 'listening'](#event-listening)
     * [server.bin](#serverbin)
     * [server.close([callback])](#serverclosecallback)
     * [server.listen([port][, hostname][, callback])](#serverlistenport-hostname-callback)
     * [server.listening](#serverlistening)

   * [Class: apache.Conf](#class-apacheconf)
     * [Event: 'finished'](#event-finished)
     * [conf.afterConf(directive)](#confafterconfdirective)
     * [conf.beforeConf(directive)](#confbeforeconfdirective)
     * [conf.define(parameter)](#confdefineparameter)
     * [conf.end(directive)](#confenddirective)
     * [conf.file](#conffile)
     * [conf.finished](#conffinished)
     * [conf.include(path)](#confincludepath)
     * [conf.loadModule(moduleName, modulePath)](#confloadmodulemodulename-modulepath)

## Background

This project allows the use of Node-based build tools to develop Apache-based web applications. The API is modeled after Node's [http.Server](https://nodejs.org/api/http.html#http_class_http_server) class to accommodate light interchangeability. In lieu of a ['request'](https://nodejs.org/api/http.html#http_event_request) event, `apache-bridge` provides a ['configure'](#event-configure) event along with the [apache.Conf](#class-apacheconf) class.

*Note*: This module is designed for development use only. Do not try to manage a live web server with `apache-bridge`.


```javascript
// http module
var http = require('http');
var server = http.createServer(requestListener);
server.listen(8000, 'localhost', callback);
```

```javascript
// apache-bridge module
var apache = require('apache-bridge');
var server = apache.createServer(confListener);
server.listen(8000, 'localhost', callback);
```

## Installation

Install and inject into `package.json` as a `devDependency`:

```bash
npm install apache-bridge --save-dev
```

or install globally:

```bash
npm install -g apache-bridge
```

## Basic Usage

### Create instance of Server class

```javascript
var apache = require('apache-bridge');
var server = apache.createServer();
```

### Set path to Apache

If the path to your Apache `httpd` file is not inclued in your `$PATH` environment variable, you can specify the path explicitly via [server.bin](#serverbin):

```javascript
server.bin = '/path/to/apache/bin';
```

You can also manually add the path to `process.env.PATH`:

```javascript
process.env.PATH = '/path/to/apache/bin:' + process.env.PATH;

module.exports = {
    // ...
}
```

### Start server

```javascript
server.listen(8000, 'localhost', function() {
    // Apache is listening on localhost:8000!
});
```

### Stop server

```javascript
server.close(function(err) {
    if(err) {
        // Apache already stopped!
    } else {
        // Apache stopped!
    }
});
```

## Advanced Usage

The server configuration can be manipulated on the fly by adding a listener to the ['configure'](#event-configure) event:

```javascript
var path = require('path');
var server = apache.createServer(function(conf) {
    conf.file = '/path/to/httpd.conf');
    conf.beforeConf('Define docroot ' . path.resolve('./src'));
        .include(path.resolve('./conf/extra/file.conf'))
        .end();
});
server.listen(8000);
```

The snippet above sets Apache's default config file to the one found at `/path/to/httpd.conf` and adds the following directives:

*Processed before httpd.conf:*
```apache
Define docroot /path/to/src
```

*Processed after httpd.conf:*
```apache
Include /path/to/conf/extra/file.conf
```

See [apache.Conf](#class-apacheconf) for more details about configuration options.

See [Apache documentation](https://httpd.apache.org/docs/2.4/mod/core.html) for more details about configuration directives.

## Extensions

The following other libraries are built using `apache-bridge`:

- [apache-webpack-plugin](https://github.com/mattscott2040/apache-webpack-plugin) -  Start Apache via `webpack-dev-server`.

### Coming soon

- `apache-connect` - Configureware for Node `apache-bridge`.
- `grunt-apache` - Start an Apache web server via `grunt`.
- `grunt-apache-connect` - Start an `apache-connect` web server via `grunt`.
- `gulp-apache` - Start an Apache web server via `gulp`.
- `gulp-apache-connect` - Start an `apache-connect` web server via `gulp`.

## Documentation

### apache.createServer([confListener])

- `confListener` `<Function>`
- Returns: [`<apache.Server>`](#class-apacheserver)

### Class: apache.Server

This class is used to start and stop Apache.

#### Event: 'close'

Emitted when the `httpd` child process exits.

```javascript
server.on('close', function() {
    // Apache stopped!
});
```

#### Event: 'configure'

- [`<apache.Conf>`](#class-apacheconf)

The `'configure'` event is emitted after [server.listen()](#serverlistenport-hostname-callback) is called but before the `httpd` child process is spawned.

```javascript
var server = apache.createServer(function(conf) {
    // Manipulate conf settings...
    conf.end();
});
```

#### Event: 'error'

- `<Error>`

The `'error'` event is emitted whenever:

1. The `httpd` child process could not be started, or
2. The `httpd` child process could not be stopped

#### Event: 'listening'

Emitted when the server has been bound after calling [server.listen()](#serverlistenport-hostname-callback).

```javascript
server.on('listening', function() {
    // Apache is ready!
});
```

#### server.bin

- `<string>` Defaults to `''`.

Set path to Apache `bin` directory where Apache `httpd` is located. This may be necessary if the path is not defined in your system's `$PATH` environment variable.

#### server.close([callback])

- `callback` `<Function>`
- Returns `<apache.Server>`

Kills the `httpd` child process.

```javascript
server.close(function(err) {
    if(err) {
        // Apache already stopped!
    } else {
        // Apache stopped!
    }
});
```

#### server.listen([port][, hostname][, callback])

- `port` `<number>` Port of remote server. Defaults to `80`.
- `hostname` `<string>` A domain name or IP address of the server to issue the request to. Defaults to `localhost`.
- `callback` `<Function>`
- Returns `<apache.Server>`

Start an Apache server listening for connections on the given `port` and `host`.

```javascript
server.listen(8000, 'localhost', function() {
    // Apache is ready!
});
```

#### server.listening

- `<boolean>`

A Boolean indicating whether or not the server is listening for connections.

### Class: apache.Conf

This class is used to configure Apache.

#### Event: 'finished'

Emitted after [conf.end()](#confenddirective) is called.

#### conf.afterConf(directive)

- `directive` `<string>`
- Returns: `<apache.Conf>`

Process the configuration `directive` after reading [conf.file](#conffile).

See [Apache documentation](https://httpd.apache.org/docs/2.4/mod/core.html) for more details about configuration directives.

#### conf.beforeConf(directive)

- `directive` `<string>`
- Returns: `<apache.Conf>`

Process the configuration `directive` before reading [conf.file](#conffile).

See [Apache documentation](https://httpd.apache.org/docs/2.4/mod/core.html) for more details about configuration directives.

#### conf.define(parameter)

- `parameter` `<string>`
- Returns: `<apache.Conf>`

Sets a configuration parameter which can be used with `<IfDefine>` sections in the configuration files to conditionally skip or process commands at server startup and restart.

```javascript
// apache-bridge
if(process.env.NODE_ENV === 'development') {
    conf.define('TEST');
}

conf.afterConf('<IfDefine TEST>')
    .afterConf('Define servername test.example.com')
    .afterConf('</IfDefine>');
```

```apache
# Directive
Define TEST

<IfDefine TEST>
Define servername test.example.com
</IfDefine>
```

See [Apache documentation](https://httpd.apache.org/docs/2.4/mod/core.html#define) for more details about the `Define` directive.

#### conf.end([directive]);

- `directive` `<string>`

Emits the ['finished'](#event-finished) event and sets [conf.finished](#conffinished) to `true`. Once this method is called, no more changes to the [apache.Conf](#class-apacheconf) instance are permitted. This prevents [server.listen()](#serverlistenport-hostname-callback) from starting Apache before any asynchronous configuration actions are completed.

*Note*: [conf.end()](#confenddirective) will be called automatically on [server.listen()](#serverlistenport-hostname-callback) if no listeners are bound for the ['configure'](#event-configure) event.

#### conf.file

- `<boolean>` | `<string>`  Defaults to `true`.

Boolean or string value that indicates whether Apache should load its default `httpd.conf` file (`true`), another config file (`string` path to config file), or no config at all (`false`).

#### conf.finished

- `<boolean>`

Boolean value that indicates whether the conf is ready to be processed. Starts as `false`. After [conf.end()](#confenddirective) executes, the value will be `true`.

#### conf.include(path)

- `path` `<string>`
- Returns: `<apache.Conf>`

Add an `Include` directive to be processed after reading [conf.file](#conffile). 

```javascript
// apache-bridge
conf.include('/usr/local/apache2/conf/ssl.conf');
```

```apache
# Directive
Include /usr/local/apache2/conf/ssl.conf
```

See [Apache documentation](https://httpd.apache.org/docs/2.4/mod/mod_so.html#loadmodule) for more details about the `Include` directive.

#### conf.loadModule(moduleName, modulePath)

- `moduleName` `<string>`
- `modulePath` `<string>`
- Returns: `<apache.Conf>`

Add a `LoadModule` directive to be processed after reading [conf.file](#conffile). 

```javascript
// apache-bridge
conf.loadModule('status_module', 'modules/mod_status.so');
```

```apache
# Directive
<IfModule !status_module>
LoadModule status_module "modules/mod_status.so"
</IfModule>
```

See [Apache documentation](https://httpd.apache.org/docs/2.4/mod/core.html#include) for more details about the `LoadModule` directive.
