'use strict';

module.exports =
/** @lends Client# */
{
    /**
     * Retrieve blog options.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Options#wp.getOptions
     *
     * @param options
     * @param fn
     */
    getOptions: function(options, fn){
        if(!options){
            throw new Error('Cannot get options item without options specification.');
        }
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, options];
        this.xmlrpc.methodCall('wp.getOptions', args, fn);
    },
    /**
     * Edit blog options.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Options#wp.setOptions
     *
     * @param options
     * @param fn
     */
    setOptions: function(options, fn){
        if(!options){
            throw new Error('Cannot set options item without options specification.');
        }
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, options];
        this.xmlrpc.methodCall('wp.setOptions', args, fn);
    }
};