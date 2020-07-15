var _ = require('underscore');
var async = require('async');
var emailjs = require('emailjs');
var fs = require('fs');
var path = require('path');
var program = require('commander');
var scrawl = require('./scrawl');
var Twitter = require('twitter');
var wp = require('wporg');

program
  .version('0.3.0')
  .option('-d, --directory <directory>', 'The directory to process.')
  .option('-g, --group <group>', 'Group', 'Credentials CG')
  .option('-m, --html', 'If set, write the minutes to an index.html file')
  .option('-e, --email', 'If set, publish the minutes to the mailing list')
  .option('-t, --twitter', 'If set, publish the minutes to Twitter')
  .option('-i, --index', 'Build meeting index')
  .option('-q, --quiet', 'Don\'t print status information to the console')
  .parse(process.argv);

if(!program.directory) {
  console.log('Error: You must specify a directory to process');
  process.exit(1);
}

// setup global variables
var dstDir = path.resolve(path.join(program.directory));
var logFile = path.resolve(path.join(program.directory, 'irc.log'));
var indexFile = path.resolve(path.join(program.directory, 'index.html'));
var emailContentsFile = path.resolve(path.join(program.directory, 'email.log'));
var htmlHeader = fs.readFileSync(
  __dirname + '/header.html', {encoding: 'utf8'});
var htmlFooter = fs.readFileSync(
  __dirname + '/footer.html', {encoding: 'utf8'});
var peopleJson = fs.readFileSync(
  __dirname + '/people.json', {encoding: 'utf8'});
var gLogData = '';
var gDate = path.basename(dstDir);
gDate = gDate.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/)[1];

// configure scrawl
scrawl.group = `${program.group} Telecon`;
scrawl.people = JSON.parse(peopleJson);

function generateEmailBody() {
// generate the body of the email
  var content = scrawl.generateMinutes(gLogData, 'text', gDate);
  var scribe = content.match(/Scribe:\n\s(.*)\n/g)[0]
      .replace(/\n/g, '').replace('Scribe:  ', '');
  content = `Thanks to ${scribe} for scribing this week! The minutes\n` +
      `for this week\'s ${program.group} telecon are now available:\n\n` +
      `https://w3c-ccg.github.io/meetings/ ${program.directory} \n\n` +
      'Full text of the discussion follows for W3C archival purposes.\n' +
      'Audio from the meeting is available as well (link provided below).\n\n' +
      '----------------------------------------------------------------\n' +
      content;
  return content;
}

/************************* Utility Functions *********************************/

function sendEmail(email, username, password, hostname, content, callback, port=null, ssl=false, tls=false) {
  var server = null;

  var connectionOptions = {
      user: username,
      host: hostname,
      ssl: ssl,
      tls: tls
  };
  if(password.length > 3) {
    connectionOptions.password = password;
  }
  if(port) {
    connectionOptions.port = port;
  }

  server = emailjs.server.connect(connectionOptions);

  var toEmail = `Credentials CG <${process.env.SCRAWL_EMAIL_TO_ADDRESS}>`;

  // send the message
  server.send({
    text:    content,
    from:    email,
    to:      toEmail,
    subject: `[MINUTES] W3C ${program.group} Call - ${gDate} 12pm ET`
  }, function(err, message) {
    if(err) {
      console.error('scrawl:', err);
      return callback();
    }

    if(!program.quiet) {
      console.log(`scrawl: Sent minutes email to <${process.env.SCRAWL_EMAIL_TO_ADDRESS}>`);
    }
    callback();
  });
}

/*************************** Main Functionality ******************************/

