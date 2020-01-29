'use strict';

var check = require('validator').check;

module.exports =
/** @lends Client# */
{
    /**
     * Retrieve comment count for a specific post.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Comments#wp.getCommentCount
     *
     * @param postId
     * @param fn
     */
    getCommentCount: function (postId, fn) {
        check(postId).notEmpty();

        this.xmlrpc.methodCall('wp.getCommentCount', [
            this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, postId
        ], fn);
    },
    /**
     * Retrieve a comment.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Comments#wp.getComment
     *
     * @param commentId
     * @param fn
     */
    getComment: function (commentId, fn) {
        this.xmlrpc.methodCall('wp.getComment', [
            this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, commentId
        ], fn);
    },
    /**
     * Retrieve list of comments.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Comments#wp.getComments
     *
     * @param filter
     * @param fn
     */
    getComments: function (filter, fn) {
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password];
        if (filter) { args.push(filter); }
        this.xmlrpc.methodCall('wp.getComments', args, fn);
    },
    /**
     * Create a new comment.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Comments#wp.newComment
     *
     * @param postId
     * @param comment
     * @param fn
     */
    newComment: function(postId, comment, fn){
        if(!postId){
            throw new Error('Cannot add comment without a post id.');
        }
        if(!comment){
            throw new Error('Cannot add comment with content object containing parameters.');
        }
        check(postId).isInt();

        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, postId, comment];
        this.xmlrpc.methodCall('wp.newComment', args, fn);
    },
    /**
     * Edit an existing comment.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Comments#wp.editComment
     *
     * @param commentId
     * @param comment
     * @param fn
     */
    editComment: function(commentId, comment, fn){
        if(!commentId){
            throw new Error('Cannot edit comment without a comment id.');
        }
        if(!comment){
            throw new Error('Cannot edit comment with content object containing parameters.');
        }
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, commentId, comment];
        this.xmlrpc.methodCall('wp.editComment', args, fn);
    },
    /**
     * Remove an existing comment.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Comments#wp.deleteComment
     *
     * @param commentId
     * @param fn
     */
    deleteComment: function(commentId, fn){
        if(!commentId){
            throw new Error('Cannot delete comment without a comment id.');
        }
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, commentId];
        this.xmlrpc.methodCall('wp.deleteComment', args, fn);
    },
    /**
     * Retrieve list of comment statuses.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Comments#wp.getCommentStatusList
     *
     * @param fn
     */
    getCommentStatusList: function(fn){
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password];
        this.xmlrpc.methodCall('wp.getCommentStatusList', args, fn);
    }
};