/*!
 * apache
 * Copyright(c) 2018 Matt Scott
 * MIT Licensed
 */
/**
 * Callback for ping().
 * @callback pingCallback
 * @param {null|Error} err - Null on no error
 * @param {boolean} success - Just because no error doesn't mean successful.
 */
/**
 * Ping hostname/port.
 * @param {number} port
 * @param {string} hostname
 * @param {pingCallback} callback
 * @param {boolean} [until] - Repeat until success (true) or failure (false)
 * @param {number} [timeout] - How long to repeat

 * @public
 */
export {  };
declare let ping: (port: number, hostname: string, callback: (err: any, success?: boolean | undefined) => void) => void;
export = ping;
