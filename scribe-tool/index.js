var _ = require('underscore');
var async = require('async');
var email = require('emailjs');
var fs = require('fs');
var path = require('path');
var program = require('commander');
var scrawl = require('./scrawl');
var Twitter = require('twitter');
var wp = require('wporg');

program
  .version('0.3.0')
  .option('-d, --directory <directory>', 'The directory to process.')
  .option('-m, --html', 'If set, write the minutes to an index.html file')
  .option('-w, --wordpress', 'If set, publish the minutes to the blog')
  .option('-e, --email', 'If set, publish the minutes to the mailing list')
  .option('-t, --twitter', 'If set, publish the minutes to Twitter')
  .option('-g, --google', 'If set, publish the minutes to G+')
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
scrawl.group = 'Verifiable Claims Telecon';
scrawl.people = JSON.parse(peopleJson);

/************************* Utility Functions *********************************/
function postToWordpress(username, password, content, callback) {
  var client = wp.createClient({
    username: username,
    password: password,
    url: ''
  });
  // Re-format the HTML for publication to a Wordpress blog
  var datetime = new Date(gDate);
  datetime.setHours(37);
  var wpSummary = content.post_content;
  wpSummary = wpSummary.substring(
    wpSummary.indexOf('<dl>'), wpSummary.indexOf('</dl>') + 5);
  wpSummary = wpSummary.replace(/href=\"#/g,
    'href="https://w3c.github.io/vctf/meetings/' + gDate + '/#');
  wpSummary = wpSummary.replace(/href=\"audio/g,
    'href="https://w3c.github.io/vctf/meetings/' + gDate + '/audio');
  wpSummary = wpSummary.replace(/<div><audio[\s\S]*\/audio><\/div>/g, '');
  wpSummary += '<p>Detailed minutes and recorded audio for this call are ' +
    '<a href="https://w3c.github.io/vctf/meetings/' + gDate +
    '/">available in the archive</a>.</p>';

  // calculate the proper post date
  var gmtDate = datetime.toISOString();
  gmtDate = gmtDate.replace('T', ' ');
  gmtDate = gmtDate.replace(/\.[0-9]*Z/, '');

  content.post_content = wpSummary;
  content.post_date_gmt = gmtDate;
  content.terms_names = ['Meetings'];
  content.post_name = gDate + '-minutes';
  content.custom_fields = [{
    s2_meta_field: 'no'
  }];

  client.newPost(content, function(err, data) {
    if(err) {
      console.log(err);

      console.log('scrawl: You may have to add this information manually:');

      console.log('Title:\n' + content.post_title);
      console.log('Content:\n' + content.post_content);
      console.log('Slug:\n' + content.post_name);
    }
    else {
      console.log(data);
      // Do something.
    }
    callback();
  });
}

