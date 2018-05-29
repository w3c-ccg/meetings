#!/bin/sh
#
# Fetches the raw minutes for cleanup

display_usage() {
	echo "Downloads raw minutes and audio for CCG group meetings."
	echo ""
	echo "Usage: ./download-raw-minutes [-lh] [-d date]"
	echo "  -d [YYYY-MM-DD]     pass date argument"
    echo "  -l                  launch audio and video editors programmatically"
    echo "  -h                  display help"
    echo ""
    echo "Examples:"
	echo ""
    echo "  ./download-raw-minutes"
    echo "      downloads raw minutes and audio for the current date"
    echo ""
    echo "  ./download-raw-minutes -d 2018-05-15"
    echo "      downloads raw minutes and audio for 15 May 2018"
}
AUTO_LAUNCH=false
CREATE_DIRECTORY=true

for i in "$@"
do
case $i in
	--)
    display_usage
    exit 0
    ;;
    -h|--help)
    display_usage
    exit 0
    ;;
    -l|--autolaunch)
    AUTO_LAUNCH=true
    shift
    ;;
    -d|--date)
	shift
    DATE=$1
    break
    ;;
esac
done

# Guess the date if it isn't set
if [ -z "$DATE" ]; then
  DATE=`date +%Y-%m-%d`
  echo "No date argument supplied; using $DATE"
fi

echo "....Downloading minutes for date=$DATE"
echo "....Auto launch setting=$AUTO_LAUNCH"

# Get the editor commands
. ./publishing.cfg

# Create the minutes directory if it doesn't already exist
mkdir -p $DATE

# Download raw logs and recordings
echo "....Downloading IRC logs for $DATE..."
curl -# "https://w3c-ccg.s3.digitalbazaar.com/minutes/$DATE-irc.log" > $DATE/irc.log
echo "....Downloading audio recording for $DATE..."
curl -# "https://w3c-ccg.s3.digitalbazaar.com/minutes/$DATE-audio.wav" > $DATE/audio-raw.wav

echo "Download is finished! To finalize the minutes, clean up the minutes/audio and publish."

if [ "$AUTO_LAUNCH" = true ]; then
  # Edit the IRC log
  $EDITOR $DATE/irc.log &

  # Edit the audio recording
  $WAV_EDITOR $DATE/audio-raw.wav &
fi

# Print out directions on finalizing minutes
echo "  Instructions for editing minutes and audio:"
echo "    https://github.com/w3c-ccg/w3c-ccg.github.io/blob/master/irc_ref.md#edit"
echo "  Instructions for publishing:"
echo "    https://github.com/w3c-ccg/w3c-ccg.github.io/blob/master/irc_ref.md#publishing"

