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

  // slack.chat.update({
  //   token: '...',
  //   ts: req.ts,
  //   channel: req.channel,
  //   text: cleanMessage(req.text),
  //   as_user: true
  // }, function(err, data){
  //
  // });

  res.send('OK');
})

app.listen(port, ip);