function sendEmail(username, password, hostname, content, callback) {
  var server  = email.server.connect({
    //user: username,
    //password: password,
    host: hostname,
    ssl: false
  });

  // send the message
  server.send({
    text:    content,
    from: 'msporny@digitalbazaar.com',
    //from:    username + '@' + hostname,
    to:      'Web Payments IG <public-webpayments-ig@w3.org>, Credentials CG <public-credentials@w3.org>',
    subject: 'Verifiable Claims Telecon Minutes for ' + gDate
  }, function(err, message) {
    if(err) {
      console.log('scrawl:', err);
      return callback();
    }

    if(!program.quiet) {
      console.log('scrawl: Sent minutes email to public-webpayments-ig@w3.org');
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
      callback('Error: ' + logFile +
        ' does not exist, required for processing.');
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
    '<main><section><div class="container">' +
    '<div class="row"><div class="col-md-8 col-md-offset-2">' +
    scrawl.generateMinutes(gLogData, 'html', gDate) +
    '</div></div></div></section></main>' + htmlFooter;
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

            // generate summary items
            var summary = {
              topic: [],
              resolution: []
            };
            summary.topic = data.match(/topic: (.*)/ig);
            summary.resolution = data.match(/resolved: (.*)/ig);

            // strip extraneous information
            for(var i in summary.topic) {
              summary.topic[i] = summary.topic[i].replace(/topic: /ig, '');
            }
            for(var j in summary.resolution) {
              summary.resolution[j] =
                summary.resolution[j].replace(/resolved: /ig, '');
            }

            var date = item.match(/([0-9]{4}-[0-9]{2}-[0-9]{2}-?[^\/]*)/)[1];
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
        summaryHtml += '<h3>Meeting for ' + key + '</h3>\n';
        if(summary.topic.length > 0) {
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
  // send the email about the meeting
  if(program.email) {
    if(!program.quiet) {
      console.log('scrawl: Sending new minutes email.');
    }

    // generate the body of the email
    var content = scrawl.generateMinutes(gLogData, 'text', gDate);
    var scribe = content.match(/Scribe:\n\s(.*)\n/g)[0]
      .replace(/\n/g, '').replace('Scribe:  ', '');
    content = 'Thanks to ' + scribe + ' for scribing this week! The minutes\n' +
      'for this week\'s Verifiable Claims telecon are now available:\n\n' +
      'http://w3c.github.io/vctf/meetings/'+ gDate + '/\n\n' +
      'Full text of the discussion follows for W3C archival purposes.\n' +
      'Audio from the meeting is available as well (link provided below).\n\n' +
      '----------------------------------------------------------------\n' +
      content;

    if(process.env.SCRAWL_EMAIL_USERNAME && process.env.SCRAWL_EMAIL_PASSWORD &&
      process.env.SCRAWL_EMAIL_SERVER) {
      sendEmail(
        process.env.SCRAWL_EMAIL_USERNAME, process.env.SCRAWL_EMAIL_PASSWORD,
        process.env.SCRAWL_EMAIL_SERVER, content, callback);
    } else {
      var prompt = require('prompt');
      prompt.start();
      prompt.get({
        properties: {
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
            'default': 'password'
          }
        }
      }, function(err, results) {
        sendEmail(results.username, results.password, results.server,
          content, callback);
      });
    }
  } else {
    callback();
  }
}, function(callback) {
  // format the G+ post for copy-paste
  if(program.google) {
    if(!program.quiet) {
      console.log('scrawl: Composing new G+ message.');
    }

    // generate the body of the email
    var content = scrawl.generateMinutes(gLogData, 'text', gDate);
    content = content.match(/Agenda(.|\n)*Organizer:/)[0].replace('Organizer:', '');
    var items = content.match(/Topics(.|\n)*(Action|Resolutions|.*)/)[0].match(/[0-9]{1,2}\. (.*)/g);
    var formattedItems = '';

    // create a brief description of what was discussed
    for(var i = 0; i < items.length; i++) {
       if(i > 0 && i < items.length - 1) {
         formattedItems += ', ';
       }
       else if(i == items.length - 1) {
         formattedItems += ', and ';
       }
       formattedItems += items[i].replace(/[0-9]{1,2}\. /, '').toLowerCase();
    }

    // format in a way that is readable on G+
    content = '*Verifiable Claims Task Force Meeting Summary for ' + gDate + '*\n\n' +
      'We discussed ' + formattedItems + '.\n\n' +
      content + '\nFull transcript and audio logs are available here:\n\n' +
      'http://w3c.github.io/vctf/meetings/' + gDate + '/\n\n' +
      '#vctf #w3c';

    console.log('scrawl: You will need to paste this to your G+ stream:\n');
    console.log(content);
    callback();
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
        var tweet = 'Verifiable Claims Task Force discusses ' +
          results.message + ': https://w3c.github.io/vctf/meetings/' +
          gDate + '/ #w3c #vctf';

        // send the tweet
        twitter.updateStatus(tweet, function(data) {
          console.log('scrawl: Tweet sent:', data.text);
          callback();
        });
      });
  } else {
    callback();
  }
}, function(callback) {
  // publish the wordpress blog post
  if(program.wordpress) {
    if(!program.quiet) {
      console.log('scrawl: Creating new blog post.');
    }
    var content = {
      post_title: 'Verifiable Claims Meeting Minutes for ' + gDate,
      post_content: scrawl.generateMinutes(gLogData, 'html', gDate)
    };

    if(process.env.SCRAWL_WP_USERNAME && process.env.SCRAWL_WP_PASSWORD) {
      postToWordpress(
        process.env.SCRAWL_WP_USERNAME, process.env.SCRAWL_WP_PASSWORD,
        content, callback);
    } else {
      var prompt = require('prompt');
      prompt.start();
      prompt.get({
        properties: {
          username: {
            description: 'Enter the Verifiable Claims WordPress username',
            pattern: /^.{4,}$/,
            message: 'The username must be at least 4 characters.',
            'default': 'msporny'
          },
          password: {
            description: 'Enter the user\'s password',
            pattern: /^.{4,}$/,
            message: 'The password must be at least 4 characters.',
            hidden: true,
            'default': 'password'
          }
        }
      }, function(err, results) {
        postToWordpress(results.username, results.password, content, callback);
      });
    }
  } else {
    callback();
  }
}], function(err) {
  // check to ensure there were no errors
  if(err) {
    console.log('Error:', err);
  }
});

