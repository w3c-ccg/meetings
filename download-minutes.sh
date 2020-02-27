#!/bin/bash

if [ ! -f "$DATE/irc-raw.log" ]; then
    mkdir -p $OUTPUT_DIR
    echo "....Downloading IRC logs for $DATE..."
    curl -# "https://w3c-ccg.s3.digitalbazaar.com/minutes/$DATE-irc.log" > $OUTPUT_DIR/irc-raw.log
    ls -la $OUTPUT_DIR
    git add $OUTPUT_DIR/irc-raw.log
    echo $GROUP > $OUTPUT_DIR/group.txt
    git add $OUTPUT_DIR/group.txt
else
  echo "nothing to do"
  exit 1
fi
