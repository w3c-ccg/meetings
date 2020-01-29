'use strict';

var xmlrpc = require('xmlrpc')
    , _ = require('underscore')
    , check = require('validator').check;

/**
 * Wordpress(.org) Client Constructor.
 *
 * @param options           - It takes an options object which must contain:
 *
 *  - {String} url          - The WordPress URL.
 *  - {String} username     - The WordPress username.
 *  - {String} password     - The WordPress password.
 *  - {Boolean} isSecure    - Do we have to access the WordPress
 *                            install through a secure client.
 *  - {Integer} blogId      - (optional) This is used when the WordPress install is Multi-Site.
 *
 * @returns {Client}
 * @constructor
 */
function Client(options){
    // Invokes with new if called without
    if (false === (this instanceof Client)) {
        return new Client(options);
    }

    if(typeof options !== 'object'){
        throw new Error('Options is not an object');
    }

    ['username', 'password', 'url'].forEach(function(item){
        if (!options.hasOwnProperty(item) && options[item] instanceof String ){
            throw new Error('Missing constructor parameter in options or is not a string: ' + item);
        }
    });
    if (!options.hasOwnProperty('isSecure') && options.isSecure instanceof Boolean){
        throw new Error('Missing constructor parameter in options or is not a string: isSecure');
    }

    check(options.username).notEmpty();
    check(options.password).notEmpty();
    this.defaultArgs = {
        username: options.username,
        password: options.password
    };

    this.setUrl(options.url, options.isSecure);
    check(options.url).notEmpty().isUrl();

    //NOTE This parameter does not need to be set immediately and is optional.
    if (options.hasOwnProperty('blogId')){
        this.setBlogId(options.blogId);
    }
    else {
        this.defaultArgs.blogId = 1; // Default
    }
}

/**
 * Set the id for the blog. This setter is mostly for WordPress Multi-Site installs.
 * @param blogId            - Blog Id.
 */
Client.prototype.setBlogId = function(blogId){
    this.defaultArgs.blogId = blogId;
};

/**
 * Getter for blog id.
 * @returns {number}
 */
Client.prototype.getBlogId = function(){
    return this.defaultArgs.blogId;
};

/**
 * For WordPress Multi-Site installs, you will occasionally have to change the url.
 * @param url               - WordPress Url including the xmlrpc.php endpoint.
 */
Client.prototype.setUrl = function(url, isSecure){
    check(url).notEmpty().isUrl();
    var options = _.extend({url: url}, this.defaultArgs);
    this.xmlrpc = isSecure ? xmlrpc.createSecureClient(options) : xmlrpc.createClient(options);
    this.xmlrpc.options.headers['User-Agent'] = 'node-wporg xml-rpc client';
};
_.extend(Client.prototype, require('./users'));
_.extend(Client.prototype, require('./options'));
_.extend(Client.prototype, require('./posts'));
_.extend(Client.prototype, require('./media'));
_.extend(Client.prototype, require('./taxonomies'));
_.extend(Client.prototype, require('./comments'));

module.exports = Client;
