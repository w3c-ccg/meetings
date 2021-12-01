/**
 * Scrawl is a tool that is useful for taking minutes via IRC and cleaning them
 * up for public consumption. It takes an IRC log as input and generates a
 * nice, stand-alone HTML page from the input.
 */
(function() {
  var $ = (typeof jQuery !== 'undefined') ? jQuery : undefined;
  /* Standard regular expressions to use when matching lines */
  var commentRx = /^\[?(.*)\]?\s+\<(.*)\>\s+(.*)$/;
  var scribeRx = /^(scribe|scribenick):.*$|scribe\+/i;
  var meetingRx = /^meeting:\s(.*)$/i;
  var totalPresentRx = /^total present:\s(.*)$/i;
  var dateRx = /^date:\s(.*)$/i;
  var chairRx = /^chair:.*$/i;
  var audioRx = /^audio:\s?(.*)$/i;
  var proposalRx = /^(proposal|proposed):.*$/i;
  var presentRx = /^present[:+](.*)$/i;
  var resolutionRx = /^(resolution|resolved): ?(.*)$/i;
  var useCaseRx = /^(use case|usecase):\s?(.*)$/i;
  var topicRx = /^topic:\s*(.*)$/i;
  var actionRx = /^action:\s*(.*)$/i;
  var voipRx = /^voip.*$/i;
  var toVoipRx = /^voip.{0,4}:.*$/i;
  var rrsAgentRx = /^RRSAgent.*$/i;
  var queueRx = /^q[+-?]\s.*|^q[+-?].*|^ack\s+.*|^ack$/i;
  var voteRx = /^[+-][01]\s.*|[+-][01]$/i;
  var agendaRx = /^agenda:\s*((https?):.*)$/i;
  var urlRx = /((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/;

  // Compatability code to make this work in both node.js and the browser
  var scrawl = {};
  var nodejs = false;
  if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    var Entities = require('html-entities').XmlEntities;
    var entities = new Entities();
    module.exports = scrawl;
    nodejs = true;
  } else {
    window.scrawl = scrawl;
  }

  /* The update counter and the timeout is used to delay the update of the
    HTML output by a few seconds so that reformatting the page doesn't
    overload the CPU. */
  scrawl.updateCounter = 1;
  scrawl.updateCounterTimeout = null;

  scrawl.wordwrap = function(str, width, brk, cut )
  {
    brk = brk || '\n';
    width = width || 65;
    cut = cut || false;

    if (!str) { return str; }

    var regex = '.{1,' + width + '}(\\s|$)' +
      (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');

    return str.match(RegExp(regex, 'g')).join(brk);
  };

  scrawl.generateAliases = function(ircLog)
  {
    var rval = {};

    // build list of all people by full name, last name, and nicks
    var allPeople = {};
    for(var p in scrawl.people) {
      var person = scrawl.people[p];
      person.fullName = p;
      var names = p.split(' ');
      var lastName = names[names.length-1].toLowerCase();
      var fullLookupName = p.replace(' ', '_').toLowerCase();
      allPeople[lastName] = person;
      allPeople[fullLookupName] = person;

      if('alias' in person) {
        for(var alias of person.alias) {
          allPeople[alias.toLowerCase()] = person;
        }
      }
    }

    // extract all names from present list
    var ircLines = ircLog.split('\n');
    var presentList = [];
    for(var line of ircLines) {
      var match = commentRx.exec(line);
      if(match) {
        var time = match[1];
        var nick = match[2].toLowerCase().replace(/\(.*\)/g, '');
        var msg = match[3];
        if(msg.includes('present+')) {
          var names = [nick];
          names = names.concat(nick.split('_'));
          for(var i in names) {
            if(names[i].endsWith('_')) {
              names[i] = names[i].slice(0, names[i].length-1);
            }
          }
          presentList.push(names);
        }
      }
    }

    // create mappings from all names and aliases to person
    for(var names of presentList) {
      var lastName = names[names.length-1];
      var person = undefined;
      for(var name of names) {
         if(allPeople[name] !== undefined) {
           person = allPeople[name];
           break;
         }
      }
      if(person !== undefined) {
        // Add the aliases and names if they don't already exist in the aliases
        for(var name of names)
        {
          if(name.length > 2 && !(name in rval)) {
            rval[name] = person.fullName;
          }
        }
        var aliases = person.alias || [];
        for(var alias of aliases)
        {
          if(alias.length > 2 && !(alias in rval)) {
            rval[alias] = person.fullName;
          }
        }
      } else {
        console.log('Couldn\'t find alias for any of these names', names);
        console.log('Consider adding alias to people.json');
      }

    }

    return rval;
  };

  scrawl.htmlencode = function(text)
  {
    var modified = '';

    if(nodejs) {
      modified = entities.encodeNonUTF(text);
    } else {
      modified = text.replace(/[\"&<>]/g, function (a) {
        return { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' }[a];
      });
    }
    modified = modified.replace(urlRx, '<a href="$1">$1</a>');

    return modified;
  };

  scrawl.topic = function(msg, id, textMode)
  {
    var rval = '';

    if(textMode == 'html')
    {
      rval = '<h1 id="topic-' + id + '" class="topic">Topic: ' +
       scrawl.htmlencode(msg) + '</h1>\n';
    }
    else
    {
      rval = '\nTopic: ' + msg + '\n\n';
    }

    return rval;
  };

  scrawl.action = function(msg, id, textMode)
  {
    var rval = '';

    if(textMode == 'html')
    {
      rval = '<div id="action-' + id + '" class="action">ACTION: ' +
       scrawl.htmlencode(msg) + '</div>\n';
    }
    else
    {
      rval = '\n\n' + scrawl.wordwrap('ACTION: ' + msg, 65, '\n  ') + '\n\n';
    }

    return rval;
  };

  scrawl.information = function(msg, textMode)
  {
    var rval = '';

    if(textMode == 'html')
    {
      rval = '<div class="information">' +
       scrawl.htmlencode(msg) + '</div>\n';
    }
    else
    {
      rval = scrawl.wordwrap(msg, 65, '\n  ') + '\n';
    }

    return rval;
  };

  scrawl.proposal = function(msg, textMode)
  {
    var rval = '';

    if(textMode == 'html')
    {
      rval = '<div class="proposal"><strong>PROPOSAL:</strong> ' +
       scrawl.htmlencode(msg) + '</div>\n';
    }
    else
    {
      rval =
        '\n' + scrawl.wordwrap('PROPOSAL: ' + msg, 65, '\n  ') + '\n\n';
    }

    return rval;
  };

  scrawl.resolution = function(msg, id, textMode)
  {
    var rval = '';

    if(textMode == 'html')
    {
      rval = '<div id="resolution-' + id + '" class="resolution">' +
        '<strong>RESOLUTION:</strong> ' +
        scrawl.htmlencode(msg) + '</div>\n';
    }
    else
    {
      rval =
        '\n' + scrawl.wordwrap('RESOLUTION: ' + msg, 65, '\n  ') + '\n\n';
    }

    return rval;
  };

  scrawl.usecase = function(msg, textMode)
  {
    var rval = '';

    if(textMode == 'html')
    {
      rval = '<div id="usecase-' + scrawl.counter + '" class="resolution">' +
        '<strong>USE CASE:</strong> ' +
        scrawl.htmlencode(msg) + '</div>\n';
    }
    else
    {
      rval =
        '\n' + scrawl.wordwrap('USE CASE: ' + msg, 65, '\n  ') + '\n\n';
    }

    return rval;
  };

  scrawl.scribe = function(msg, textMode, person, assist)
  {
    var rval = '';

    // capitalize the first letter of the message if it doesn't start with http
    if(!(/^(\s)*https?:\/\//.test(msg))) {
      msg = msg.replace(/(\s)?([a-zA-Z])/, function(firstLetter) {
        return firstLetter.toUpperCase();
      });
    }

    if(textMode == 'html')
    {
      scrawl.counter += 1;
      rval = '<div onmouseout="$(\'#link-' + scrawl.counter + '\').hide()" ' +
        'onmouseover="$(\'#link-' + scrawl.counter + '\').show()" ' +
        'id="' + scrawl.counter + '" ';

      if(person != undefined)
      {
        rval += 'class="comment"><span class="name">' +
          scrawl.htmlencode(person) + '</span>: ';
      }
      else
      {
        rval += 'class="information">';
      }

      rval += scrawl.htmlencode(msg);

      if(assist != undefined)
      {
        rval += ' [scribe assist by ' + scrawl.htmlencode(assist) + ']';
      }

      rval += ' <a id="link-' + scrawl.counter +
        '" style="display:none;" href="#'+ scrawl.counter + '">✪</a></div>\n';
    }
    else
    {
      scribeline = '';
      if(person != undefined)
      {
        scribeline = person + ': ';
      }
      scribeline += msg;
      if(assist != undefined)
      {
        scribeline += ' [scribe assist by '+ assist + ']';
      }

      rval = scrawl.wordwrap(scribeline, 65, '\n  ') + '\n';
    }

    return rval;
  };

  scrawl.scribeContinuation = function(msg, textMode)
  {
    var rval = '';

    if(textMode == 'html')
    {
      rval = '<div class="comment-continuation">' +
       scrawl.htmlencode(msg) + '</div>\n';
    }
    else
    {
      rval = scrawl.wordwrap('  ' + msg, 65, '\n  ') + '\n';
    }

    return rval;
  }

  scrawl.present = function(context, person)
  {
    if(person != undefined)
    {
      context.present[person] = true;
    }
  };

  scrawl.error = function(msg, textMode)
  {
    var rval = '';

    if(textMode == 'html')
    {
      rval = '<div class="error">Error: ' +
        scrawl.htmlencode(msg) + '</div>\n';
    }
    else
    {
      rval = scrawl.wordwrap('\nError: ' + msg, 65, '\n  ') + '\n';
    }

    return rval;
  };

  scrawl.setHtmlHeader = function(header) {
    scrawl.htmlHeader = header;
  };

  scrawl.setHtmlFooter = function(footer) {
    scrawl.htmlFooter = footer;
  };

  scrawl.processLine = function(context, aliases, line, textMode)
  {
     var rval = '';
     var match = commentRx.exec(line);

     if(match)
     {
       var time = match[1];
       var nick = match[2].toLowerCase();
       var msg = match[3];

       // check for a scribe line
       if(msg.search(scribeRx) != -1)
       {
         var scribe;
         if(msg.includes('scribe+')) {
           scribe = nick;
         } else {
           scribe = msg.split(':')[1].replace(' ', '');
         }
         scribe = scribe.toLowerCase();
         context.scribenick = scribe;
         if(scribe in aliases)
         {
            if(!context.hasOwnProperty('scribe')) {
              context.scribe = [];
            }

            context.scribe.push(aliases[scribe]);
            scrawl.present(context, aliases[scribe]);
         }
         else
         {
            // If scribe name is not known just use alias
            context.scribe.push(scribe);
         }
         rval = scrawl.information(
          context.scribe[context.scribe.length-1] +
          ' is scribing.', textMode);
       }
       else if(msg.search(chairRx) != -1)
       {
         var chairs = msg.split(':')[1].split(',');

         context.chair = [];
         for(var i = 0; i < chairs.length; i++) {
           var chair = chairs[i].replace(' ', '').toLowerCase();
           if(chair in aliases)
           {
              context.chair.push(aliases[chair]);
              scrawl.present(context, aliases[chair]);
           }
         }
       }
       // check for meeting line
       else if(msg.search(meetingRx) != -1)
       {
         var meeting = msg.match(meetingRx)[1];
         context.group = meeting;
       }
       // check for present line
       else if(msg.search(presentRx) != -1)
       {
          var present = msg.match(presentRx)[1].toLowerCase();
          var people = present.split(',');
          if(msg.includes('present+')) {
            people = [nick];
          }

          // try to find the person by full name, last name, and then first name
          for(var i = 0; i < people.length; i++) {
            if (!people[i]) {
              scrawl.present(context, aliases[nick]);
            } else {
              var person = people[i].replace(/^\s/, '').replace(/\s$/, '');
              var lastName = person.split(' ')[1];
              if(lastName === undefined) {
                lastName = person.split('_')[1];
              }
              if(person in aliases) {
                scrawl.present(context, aliases[person]);
              } else if(lastName in aliases) {
                scrawl.present(context, aliases[lastName]);
              } else {
                if(msg.includes('present+')) {
                  scrawl.present(context, match[2].replace(/_/g, ' '));
                } else {
                  console.log('Could not find alias for', person);
                }
              }
            }
          }
       }
       // check for audio line
       else if(msg.search(audioRx) != -1)
       {
         context.audio = false;
       }
       // check for date line
       else if(msg.search(dateRx) != -1)
       {
         var date = msg.match(dateRx)[1];
         context.date = new Date(date);
       }
       // check for topic line
       else if(msg.search(topicRx) != -1)
       {
         var topic = msg.match(topicRx)[1];
         context.topics = context.topics.concat(topic);
         rval = scrawl.topic(topic, context.topics.length, textMode);
       }
       // check for action line
       else if(msg.search(actionRx) != -1)
       {
         var action = msg.match(actionRx)[1];
         context.actions = context.actions.concat(action);
         rval = scrawl.action(action, context.actions.length, textMode);
       }
       // check for Agenda line
       else if(msg.search(agendaRx) != -1)
       {
         var agenda = msg.match(agendaRx)[1];
         context.agenda = agenda;
       }
       // check for proposal line
       else if(msg.search(proposalRx) != -1)
       {
         var proposal = msg.split(':')[1];
         rval = scrawl.proposal(proposal, textMode);
       }
       // check for resolution line
       else if(msg.search(resolutionRx) != -1)
       {
         var resolution = msg.match(resolutionRx)[2];
         context.resolutions = context.resolutions.concat(resolution);
         rval = scrawl.resolution(
           resolution, context.resolutions.length, textMode);
       }
       // check for use case line
       else if(msg.search(useCaseRx) != -1)
       {
         var usecase = msg.match(useCaseRx)[2];
         rval = scrawl.usecase(usecase, textMode);
       }
       else if(msg.search(totalPresentRx) != -1)
       {
         context.totalPresent = msg.match(totalPresentRx)[1];
       }
       else if(nick.search(voipRx) != -1 || msg.search(toVoipRx) != -1 ||
         nick.search(rrsAgentRx) != -1 || msg.search(rrsAgentRx) != -1 )
       {
         // the line is from or is addressed to a channel bot, ignore it
       }
       else if(msg.search(queueRx) != -1)
       {
         // the line is queue management, ignore it
       }
       // the line is a +1/-1 vote
       else if(msg.search(voteRx) != -1)
       {
         if(nick in aliases)
         {
           rval = scrawl.scribe(msg, textMode, aliases[nick]);
           scrawl.present(context, aliases[nick]);
         }
       }
       // the line is by the scribe
       else if(nick == context.scribenick)
       {
         if(msg.indexOf('…') == 0 || msg.indexOf('...') == 0)
         {
           // the line is a scribe continuation
           rval = scrawl.scribeContinuation(msg, textMode);
         }
         else if(msg.indexOf(':') != -1)
         {
           var alias = msg.split(':', 1)[0].replace(' ', '').toLowerCase();

           if(alias in aliases)
           {
              // the line is a comment made by somebody else that was
              // scribed
              var cleanedMessage = msg.split(':').splice(1).join(':');

              scrawl.present(context, aliases[alias]);
              rval = scrawl.scribe(
                cleanedMessage, textMode, aliases[alias]);
           }
           else
           {
              // The scribe is noting something and there just happens
              // to be a colon in it
              rval = scrawl.scribe(msg, textMode);
           }
         }
         else
         {
           // The scribe is noting something
           rval = scrawl.scribe(msg, textMode);
         }
       }
       // the line is a comment by somebody else
       else if(nick != context.scribenick)
       {
         if(/^\S+:/.test(msg))
         {
           var alias = msg.split(':', 1)[0].replace(' ', '').toLowerCase();

           if(alias in aliases)
           {
              // the line is a scribe assist
              var cleanedMessage = msg.split(':').splice(1).join(':');

              scrawl.present(context, aliases[alias]);
              rval = scrawl.scribe(cleanedMessage, textMode,
                aliases[alias], aliases[nick]);
           }
           else if(alias.indexOf('http') == 0)
           {
             rval = scrawl.scribe(msg, textMode, aliases[nick]);
           }
           else if(aliases.hasOwnProperty(nick))
           {
             scrawl.present(context, aliases[nick]);
             rval = scrawl.scribe(msg, textMode, aliases[nick]);
           }
           else
           {
             rval = scrawl.information('<'+nick+'> '+msg, textMode);
             console.log('IRC nickname \'' + nick + '\' not recognized');
             context.unrecognized.add(nick);
           }
         }
         else
         {
           // the line is an IRC line by somebody else
           scrawl.present(context, aliases[nick]);
           rval = scrawl.information('<'+nick+'> '+msg, textMode);
         }
       }
       else
       {
         rval = scrawl.error('(Strange line format)' + line, textMode);
       }
     }

     return rval;
  };

  scrawl.generateSummary = function(context, textMode)
  {
    var rval = '';
    var time = context.date || new Date();
    var month = '' + (time.getMonth() + 1)
    var day = '' + time.getDate()
    var group = context.group;
    var agenda = context.agenda;
    var audio = 'audio.ogg';
    var chair = context.chair;
    var scribe = context.scribe.filter(function(item, i, arr) {
      return arr.indexOf(item) === i;
    });
    var topics = context.topics;
    var resolutions = context.resolutions;
    var actions = context.actions;
    var present = [];

    // build the list of people present
    for(var name in context.present) {
      var person = scrawl.people[name]
      if(person === undefined) {
        person = {
          homepage: 'https://w3c-ccg.github.io/'
        };
      }
      person['name'] = name;
      present.push(person)
    }

    // modify the time if it was specified
    if(context.date) {
      time = new Date(context.date)
      time.setHours(23);
      console.log(time);
    }

    // zero-pad the month and day if necessary
    if(month.length == 1)
    {
      month = '0' + month;
    }

    if(day.length == 1)
    {
      day = '0' + day;
    }

    // generate the summary text
    if(textMode == 'html')
    {
      rval += '<h1>' + group + '</h1>\n';
      rval += '<h2>Minutes for ' + time.getFullYear() + '-' +
         month + '-' + day +'</h2>\n';
      rval += '<div class="summary">\n<dl>\n';
      rval += '<dt>Agenda</dt><dd><a href="' +
         agenda + '">' + agenda + '</a></dd>\n';

      if(topics.length > 0)
      {
        rval += '<dt>Topics</dt><dd><ol>';
        for(i in topics)
        {
          var topicNumber = parseInt(i) + 1;
          rval += '<li><a href="#topic-' + topicNumber + '">' +
            topics[i] + '</a>';
        }
        rval += '</ol></dd>';
      }

      if(resolutions.length > 0)
      {
        rval += '<dt>Resolutions</dt><dd><ol>';
        for(i in resolutions)
        {
          var resolutionNumber = parseInt(i) + 1;
          rval += '<li><a href="#resolution-' + resolutionNumber + '">' +
            resolutions[i] + '</a>';
        }
        rval += '</ol></dd>';
      }

      if(actions.length > 0)
      {
        rval += '<dt>Action Items</dt><dd><ol>';
        for(i in actions)
        {
          var actionNumber = parseInt(i) + 1;
          rval += '<li><a href="#action-' + actionNumber + '">' +
            actions[i] + '</a>';
        }
        rval += '</ol></dd>';
      }

      // generate the list of people present
      var peoplePresent = ''
      for(var i = 0; i < present.length; i++) {
        var person = present[i];

        if(i > 0) {
          peoplePresent += ', ';
        }

        peoplePresent += '<a href="' + person.homepage + '">'+
          person.name + '</a>'
      }
      if(context.totalPresent) {
        peoplePresent += ', ' + context.totalPresent;
      }

      rval += '<dt>Organizer</dt><dd>' + chair.join(', ') + '</dd>\n';
      rval += '<dt>Scribe</dt><dd>' + scribe.join(', ') + '</dd>\n';
      rval += '<dt>Present</dt><dd>' + peoplePresent + '</dd>\n';

      if(context.audio) {
        rval += '<dt>Audio Log</dt><dd>' +
           '<div><a href="' + audio + '">' + audio + '</a></div>\n' +
           '<div><audio controls="controls" preload="none">\n' +
           '<source src="' + audio + '" type="audio/ogg" />' +
           'Warning: Your browser does not support the HTML5 audio element, ' +
           'please upgrade.</audio></div></dd>\n';
      }

      rval += '</dl>\n</div>\n';
    }
    else
    {
      // generate the list of people present
      var peoplePresent = ''
      for(var i = 0; i < present.length; i++) {
        var person = present[i];

        if(i > 0) {
          peoplePresent += ', ';
        }

        peoplePresent += person.name
      }
      if(context.totalPresent) {
        peoplePresent += ', ' + context.totalPresent;
      }

      rval += group;
      rval += ' Minutes for ' + time.getFullYear() + '-' +
         month + '-' + day + '\n\n';
      rval += 'Agenda:\n  ' + agenda + '\n';

      if(topics.length > 0)
      {
        rval += 'Topics:\n';
        for(i in topics)
        {
          var topicNumber = parseInt(i) + 1;
          rval += scrawl.wordwrap(
            '  ' + topicNumber + '. ' + topics[i], 65,
            '\n    ') + '\n';
        }
      }

      if(resolutions.length > 0)
      {
        rval += 'Resolutions:\n';
        for(i in resolutions)
        {
          var resolutionNumber = parseInt(i) + 1;
          rval += scrawl.wordwrap(
            '  ' + resolutionNumber + '. ' + resolutions[i], 65,
            '\n    ') + '\n';
        }
      }

      if(actions.length > 0)
      {
        rval += 'Action Items:\n';
        for(i in actions)
        {
          var actionNumber = parseInt(i) + 1;
          rval += scrawl.wordwrap(
            '  ' + actionNumber + '. ' + actions[i], 65,
            '\n    ') + '\n';
        }
      }

      rval += 'Organizer:\n  ' + chair.join(' and ') + '\n';
      rval += 'Scribe:\n  ' + scribe.join(' and ') + '\n';
      rval += 'Present:\n  ' +
        scrawl.wordwrap(peoplePresent, 65, '\n  ') + '\n';
      if(context.audio) {
        rval += 'Audio:\n  https://w3c-ccg.github.io/meetings/' +
          time.getFullYear() + '-' +
           month + '-' + day + '/audio.ogg\n\n';
      } else {
        rval += '\n';
      }
    }

    return rval;
  };

  scrawl.generateMinutes = function(ircLog, textMode, date)
  {
    var rval = '';
    var minutes = '';
    var summary = '';
    var ircLines = ircLog.split('\n');
    var aliases = scrawl.generateAliases(ircLog);
    scrawl.counter = 0;

    // initialize the IRC log scanning context
    var context =
    {
      'group': scrawl.group,
      'chair': scrawl.chair,
      'present': {},
      'scribe': [],
      'topics': [],
      'resolutions': [],
      'actions': [],
      'audio': true,
      'unrecognized': new Set()
    };

    if(date) {
      context.date = new Date(date);
      context.date.setHours(23);
      console.log(context.date);
    }

    // process each IRC log line
    for(var i = 0; i < ircLines.length; i++)
    {
      var line = ircLines[i];
      minutes += scrawl.processLine(context, aliases, line, textMode);
    }

    if(context.unrecognized.size > 0){
      console.log('WARNING: Unrecognized nicks - please add to people.json\n');
      context.unrecognized.forEach(function(value){
        console.log('\t'+value+'\n');
      });
    }

    // generate the meeting summary
    summary = scrawl.generateSummary(context, textMode);

    // fix spacing around proposals, actions, and resolutions
    minutes = minutes.replace(/\n\n\n/gm, '\n\n');

    // create the final log output
    rval = summary + minutes;

    return rval;
  }
})();
