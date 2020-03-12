#!/bin/bash
echo "Checking if there are minutes to publish for $DATE"
if [[ -f "$DIR/irc.log" ]]; then  

    echo "Generating minutes for $DATE"

    export GROUP=`cat $DIR/group.txt`
    echo $GROUP
    # Generate minutes
    node scribe-tool/index.js -d $DIR -g "$GROUP" -m -i
    git add index.html $DIR/index.html

else
    echo "nothing to do"
    exit 1
fi
