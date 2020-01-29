#!/bin/bash
echo "Checking if there are minutes to publish for $DATE"
if [[ -f "$DATE/irc.log" && ! -f "$DATE/index.html" ]]; then  
    DIRECTORY=$DATE

    echo "Generating minutes for $DATE"
    # Generate minutes
    node scribe-tool/index.js -d $DIRECTORY -m -i
    git add index.html $DIRECTORY/index.html

else
    echo "nothing to do"
    exit 1
fi
