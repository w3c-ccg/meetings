#!/bin/bash

if [ ! -f "$DIR/irc-raw.log" ]; then
    mkdir -p $DIR
    echo "....Downloading IRC logs for $DATE..."
    curl -# "https://w3c-ccg.s3.digitalbazaar.com/minutes/$DATE-irc.log" > $DIR/irc-raw.log
    ls -la $DIR
    git add $DIR/irc-raw.log
fi

if [ ! -f "$DIR/group.txt" ]; then
    echo $GROUP > $DIR/group.txt
    git add $DIR/group.txt
fi
