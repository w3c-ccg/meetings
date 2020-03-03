# meetings
COMMUNITY: W3C Credentials Community Group meeting transcripts

Below desribes how to publish CCG minutes.

## Generate the minutes

Run the following curl command and you're done! 

- Note you need to add the date value (e.g. 2020-01-07) and have a github API token with permissions to this repo.
- This will download the raw minutes and ping the chairs (or TBD list) to clean it up (with instructions)
```
curl -H "Accept: application/vnd.github.everest-preview+json" \
    -H "Authorization: token <token>" \
    --request POST \
    --data '{"event_type": "generate_minutes", "client_payload": { "date": "<date>"}}' \
    https://api.github.com/repos/w3c-ccg/meetings/dispatches
```

What it does:
- Creates the html files and checks into github
- Emails summary to ccg email group
- Tweets with the w3c_ccg account
  
## Not happy with the minutes? Clean them up

- Go to [the online scribe tool](https://w3c-ccg.github.io/meetings/scribe-tool/) and copy/paste irc.log into the text input box at the bottom. 
- Things to check
    - Ensure there's a link to the agenda ("Agenda: ...")
    - Ensure the topics are labeled ("Topic: ...")
    - Ensure the scribe is identified ("Scribe: ...")
    - Look for any find/replace suggestions in irc.log and update them ("s/../..")
    - Ensure aliases have matches (see people.json file)
- Overwrite the `irc.log` with the edited file and commit the changes via github
- The rest is handled for you; a github action will generate html and publish


## Details about how it works
   
At the end of every call, the raw IRC log and audio recording are uploaded to:

* https://w3c-ccg.s3.digitalbazaar.com/minutes/YYYY-MM-DD-irc.log
* https://w3c-ccg.s3.digitalbazaar.com/minutes/YYYY-MM-DD-audio.wav

We use github actions to publish the minutes, and (optionally) to make updates

### To generate minutes for date

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

    
## Comments/Bugs/Future Improvements
- We don't have audio integrated into this process yet. [See details below for what needs to be done]((#cleaning-up-the-minutes))
- Reducing number of steps:
    - This can be reduced to 1 step once we get into better scriibe hygiene habits. The separate cleanup won't be necessary
    - We could also try kicking this off on a schedule or using an s3 file watcher approach
- Use github caching action because this repo is large
- Make multiple tos not bcc
- Add wait before tweet


## Cleaning up the Audio

- Open the audio-raw.wav file in an editor (see setup above):
- Delete all audio before the Chair starts talking about the Agenda
- Delete all audio after the first person hangs up at the end of the call.
- Save the new file as audio.wav or encode to .ogg (file name audio.ogg) at 32kbps
    - For example: `oggenc -b 32 audio.wav`

