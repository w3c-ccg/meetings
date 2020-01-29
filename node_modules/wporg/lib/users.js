'use strict';

module.exports =
/** @lends Client# */
{
    /**
     * Retrieve list of blogs for this user.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Users#wp.getUsersBlogs
     *
     * @param fn
     */
    getUsersBlogs: function (fn) {
        this.xmlrpc.methodCall('wp.getUsersBlogs', [
            this.defaultArgs.username, this.defaultArgs.password
        ], fn);
    },
    /**
     * Retrieve a user.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Users#wp.getUser
     *
     * @param userId
     * @param fields
     * @param fn
     */
    getUser: function (userId, fields, fn) {
        if(!userId){
            throw new Error('Cannot get user without user id.');
        }
        var args = [
            this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, userId
        ];
        if(fields){
            args.push(fields);
        }
        this.xmlrpc.methodCall('wp.getUser', args, fn);
    },
    /**
     * Retrieve list of users.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Users#wp.getUsers
     *
     * @param filter
     * @param fields
     * @param fn
     */
    getUsers: function(filter, fields, fn){
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password];
        if (filter) { args.push(filter); }
        if (fields) { args.push(fields); }
        this.xmlrpc.methodCall('wp.getUsers', args, fn);
    },
    /**
     * Retrieve profile of the requesting user.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Users#wp.getProfile
     *
     * @param fields
     * @param fn
     */
    getProfile: function(fields, fn) {
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password];
        this.xmlrpc.methodCall('wp.getProfile', args, fn);
    },
    /**
     * Edit profile of the requesting user.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Users#wp.editProfile
     *
     * @param content
     * @param fn
     */
    editProfile: function(content, fn){
        if(!content){
            throw new Error('Cannot edit profile without content object containing parameters.');
        }
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, content];
        this.xmlrpc.methodCall('wp.editProfile', args, fn);
    },
    /**
     * Retrieve list of all authors.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Users#wp.getAuthors
     *
     * @param fn
     */
    getAuthors: function(fn){
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password];
        this.xmlrpc.methodCall('wp.getAuthors', args, fn);
    }
};