'use strict';

/**
 * @module wporg
 */
var Client = require('./client');

var wporg = exports;

wporg.createClient = function(options){
    if(typeof options !== 'object'){
        throw new Error('Options is not an object.');
    }
    // Add default parameters
    options.isSecure = options.isSecure || false;
    return new Client(options);
};

wporg.createSecureClient = function(options){
    if(typeof options !== 'object'){
        throw new Error('Options is not an object.');
    }
    options.isSecure = true;
    return new Client(options);
};