# HomieConfig

HomieConfig is a node.js module to configure esp8266 boards loaded with [Homie firmware]().

It seems the only options are a web-based interface or an Android app. I wasn't very happy with this so I created a node.js module so I could configure one or more boards easily.

# QuickStart

`npm install --save homieconfig`

```objective-c
var HomieConfig = require('homie');

var homie = new HomieConfig('192.168.1.1');

homie.getHeartBeatAsync()
  .then(function(isAlive) {
    if (!isAlive) {
      console.log("Oh no, we don't have a heartbeat! Please check the server url " + this.baseUrl);
    }
    return homie.getDeviceInfoAsync();
  }).then(function(deviceInfo) {
    console.log('Device Info', deviceInfo);
  }).catch(function (error) {
    console.log('error',error);
  });
```

## Contributing

Feel free to submit any pull requests or add functionality, I'm usually pretty responsive.

You can contact me at andy@savage.hk

If you like the module, please send me some bitcoin!
