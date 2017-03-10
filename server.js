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

  slack.oauth.access({
    client_id: '10625403026.152416984450',
    client_secret: '83521f96743d37688dfd0447ebf8604f'
  }, function(err, data) {
    console.log("oauth err:");
    console.log(err);

    slack.api.postMessage({
      token: data.access_token, //'xoxb-152443448708-k1oT6hddw4U9LMveYGR9DZSh'
      channel: 'test1234'
      text: 'Test'
    }, function(err, data){
      console.log("postMessage err:");
      console.log(err);
    });
  });


  // slack.chat.update({
  //   token: 'xoxb-152443448708-k1oT6hddw4U9LMveYGR9DZSh',
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
