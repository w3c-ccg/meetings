#!/bin/bash

if [ ! -f "$DATE/irc-raw.log" ]; then
    mkdir -p $DATE
    echo "....Downloading IRC logs for $DATE..."
    curl -# "https://w3c-ccg.s3.digitalbazaar.com/minutes/$DATE-irc.log" > $DATE/irc-raw.log
    ls -la $DATE
    git add $DATE/irc-raw.log
else
  echo "nothing to do"
  exit 1
fi
