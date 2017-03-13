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
  }

  var token = req.body.token; //TODO: validate

  var event = req.body.event;

  var user = event.user;
  var channel = event.channel;
  var ts = event.ts;
  var text = event.text;

  var stfuUser = stfuUsers[user];

  if(stfuUser && stfuUser.enabled) {
    var now = Date.now();

    var lastPostTime = stfuUser.lastPostTime;

    if(lastPostTime) {
      var diff = now - lastPost;

      if(stfuUser.currentRate) {
        var prevDenom = 1 / stfuUser.currentRate;

        var newDenom = prevDenom + diff;

        stfuUser.currentRate = 2 / newDenom;
      }
      else {
        stfuUser.currentRate = 1 / diff;
      }

      if(stfuUser.currentRate > 0.00003333333333) { //1/30 seconds
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

  var command = req.body.command;
  var token = req.body.token; //TODO: validate against token provided when adding slack command in Slack
  var channelId = req.body.channel_id;
  var channelName = req.body.channel_name;
  var userId = req.body.user_id;
  var userName = req.body.user_name;
  var text = req.body.text;

  if(command === "/limit") {
    var stfuUserId = text.replace("<", "").replace(">", "");

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
    var stfuUserId = text.replace("<", "").replace(">", "");

    var stfuUser = stfuUsers[stfuUserId];

    if(stfuUser) {
      stfuUser.enabled = false;
    }
  }

  res.end('OK');
});

console.log("Listening at " + ip + " on port " + port);

app.listen(port, ip);
