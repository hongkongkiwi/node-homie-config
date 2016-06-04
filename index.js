var request = require('request'),
    Promise = require('bluebird'),
    _ = require('underscore'),
    createError = require('http-errors'),
    detectSSid = require('./lib/detect-ssid'),
    randomID = require('./lib/random-id');

Promise.config({cancellation: true});

// Errors
var HeartBeatError = require('./lib/HeartBeatError'),
    InvalidArgumentError = require('./lib/InvalidArgumentError');

/*
* Constructure method fwhich takes an optional homieUrl and some options
*/
var HomieConfig = function(options) {
  this.options = _.extendOwn({
    url: 'homie.local',
    userAgent: 'HomieConfig Node.js',
    requestTimeout: 2000,
    promise: Promise
  }, options);

  if (this.options.url.substring(0,7) !== 'http://') {
    this.options.url = 'http://' + this.options.url;
  }

  var defaults = {
      json: true,
      timeout: this.options.requestTimeout,
      headers: {
        'User-Agent': this.options.userAgent
      },
      baseUrl: this.options.url
    };

  if (this.options.hasOwnProperty('proxy') && this.options.proxy) {
    defaults.proxy = this.options.proxy;
  }

  this.r = request.defaults(defaults);

  this.getHeartBeatAsync = this.options.promise.promisify(this.getHeartBeat);
  this.getDeviceInfoAsync = this.options.promise.promisify(this.getDeviceInfo);
  this.getNetworksAsync = this.options.promise.promisify(this.getNetworks);
  this.saveConfigAsync = this.options.promise.promisify(this.saveConfig);
  this.getWifiStatusAsync = this.options.promise.promisify(this.getWifiStatus);
  this.setTransparentWifiProxyAsync = this.options.promise.promisify(this.setTransparentWifiProxy);
  this.generateConfig = this.options.promise.promisify(this.generateConfig);
};

/*
* This is useful to ensure we are connected to the device AP.
*/
HomieConfig.prototype.getHeartBeat = function(callback) {
  // GET /heart
  //
  // Response
  //
  // 200 OK (application/json)
  //
  // { "heart": "beat" }

  var options = {
    method: 'GET',
    url: '/heart',
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('heart') && body.heart === 'beat') {
        return callback(null, true);
      } else if (response.statusCode === 404) {
        callback(new HeartBeatError('Detected wrong heartbeat!'));
      } else {
        callback(createError(response.statusCode, 'blah'), false);
      }
  });
};

/*
* Get some information on the device.
*/
HomieConfig.prototype.getDeviceInfo = function(callback) {
  // GET /device-info
  //
  // Response
  //
  // 200 OK (application/json)
  //
  // {
  //   "device_id": "52a8fa5d",
  //   "homie_version": "1.0.0",
  //   "firmware": {
  //     "name": "awesome-device",
  //     "version": "1.0.0"
  //   },
  //   "nodes": [
  //     {
  //       "id": "light",
  //       "type": "light"
  //     }
  //   ]
  // }

  var options = {
    method: 'GET',
    url: '/device-info',
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body) {
        callback(null, body);
      } else {
        callback(createError(response.statusCode), null);
      }
  });
};

/*
* Retrieve the Wi-Fi networks the device can see.
*/
HomieConfig.prototype.getNetworks = function(callback) {
  // GET /networks
  //
  // Response
  //
  // In case of success:
  // 200 OK (application/json)
  //
  // {
  //   "networks": [
  //     { "ssid": "Network_2", "rssi": -82, "encryption": "wep" },
  //     { "ssid": "Network_1", "rssi": -57, "encryption": "wpa" },
  //     { "ssid": "Network_3", "rssi": -65, "encryption": "wpa2" },
  //     { "ssid": "Network_5", "rssi": -94, "encryption": "none" },
  //     { "ssid": "Network_4", "rssi": -89, "encryption": "auto" }
  //   ]
  // }
  // In case the initial Wi-Fi scan is not finished on the device:
  // 503 Service Unavailable (application/json)
  //
  // {"error": "Initial Wi-Fi scan not finished yet"}

  var options = {
    method: 'GET',
    url: '/networks',
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('networks')) {
        callback(null, body);
      } else if (response.statusCode === 503 && body && body.hasOwnProperty('error')) {
        callback(createError(503, body.error), false); // TODO: Change this to custom error type
      } else {
        callback(createError(response.statusCode), null);
      }
  });
};

/*
* Helpful synchronous method to generate a config object.
*/
HomieConfig.prototype.generateConfig = function(device_name, device_id, wifi_ssid, wifi_password, mqtt_host, mqtt_options, ota, callback) {
  if (!wifi_password) throw new InvalidArgumentError('wifi_password is empty');
  if (!mqtt_host) throw new InvalidArgumentError('mqtt_host is empty');

  var config = {
    "name": device_name,
    "device_id": device_id,
    "wifi": {
      "ssid": wifi_ssid,
      "password": wifi_password
    },
    "mqtt": {
      "host": mqtt_host,
      "port": mqtt_options && mqtt_options.port ? mqtt_options.port : 1883,
      "mdns": mqtt_options && mqtt_options.mdns ? mqtt_options.mdns : null,
      "base_topic": mqtt_options && mqtt_options.base_topic ? mqtt_options.base_topic : 'devices/',
      "auth": mqtt_options && mqtt_options.auth ? mqtt_options.auth : false,
      "username": mqtt_options && mqtt_options.username ? mqtt_options.username : null,
      "password": mqtt_options && mqtt_options.password ? mqtt_options.password : null,
      "ssl": mqtt_options && mqtt_options.ssl ? mqtt_options.ssl : false,
      "fingerprint": mqtt_options && mqtt_options.fingerprint ? mqtt_options.fingerprint : null
    },
    "ota": {
      "enabled": ota && ota.enabled ? ota.enabled : false,
      "host": ota && ota.host ? ota.host : mqtt_host,
      "port": ota && ota.port ? ota.port : 80,
      "mdns": ota && ota.mdns ? ota.mdnds : null,
      "path": ota && ota.path ? ota.path : '/ota',
      "ssl": ota && ota.ssl ? ota.ssl : false,
      "fingerprint": ota && ota.fingerprint ? ota.fingerprint : null
    }
  };

  delete_null_properties(config, true);
  if (!config.hasOwnProperty('name')) {
    config.device_name = 'Homie Device';
  }
  if (!config.hasOwnProperty('device_id')) {
    config.device_id = 'Homie-' + randomID(8, 'a0');
  }
  if (config.wifi.hasOwnProperty('ssid')) {
    return callback(null, config);
  } else {
    detectSSid(function(err, ssidname) {
      if (err) return callback(err);
      config.wifi.ssid = ssidname;
      callback(err, config);
    });
  }
};

