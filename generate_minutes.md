# CCG Minutes

## Generate CCG Minutes

The chairs will need to give you access to the [script that launches it](https://script.google.com/d/16afjkO2wiKTHFBdM1-e4xqQ6YNX5LeqDpoSTB1Wrgqa8AlVD3GDjeqcf/edit).

### Step 1: Fetch raw minutes into github meetings repo
- [open the script](https://script.google.com/d/16afjkO2wiKTHFBdM1-e4xqQ6YNX5LeqDpoSTB1Wrgqa8AlVD3GDjeqcf/edit)
- choose which function to trigger (GC call minutes=triggerMinutes)
- change the date for that function, and save it (disk button saves).
- click play button

What it does:
- Calls a github action that downloads the raw minutes and checks into the [CCG "meetings" github repo](https://github.com/w3c-ccg/meetings), under the meeting date (e.g. https://github.com/w3c-ccg/meetings/2020-08-04)

### Step 2: Fetch and clean audio
- Fetch the audio file 
    - For example: `curl -# "https://w3c-ccg.s3.digitalbazaar.com/minutes/2020-08-04-audio.wav" > audio-raw.wav`
- Open the .wav file in an audio editor (such as audacity) and clean/save the audio:
    - Delete all audio before the Chair starts talking about the Agenda
    - Delete all audio after the first person hangs up at the end of the call.
    - Save the new file as audio.wav or encode to .ogg (file name audio.ogg)
- Add the cleaned up audio file to github under the meeting date
    - For example: https://github.com/w3c-ccg/meetings/2020-08-04/audio.ogg


### Step 3: Clean up the log file 

Step 1 fetched the raw log file into git as https://github.com/w3c-ccg/meetings/YYYY-mm-dd/irc-raw.log. Now you need to add a cleaned up copy named https://github.com/w3c-ccg/meetings/YYYY-mm-dd/irc.log

- Go to [the online scribe tool](https://w3c-ccg.github.io/meetings/scribe-tool/) and copy/paste irc-raw.log into the text input box at the bottom. 
- Things to check
    - Ensure there's a link to the agenda ("Agenda: ...")
    - Ensure the topics are labeled ("Topic: ...")
    - Ensure the scribe is identified ("Scribe: ...")
    - Look for any find/replace suggestions in irc.log and update them ("s/../..")
    - Ensure aliases have matches (see people.json file)
- Add the edited file as `irc.log` (new or overwrite) and commit the changes via github
- The rest is handled for you; a github action will generate html and publish

What it does:
- Emails summary to ccg email group
- Tweets with the w3c_ccg account


## Advanced details about how it works
   
At the end of every call, the raw IRC log and audio recording are uploaded to:

* https://w3c-ccg.s3.digitalbazaar.com/minutes/YYYY-MM-DD-irc.log
* https://w3c-ccg.s3.digitalbazaar.com/minutes/YYYY-MM-DD-audio.wav

We use github actions to publish the minutes, and (optionally) to make updates

### To generate minutes for date

The script runs the following command. Note the script adds the date value (e.g. 2020-01-07) and has the github API token with permissions to this repo.
```
curl -H "Accept: application/vnd.github.everest-preview+json" \
    -H "Authorization: token <token>" \
    --request POST \
    --data '{"event_type": "generate_minutes", "client_payload": { "date": "<date>"}}' \
    https://api.github.com/repos/w3c-ccg/meetings/dispatches
```

- Trigger: run the curl command (see above)
- Actions:
    - Download and generates minutes for <date>
    - Checks into github
    - Email the minutes to the CCG alias
    - Tweets link to minutes
- Github Action File: [generate_minutes.yml](https://github.com/w3c-ccg/meetings/blob/gh-pages/.github/workflows/generate_minutes.yml)

If you're not happy with the minutes, you can update them

### To update the minutes for date

- Trigger: Kicks off when someone with access) checks in cleaned up irc.log file
- Does the following:
    - Updates html minutes and checks into github
- Github Action File: [update_minutes.yml](https://github.com/w3c-ccg/meetings/blob/gh-pages/.github/workflows/update_minutes.yml)

### Comments/Bugs/Future Improvements
- We don't have audio integrated into this process yet. [See details below for what needs to be done]((#cleaning-up-the-minutes))
- Instead of manually triggering the script, we could also try kicking this off on a schedule or using an s3 file watcher approach
- Use github caching action because this repo is large
- Make multiple tos not bcc
