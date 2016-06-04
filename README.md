# HomieConfig

HomieConfig is a node.js module to configure esp8266 boards loaded with [Homie firmware](https://github.com/marvinroger/homie-esp8266).

It seems the only options are a web-based interface or an Android app. I wasn't very happy with this so I created a node.js module so I could configure one or more boards easily.

## QuickStart

You can grab homie-config from npm.

`npm install --save homie-config`

Make sure to set an ip address or hostname for the board. By default, homie.local is used in case you don't pass anything.

```javascript
var HomieConfig = require('homie-config');

var homie = new HomieConfig();
```

If you want to set the url you can do it this way:

`var homie = new HomieConfig({url: 'homie.local'});`

Traditional Callbacks

```javascript
// You can choose to use traditional callbacks
homie.getHeartBeat(function(isAlive) {
  if (!isAlive) {
    return console.log("Oh no, we don't have a heartbeat!");
  }
  console.log("We have a heartbeat!");
});
```

Promises are also supported by attaching (async) to method names

```javascript
homie.getHeartBeatAsync()
  .then(function(isAlive) {
    if (!isAlive) {
      console.log("Oh no, we don't have a heartbeat! Please check the server url " + this.baseUrl);
    }
    console.log("We have a heartbeat!");
  }).catch(function (error) {
    console.log('error',error);
  });
```

You can chain up the methods easily using promises. I recommend you always use getHeartBeat before otehr methods.

```javascript
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

## Supported Methods

The library supports all [current Configuration API functions](https://github.com/marvinroger/homie-esp8266/blob/master/docs/6.-Configuration-API.md).

### Static Methods

These can be called without creating an object instance.

* getGatewayIp(callback)
* generateConfig(device_name, device_id, wifi_ssid, wifi_password, mqtt_host, mqtt_options, ota, callback)

### Instance Methods

These require the board to be accessable.

* getHeartBeat(callback)
* getDeviceInfo(callback)
* getNetworks(callback)
* saveConfig(config, callback)
* connectToWifi(ssid, password, callback)
* getWifiStatus(callback)
* setTransparentWifiProxy(enable, callback)

## Contributing

Feel free to submit any pull requests or add functionality, I'm usually pretty responsive.

If you like the module, please consider donating some bitcoin or litecoin.

![BTC QR Code](http://i.imgur.com/9rsCfv5.png?1)

__BTC:__ 1DJsQhquTjUakES5Pddh94t1XSMb7LDYyh

![LTC QR Code](http://i.imgur.com/yF1RoHp.png?1)

__LTC:__ LNzdZksXcCF6qXbuiQpHPQ7LUeHuWa8dDW