async.waterfall([ function(callback) {
  // check to make sure the log file exists in the given directory
  //console.log("dstDir:", dstDir, "\nlogFile:", logFile);
  fs.exists(logFile, function(exists) {
    if(exists) {
      callback();
    } else {
      callback(`Error: ${logFile} does not exist, required for processing.`);
    }
  });
}, function(callback) {
  // read the IRC log file
  fs.readFile(logFile, 'utf8', callback);
}, function(data, callback) {
  gLogData = data;
  // generate the index.html file
  var minutes =
    htmlHeader +
    '<div><div><div class="container">' +
    '<div class="row"><div class="col-md-8 col-md-offset-2">' +
    scrawl.generateMinutes(gLogData, 'html', gDate) +
    '</div></div></div></div></div>' + htmlFooter;
  callback(null, minutes);
}, function(minutes, callback) {
  // write the index.html file to disk
  if(program.html) {
    if(!program.quiet) {
      console.log('scrawl: Writing', indexFile);
    }
    fs.writeFile(indexFile, minutes, {}, callback);
  } else {
    callback();
  }
}, function(callback) {
  // write the index.html file to disk
  if(program.index) {
    if(!program.quiet) {
      console.log('scrawl: Writing meeting summaries...');
    }
    var minutesDir = __dirname + '/..';
    var logFiles = [];
    async.auto({
      readDirs: function(callback) {
        fs.readdir(minutesDir, callback);
      },
      findLogs: ['readDirs', function(callback, results) {
        async.each(results.readDirs, function(item, callback) {
          var ircLog = minutesDir + '/' + item + '/irc.log';
          fs.exists(ircLog, function(exists) {
            if(exists) {
              logFiles.push(ircLog);
            }
            callback();
          });
        }, function(err) {
          callback(err, logFiles);
        });
      }],
      buildSummaries: ['findLogs', function(callback, results) {
        var summaries = {};
        async.each(results.findLogs, function(item, callback) {
          fs.readFile(item, "utf8", function(err, data) {
            if(err) {
              return callback(err);
            }

            var dateMatch = item.match(/([0-9]{4}-[0-9]{2}-[0-9]{2}-?[^\/]*)/);
            if(!dateMatch) {
              // Skip processing
              return callback();
            }

            // generate summary items
            var summary = {
              topic: [],
              resolution: []
            };
            var topicMatch = data.match(/topic: (.*)/ig);

            if (topicMatch) {
              summary.topic = topicMatch;

              // strip extraneous information
              for(var i in summary.topic) {
                summary.topic[i] = summary.topic[i].replace(/topic: /ig, '');
              }
            }

            var resolutionMatch = data.match(/resolved: (.*)/ig);
            if (resolutionMatch) {
              summary.resolution = resolutionMatch;
              for(var j in summary.resolution) {
                summary.resolution[j] =
                  summary.resolution[j].replace(/resolved: /ig, '');
              }
            }

            var date = dateMatch[1];
            summaries[date] = summary;
            callback();
          });
        }, function(err) {
          callback(err, summaries);
        });
      }]
    }, function(err, results) {
      if(err) {
        return callback(err);
      }

      // write out summary file
      var summaryHtml = htmlHeader.replace('../../stylesheet', '../stylesheet');
      var summaryKeys = Object.keys(results.buildSummaries).sort().reverse();
      for(var k in summaryKeys) {
        var key = summaryKeys[k];
        var summary = results.buildSummaries[key];
        summaryHtml += '<h3><a href="' + key + '/">Meeting for ' + key + '</a></h3>\n';
        if(summary.topic && summary.topic.length > 0) {
          summaryHtml += '<h4>Topics</h4><ol>\n';
          for(var t in summary.topic) {
            var tcounter = parseInt(t) + 1;
            summaryHtml +=
              '<li><a href="' + key + '/#topic-' + tcounter + '">' +
              summary.topic[t] + '</a></li>\n';
          }
          summaryHtml += '</ol>\n';
        }
        if(summary.resolution && summary.resolution.length > 0) {
          summaryHtml += '<h4>Resolutions</h4><ol>\n';
          for(var r in summary.resolution) {
            var rcounter = parseInt(r) + 1;
            summaryHtml +=
              '<li><a href="' + key + '/#resolution-' + rcounter + '">' +
              summary.resolution[r] + '</a></li>\n';
          }
          summaryHtml += '</ol>\n';
        }
      }
      summaryHtml += htmlFooter;

      fs.writeFileSync(__dirname + '/../index.html', summaryHtml, 'utf-8');
      callback();
    });
  } else {
    callback();
  }
}, function(callback) {
  var content = generateEmailBody();
  fs.writeFileSync(emailContentsFile, content, 'utf-8');

  // send the email about the meeting
  if(program.email) {
    if(!program.quiet) {
      console.log('scrawl: Sending new minutes email.');
    }


    if(process.env.SCRAWL_EMAIL_FROM_ADDRESS && process.env.SCRAWL_EMAIL_USERNAME && 
      process.env.SCRAWL_EMAIL_PASSWORD && process.env.SCRAWL_EMAIL_SERVER) {
      sendEmail(
        process.env.SCRAWL_EMAIL_FROM_ADDRESS, 
        process.env.SCRAWL_EMAIL_USERNAME, process.env.SCRAWL_EMAIL_PASSWORD,
        process.env.SCRAWL_EMAIL_SERVER, content, callback, process.env.SCRAWL_EMAIL_PORT, process.env.SCRAWL_EMAIL_SSL, process.env.SCRAWL_EMAIL_TLS);
    } else {
      var prompt = require('prompt');
      prompt.start();
      prompt.get({
        properties: {
          email: {
            description: 'Enter your email address',
            pattern: /^.{1,}@.{1,}$/,
            message: 'The email address must be valid.',
            'default': 'msporny@digitalbazaar.com'
          },
          server: {
            description: 'Enter your email server',
            pattern: /^.{4,}$/,
            message: 'The server name must be at least 4 characters.',
            'default': 'mail.digitalbazaar.com'
          },
          username: {
            description: 'Enter your email login name',
            pattern: /^.{1,}$/,
            message: 'The username must be at least 4 characters.',
            'default': 'msporny'
          },
          password: {
            description: 'Enter your email password',
            pattern: /^.{4,}$/,
            message: 'The password must be at least 4 characters.',
            hidden: true,
            'default': ''
          }
        }
      }, function(err, results) {
        sendEmail(results.email, results.username, results.password, 
          results.server, content, callback);
      });
    }
  } else {
    callback();
  }
}, function(callback) {
  // publish the minutes to Twitter
  if(program.twitter) {
    if(!process.env.SCRAWL_TWITTER_CONSUMER_KEY ||
      !process.env.SCRAWL_TWITTER_SECRET ||
      !process.env.SCRAWL_TWITTER_TOKEN_KEY ||
      !process.env.SCRAWL_TWITTER_TOKEN_SECRET) {
      console.log('scrawl: You must set the following environment variables ' +
        'for twitter\nposting to work: SCRAWL_TWITTER_CONSUMER_KEY, ' +
        'SCRAWL_TWITTER_SECRET,\nSCRAWL_TWITTER_TOKEN_KEY, ' +
        'SCRAWL_TWITTER_TOKEN_SECRET.');
      return callback();
    }
    // create the twitter client
    var twitter = new Twitter({
      consumer_key: process.env.SCRAWL_TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.SCRAWL_TWITTER_SECRET,
      access_token_key: process.env.SCRAWL_TWITTER_TOKEN_KEY,
      access_token_secret: process.env.SCRAWL_TWITTER_TOKEN_SECRET
    });

    // get the tweet text
    console.log('scrawl: Creating new tweet.');
    var prompt = require('prompt');
      prompt.start();
      prompt.get({
        properties: {
          message: {
            description: 'Enter the tweet contents (what was discussed)',
            pattern: /^.{4,100}$/,
            message: 'The message must be between 4-100 characters.'
          }
        }
      }, function(err, results) {
        // construct the tweet
        var tweet = 'Credentials CG discusses ' +
          results.message + ': https://w3c-ccg.github.io/meetings/' +
          gDate + '/ #w3c #ccg';

        // send the tweet
        twitter.updateStatus(tweet, function(data) {
          console.log('scrawl: Tweet sent:', data.text);
          callback();
        });
      });
  } else {
    callback();
  }
}], function(err) {
  // check to ensure there were no errors
  if(err) {
    console.log('Error:', err);
  }
});

