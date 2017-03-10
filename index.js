var express = require('express')
var app = express()
var slack = require('slack')

function cleanMessage(message) {
  //...

  return message;
}

app.get('/', function (req, res) {
  
  slack.chat.update({
    token: '...',
    ts: req.ts,
    channel: req.channel,
    text: cleanMessage(req.text),
    as_user: true
  }, function(err, data){

  });

  res.send('OK');
})

app.listen(80, function () {
  console.log('Example app listening on port 3000!');
})
