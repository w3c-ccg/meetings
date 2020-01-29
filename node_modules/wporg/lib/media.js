'use strict';

module.exports =
/** @lends Client# */
{
    /**
     * Retrieve a media item (i.e, attachment).
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Media#wp.getMediaItem
     *
     * @param attachmentId
     * @param fn
     */
    getMediaItem: function(attachmentId, fn){
        if(!attachmentId){
            throw new Error('Cannot get media item without attachment ID.');
        }
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, attachmentId];
        this.xmlrpc.methodCall('wp.getMediaItem', args, fn);
    },
    /**
     * Retrieve list of media items.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Media#wp.getMediaLibrary
     *
     * @param filter
     * @param fn
     */
    getMediaLibrary: function (filter, fn) {
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password];
        if (filter) { args.push(filter); }
        this.xmlrpc.methodCall('wp.getMediaLibrary', args, fn);
    },
    /**
     * Upload a media file.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Media#wp.uploadFile
     *
     * @param data
     * @param fn
     */
    uploadFile: function(data, fn){
        if(!data){
            throw new Error('Cannot upload file without the data');
        }
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, data];
        this.xmlrpc.methodCall('wp.uploadFile', args, fn);
    }
};