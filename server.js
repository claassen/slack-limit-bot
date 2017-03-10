var express = require('express')
var app = express()
var slack = require('slack')

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

function cleanMessage(message) {
  //...

  return message;
}

app.get('/', function (req, res) {

  slack.api.chat.postMessage({
    token: process.env.SLACK_TOKEN,
    channel: 'test1234',
    text: 'Test'
  }, function(err, data){
    console.log("postMessage err:");
    console.log(err);
  });

  res.send('OK');
})

app.listen(port, ip);
