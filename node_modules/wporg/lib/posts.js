'use strict';

var check = require('validator').check;

module.exports =
/** @lends Client# */
{
    /**
     * Retrieve a post of any registered post type.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.getPost
     *
     * @param postId
     * @param fn
     */
    getPost: function(postId, fn) {
        this.xmlrpc.methodCall('wp.getPost', [
            this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, postId
        ], fn);
    },
    /**
     * Retrieve list of posts of any registered post type.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.getPosts
     *
     * @param filter
     * @param fields
     * @param fn
     */
    getPosts: function(filter, fields, fn) {
        var args = [
            this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password
        ];
        if(filter){
            args.push(filter);
        }
        if(fields){
            args.push(fields);
        }
        this.xmlrpc.methodCall('wp.getPosts', args, fn);
    },
    /**
     * Create a new post of any registered post type.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.newPost
     *
     * @param content
     * @param fn
     */
    newPost: function(content, fn) {
        var args = [
            this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password
        ];
        if(content === undefined || content === null){
            throw new Error('Cannot create post with content object containing parameters.');
        }
        args.push(content);
        this.xmlrpc.methodCall('wp.newPost', args, fn);
    },
    /**
     * Edit an existing post of any registered post type.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.editPost
     *
     * @param postId
     * @param content
     * @param fn
     */
    editPost: function(postId, content, fn) {
        var args = [
            this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password
        ];
        if(postId === undefined || postId === null){
            throw new Error('Cannot edit post without a post id.');
        }
        args.push(postId);
        if(content === undefined || content === null){
            throw new Error('Cannot edit post with content object containing parameters.');
        }
        args.push(content);
        this.xmlrpc.methodCall('wp.editPost', args, fn);
    },
    /**
     * Delete an existing post of any registered post type.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.deletePost
     *
     * @param postId
     * @param fn
     */
    deletePost: function(postId, fn) {
        var args = [
            this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password
        ];
        if(postId === undefined || postId === null){
            throw new Error('Cannot edit post without a post id.');
        }
        args.push(postId);
        this.xmlrpc.methodCall('wp.deletePost', args, fn);
    },
    /**
     * Retrieve a registered post type.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.getPostType
     *
     * @param postTypeName
     * @param fields
     * @param fn
     */
    getPostType: function(postTypeName, fields, fn) {
        var args = [
            this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password
        ];
        if(!postTypeName){
            throw new Error('Cannot get post type without a post type name.');
        }
        check(postTypeName).notEmpty();
        args.push(postTypeName);
        if(fields){
            args.push(fields);
        }
        this.xmlrpc.methodCall('wp.getPostType', args, fn);
    },
    /**
     * Retrieve list of registered post types.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.getPostTypes
     *
     * @param filter
     * @param fields
     * @param fn
     */
    getPostTypes: function(filter, fields, fn){
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password];
        if (filter) { args.push(filter); }
        if (fields) { args.push(fields); }
        this.xmlrpc.methodCall('wp.getPostTypes', args, fn);
    },
    /**
     * Retrieve list of post formats.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.getPostFormats
     *
     * @param filter
     * @param fn
     */
    getPostFormats: function(filter, fn){
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password];
        if (filter) { args.push(filter); }
        this.xmlrpc.methodCall('wp.getPostFormats', args, fn);
    },
    /**
     * Retrieve list of supported values for post_status field on posts.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.getPostStatusList
     *
     * @param fn
     */
    getPostStatusList: function(fn) {
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password];
        this.xmlrpc.methodCall('wp.getPostStatusList', args, fn);
    }
};