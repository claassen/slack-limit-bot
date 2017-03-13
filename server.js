var express = require('express');
var app = express();
var slack = require('slack');
var bodyParser = require('body-parser');

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function cleanMessage(message) {
  //...

  return message;
}

var stfuUsers = {};

app.get('/', function (req, res) {
  // slack.chat.postMessage({
  //   token: process.env.SLACK_TOKEN,
  //   channel: 'test1234',
  //   text: 'Test'
  // }, function(err, data){
  //   console.log("postMessage data:")
  //   console.log(data);
  //   console.log("postMessage err:");
  //   console.log(err);
  // });

  res.send('OK');
});

app.post('/event', function(req, res) {
  console.log("Recieved event: ", req.body);

  if(req.body.challenge) {
    res.end(req.body.challenge);
    return;
  }

  var token = req.body.token; //TODO: validate

  var event = req.body.event;

  if(event.subtype === "message_changed") {
    console.log("ignoring message_changed event");

    res.end('OK');
    return;
  }

  var user = event.user;
  var channel = event.channel;
  var text = event.text;

  var stfuUser = stfuUsers[user];

  console.log("stfuUsers: ", stfuUsers);
  console.log("stfuUser: ", stfuUser);

  if(stfuUser && stfuUser.enabled) {
    var now = Date.now();

    var lastPostTime = stfuUser.lastPostTime;

    if(lastPostTime) {
      console.log("last post time is set");

      var diff = now - lastPost;

      if(stfuUser.currentRate) {
        console.log("current rate is set at: " + stfuUser.currentRate);

        var prevDenom = 1 / stfuUser.currentRate;

        var newDenom = prevDenom + diff;

        console.log("updating to: " + 2 / newDenom);

        stfuUser.currentRate = 2 / newDenom;
      }
      else {
        console.log("current rate is not set, setting to: " + 1/diff);

        stfuUser.currentRate = 1 / diff;
      }

      if(stfuUser.currentRate > 0.00003333333333) { //1/30 seconds
        console.log("rate exceeds limit, posting message");

        slack.chat.postMessage({
          token: process.env.SLACK_TOKEN,
          channel: channel,
          text: 'Please try to keep conversations short and to the point.'
        }, function(err, data){
          console.log("postMessage data:")
          console.log(data);
          console.log("postMessage err:");
          console.log(err);
        });
      }
    }

    stfuUser.lastPostTime = now;
  }

  res.end('OK');
});

app.post('/slash', function(req, res) {
  console.log("Recieved slash command", req.body);

  var token = req.body.token; //TODO: validate against token provided when adding slack command in Slack

  var command = req.body.command;
  var channelId = req.body.channel_id;
  var channelName = req.body.channel_name;
  var userId = req.body.user_id;
  var userName = req.body.user_name;
  var text = req.body.text;

  if(command === "/limit") {
    console.log("processing limit command");

    if(token != process.env.SLASH_LIMIT_COMMAND_TOKEN) {
      console.log("Rejecting slash command: Invalid token");

      res.end('INVALID TOKEN');
      return;
    }

    var stfuUserId = text.split("|")[0].replace("@", "").replace("<", "").replace(">", "");

    console.log("user id: " + stfuUserId);

    var stfuUser = stfuUsers[stfuUserId];

    if(stfuUser) {
      stfuUser.enabled = true;
    }
    else {
      stfuUsers[stfuUserId] = {
        enabled: true
      };
    }
  }
  else if(command === "/unlimit") {
    console.log("processing limit command");

    if(token != process.env.SLASH_UNLIMIT_COMMAND_TOKEN) {
      console.log("Rejecting slash command: Invalid token");

      res.end('INVALID TOKEN');
      return;
    }

    var stfuUserId = text.split("|")[0].replace("@", "").replace("<", "").replace(">", "");

    console.log("user id: " + stfuUserId);

    stfuUsers[stfuUserId] = undefined;
  }

  res.end('OK');
});

console.log("Listening at " + ip + " on port " + port);

app.listen(port, ip);
