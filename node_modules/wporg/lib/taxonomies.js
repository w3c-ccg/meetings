'use strict';

var check = require('validator').check;

module.exports =
/** @lends Client# */
{
    /**
     * Retrieve information about a taxonomy.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Taxonomies#wp.getTaxonomy
     *
     * @param taxonomy
     * @param fn
     */
    getTaxonomy: function(taxonomy, fn){
        if(!taxonomy){
            throw new Error('Cannot get taxonomy item without taxonomy parameter.');
        }
        check(taxonomy).notEmpty();

        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, taxonomy];
        this.xmlrpc.methodCall('wp.getTaxonomy', args, fn);
    },
    /**
     * Retrieve a list of taxonomies.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Taxonomies#wp.getTaxonomies
     *
     * @param fn
     */
    getTaxonomies: function(fn){
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password];
        this.xmlrpc.methodCall('wp.getTaxonomies', args, fn);
    },
    /**
     * Retrieve a taxonomy term.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Taxonomies#wp.getTerm
     *
     * @param taxonomy
     * @param termId
     * @param fn
     */
    getTerm: function(taxonomy, termId, fn){
        if(!taxonomy){
            throw new Error('Cannot get taxonomy term without taxonomy parameter.');
        }
        if(!termId){
            throw new Error('Cannot get taxonomy term without term parameter.');
        }
        check(taxonomy).notEmpty();

        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, taxonomy, termId];
        this.xmlrpc.methodCall('wp.getTerm', args, fn);
    },
    /**
     * Retrieve list of terms in a taxonomy.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Taxonomies#wp.getTerms
     *
     * @param taxonomy
     * @param filter
     * @param fn
     */
    getTerms: function(taxonomy, filter, fn){
        if(!taxonomy){
            throw new Error('Cannot get taxonomy term without taxonomy parameter.');
        }
        check(taxonomy).notEmpty();

        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, taxonomy];
        if (filter) {args.push(filter);}
        this.xmlrpc.methodCall('wp.getTerms', args, fn);
    },
    /**
     * Create a new taxonomy term.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Taxonomies#wp.newTerm
     *
     * @param content
     * @param fn
     */
    newTerm: function(content, fn){
        if(!content){
            throw new Error('Cannot create term without content object parameter.');
        }
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, content];
        this.xmlrpc.methodCall('wp.newTerm', args, fn);
    },
    /**
     * Edit an existing taxonomy term.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Taxonomies#wp.editTerm
     *
     * @param termId
     * @param content
     * @param fn
     */
    editTerm: function(termId, content, fn){
        if(!termId){
            throw new Error('Cannot edit term without term id parameter.');
        }
        if(!content){
            throw new Error('Cannot edit term without content object parameter.');
        }
        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, termId, content];
        this.xmlrpc.methodCall('wp.editTerm', args, fn);
    },
    /**
     * Delete an existing taxonomy term.
     *
     * @see http://codex.wordpress.org/XML-RPC_WordPress_API/Taxonomies#wp.deleteTerm
     *
     * @param taxonomy
     * @param termId
     * @param fn
     */
    deleteTerm: function(taxonomy, termId, fn){
        if(!taxonomy){
            throw new Error('Cannot delete term without taxonomy parameter.');
        }
        if(!termId){
            throw new Error('Cannot delete term without term id.');
        }
        check(taxonomy).notEmpty();

        var args = [this.defaultArgs.blogId, this.defaultArgs.username,
            this.defaultArgs.password, taxonomy, termId];
        this.xmlrpc.methodCall('wp.deleteTerm', args, fn);
    }
};