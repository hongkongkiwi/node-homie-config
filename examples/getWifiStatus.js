var HomieConfig = require('../index.js');

var homie = new HomieConfig();

homie.getHeartBeatAsync()
  .then(function(isAlive) {
    if (!isAlive) {
      console.log("Oh no, we don't have a heartbeat! Please check the server url " + this.baseUrl);
    }
    return homie.getWifiStatusAsync();
  }).then(function(status) {
    console.log('Wifi Status', status);
  }, function(reason) {
    console.log('failed!', reason);
  }).catch(function (error) {
      console.log('general error',error);
  });