/*
* Save the config to the device.
*/
HomieConfig.prototype.saveConfig = function(config, callback) {
  // PUT /config
  //
  // Request body
  //
  // (application/json)
  //
  // See JSON configuration file.
  //
  // Response
  //
  // In case of success:
  // 200 OK (application/json)
  //
  // { "success": true }
  // In case of error in the payload:
  // 400 Bad Request (application/json)
  //
  // { "success": false, "error": "Reason why the payload is invalid" }
  // In case the device already received a valid configuration and is waiting for reboot:
  // 403 Forbidden (application/json)
  //
  // { "success": false, "error": "Device already configured" }

  var options = {
    method: 'PUT',
    url: '/config',
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('success')) {
        callback(null, true);
      } else if (response.statusCode === 400 && body && body.hasOwnProperty('success') && body.hasOwnProperty('error')) {
        callback(createError(400, body.error), false); // TODO: Change this to custom error type
      } else if (response.statusCode === 403 && body && body.hasOwnProperty('success') && body.hasOwnProperty('error')) {
        callback(createError(403, body.error), false); // TODO: Change this to custom error type
      } else {
        callback(createError(response.statusCode), false);
      }
  });
};

/*
* Initiates the connection of the device to the wifi network while in config mode. This request is not synchronous and the result (wifi connected or not) must be obtained by "/wifi-status".
*/
HomieConfig.prototype.connectToWifi = function(ssid, password, callback) {
  // POST /wifi-connect
  //
  // Request params
  //
  // ssid - wifi ssid network name
  // password - wifi password
  //
  // Response
  //
  // In case of success:
  // 202 Accepted (application/json)
  //
  // { "success": true }
  // In case of error in the payload:
  // 400 Bad Request (application/json)
  //
  // { "success": false, "error": "[Reason why the payload is invalid]" }

  var options = {
    method: 'POST',
    url: '/wifi-connect',
    form: {ssid: ssid, password: password},
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('success')) {
        callback(null, true);
      } else if (response.statusCode === 400 && body && body.hasOwnProperty('success') && body.hasOwnProperty('error')) {
        callback(createError(400, body.error), false); // TODO: Change this to custom error type
      } else {
        callback(createError(response.statusCode), false);
      }
  });
};

/*
* Returns the current wifi connection status.
* Helpful when monitoring Wifi connectivity after sending ssid/password and waiting for an answer.
*/
HomieConfig.prototype.getWifiStatus = function(callback) {
  // GET /wifi-status
  //
  // Response
  //
  // In case of success:
  // 200 OK (application/json)
  //
  // { "status": "[status of wifi connection]" }

  var options = {
    method: 'GET',
    url: '/wifi-status',
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('status')) {
        callback(null, body.status);
      } else {
        callback(createError(response.statusCode), null);
      }
  });
};

/*
* Enable/disable the device to act as a transparent proxy between AP and Station networks.
*
* All requests that don't collide with existing api paths will be bridged to the destination according to the "Host" header in http. The destination host is called using the existing Wifi connection (Station Mode established after ssid/password is configured in "/wifi-connect") and all contents are bridged back to the connection made to the AP side.
*
* This feature can be used to help captive portals to perform cloud api calls during device enrollment using the esp wifi ap connection without having to patch the Homie firmware. By using the transparent proxy, all operations can be performed by the custom javascript running on the browser (/data/homie/ui_bundle.gz)
* https is not supported.
*
* Important: The http request and responses must be kept as small as possible because all contents are transported using ram memory, which is very limited.
*/
HomieConfig.prototype.setTransparentWifiProxy = function(enabled, callback) {
  // POST /proxy-control
  //
  // Request params
  //
  // enable - true or false indicating if the device has to bridge all unknown requests to the Internet (transparent proxy activated) or not.
  //
  // Response
  //
  // In case of success:
  // 200 OK (application/json)
  //
  // { "message": "[proxy-enabled|proxy-disabled]" }

  var options = {
    method: 'POST',
    url: '/proxy-control',
    form: {'enable': enabled ? true : false},
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('message')) {
        callback(null, body.message);
      } else {
        callback(createError(response.statusCode), null);
      }
  });
};

/**
 * Delete all null (or undefined) properties from an object.
 * Set 'recurse' to true if you also want to delete properties in nested objects.
 */
function delete_null_properties(test, recurse) {
    for (var i in test) {
        if (test[i] === null) {
            delete test[i];
        } else if (recurse && typeof test[i] === 'object') {
            delete_null_properties(test[i], recurse);
        }
    }
}

module.exports = HomieConfig;
