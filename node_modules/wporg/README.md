node-wporg
==========

By [@ramisayar](http://twitter.com/ramisayar)

node-wporg is a complete node WordPress(.org) client. It will let you query any part of the WordPress XML-RPC API with
ease. It covers the entire API and performs simple validation. It is immediately usable, see the examples below.

NOTE: Some APIs may not be available depending on your WordPress version install.

Installation
============

To install run:

```
npm install wporg
```

Example
=======

```
var client = wp.createClient({
    username: "username",
    password: "password",
    url: "http://example.com/xmlrpc.php"
});
client.getUsersBlogs(function(err, data){
    if(err){
        console.log(err);
    }
    else {
        console.log(data);
        // Do something.
    }
});
```

Documentation
=============

You can generate documentation (as well as run jshint and tests) by running:

Note: JAVA_HOME needs to be set.

```
npm install
./node_modules/grunt-cli/bin/grunt
```

or

```
./node_modules/jsdoc/jsdoc lib -d docs
```

License
=======

Copyright (c) 2013 Rami Sayar
Licensed under the The MIT License (MIT)

See LICENSE