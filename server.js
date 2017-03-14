var express = require('express');
var app = express();
var slack = require('slack');
var bodyParser = require('body-parser');

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var userLimits = {};

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

  var userId = event.user;
  var channel = event.channel;
  var ts = event.ts;
  var text = event.text;

  var userLimit = userLimits[userId];

  console.log("userLimits: ", userLimits);
  console.log("userLimit: ", userLimit);

  if(userLimit) {
    var now = Date.now();

    var lastPostTime = userLimit.lastPostTime;

    if(lastPostTime) {
      var diff = now - lastPostTime;

      if(userLimit.currentRate) {
        console.log("current rate is set at: " + userLimit.currentRate);

        var prevDenom = Math.max(1 / userLimit.currentRate, userLimit.limitWindow);
        var newDenom = prevDenom + diff;

        console.log("updating to: " + 2 / newDenom);

        userLimit.currentRate = 2 / newDenom;
      }
      else {
        console.log("current rate is not set, setting to: " + 1 / diff);

        userLimit.currentRate = 2 / (diff + userLimit.limitWindow);
      }

      if(userLimit.currentRate > userLimit.limit) {
        console.log("rate exceeds limit");

        if(userLimit.warned) {
          slack.chat.delete({
            token: process.env.SLACK_TOKEN,
            ts: ts,
            channel: channel
          }, function(err, data){
            if(err) {
              console.log("Error: ", err);
            }
          });
        }
        else {
          slack.chat.postMessage({
            token: process.env.SLACK_TOKEN,
            channel: channel,
            text: '@' + userLimit.userName + ' Please try to keep conversations short and to the point. This message is a warning, further messages which exceed the message posting rate limit will be deleted!'
          }, function(err, data){
            if(err) {
              console.log("Error: ", err);
            }
          });
        }

        userLimit.warned = true;
      }
      else {
        userLimit.warned = false;
      }
    }

    userLimit.lastPostTime = now;
  }

  res.end('OK');
});

app.post('/slash', function(req, res) {
  console.log("Recieved slash command", req.body);

  var token = req.body.token;

  var command = req.body.command;
  var channelId = req.body.channel_id;
  var channelName = req.body.channel_name;
  var userId = req.body.user_id;
  var userName = req.body.user_name;
  var text = req.body.text;

  var requestParams = text.split(" ");

  if(command === "/limit") {
    console.log("processing limit command");

    if(requestParams.length != 3) {
      res.end("Usage: /limit @user <limit> <window>");
      return;
    }

    if(token != process.env.SLASH_LIMIT_COMMAND_TOKEN) {
      console.log("Rejecting slash command: Invalid token");

      res.end('INVALID TOKEN');
      return;
    }

    var limitUserId = requestParams[0].split("|")[0].replace("@", "").replace("<", "");
    var limitUserName = requestParams[0].split("|")[1].replace(">", "");

    //Minimum number of seconds per message limit. i.e. If limit is 30, the user will be limited to 1 message every 30 seconds.
    var limit = requestParams[1].trim();

    //Window of time limit is averaged over
    var limitWindow = requestParams[2].trim();

    console.log("user id: " + limitUserId);
    console.log("limit to: 1 message/" + limit + " seconds");

    userLimits[limitUserId] = {
      enabled: true,
      limit: 1 / (limit * 1000),
      limitWindow: 1 / (limitWindow * 1000),
      userName: limitUserName
    };
  }
  else if(command === "/unlimit") {
    console.log("processing unlimit command");

    if(token != process.env.SLASH_UNLIMIT_COMMAND_TOKEN) {
      console.log("Rejecting slash command: Invalid token");

      res.end('INVALID TOKEN');
      return;
    }

    var limitUserId = text.split("|")[0].replace("@", "").replace("<", "").replace(">", "");

    console.log("user id: " + limitUserId);

    userLimits[limitUserId] = undefined;
  }

  res.end('OK');
});

console.log("Listening at " + ip + " on port " + port);

app.listen(port, ip);
