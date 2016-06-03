var request = require('request');
var path = require('path');

var HomieConfig = function(homieUrl, options) {
  this.r = request;
  this.homieUrl = homieUrl;
  this.userAgent = (options && options.userAgent) ?  options.userAgent : 'HomieConfig Node.js';
};

// GET /heart
//
// This is useful to ensure we are connected to the device AP.
//
// Response
//
// 200 OK (application/json)
//
// { "heart": "beat" }
HomieConfig.prototype.getHeartBeat = function(callback) {
  var options = {
    method: 'GET',
    url: this.homieUrl + '/heart',
    json: true,
    headers: {
      'User-Agent': this.userAgent
    }
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('heart') && body.heart === 'beat') {
        callback(null, true);
      } else {
        callback(new Error(response.statusCode), false); // TODO: Change to http error
      }
  });
};

HomieConfig.prototype.getDeviceInfo = function(callback) {
  // GET /device-info
  //
  // Get some information on the device.
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
    url: this.homieUrl + '/device-info',
    json: true,
    headers: {
      'User-Agent': this.userAgent
    }
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body) {
        callback(null, body);
      } else {
        callback(new Error(response.statusCode), false); // TODO: Change to http error
      }
  });
};

HomieConfig.prototype.getNetworks = function(callback) {
  // GET /networks
  //
  // Retrieve the Wi-Fi networks the device can see.
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
    url: this.homieUrl + '/networks',
    json: true,
    headers: {
      'User-Agent': this.userAgent
    }
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('networks')) {
        callback(null, body);
      } else if (response.statusCode === 503 && body && body.hasOwnProperty('error')) {
        callback(new Error(body.error), false); // TODO: Change this to custom error type
      } else {
        callback(new Error(response.statusCode), false); // TODO: Change to http error
      }
  });
};

HomieConfig.prototype.generateConfig = function(device_name, device_id, wifi_ssid, wifi_password, mqtt_host, mqtt_options, ota) {
  var config = {
    "name": device_name,
    "device_id": device_id,
    "wifi": {
      "ssid": wifi_ssid,
      "password": wifi_password
    },
    "mqtt": {
      "host": mqtt_host,
      "port": mqtt.port ? mqtt.port : 1883,
      "mdns": mqtt.mdns,
      "base_topic": mqtt.base_topic ? mqtt.base_topic : 'devices/',
      "auth": mqtt.auth ? mqtt.auth : false,
      "username": mqtt.username,
      "password": mqtt.password,
      "ssl": mqtt.ssl ? mqtt.ssl : false,
      "fingerprint": mqtt.fingerprint
    },
    "ota": {
      "enabled": ota.enabled ? ota.enabled : false,
      "host": ota.host ? ota.host : mqtt.host,
      "port": ota.port ? ota.port : 80,
      "mdns": ota.mdns,
      "path": ota.path ? ota.path : '/ota',
      "ssl": ota.ssl ? ota.ssl : false,
      "fingerprint": ota.fingerprint
    }
  };

  return config;
};

HomieConfig.prototype.saveConfig = function(config, callback) {
  // PUT /config
  //
  // Save the config to the device.
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
    url: this.homieUrl + '/config',
    json: true,
    headers: {
      'User-Agent': this.userAgent
    }
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('success')) {
        callback(null, true);
      } else if (response.statusCode === 400 && body && body.hasOwnProperty('success') && body.hasOwnProperty('error')) {
          callback(new Error(body.error), false); // TODO: Change this to custom error type
      } else if (response.statusCode === 403 && body && body.hasOwnProperty('success') && body.hasOwnProperty('error')) {
          callback(new Error(body.error), false); // TODO: Change this to custom error type
      } else {
        callback(new Error(response.statusCode), false); // TODO: Change to http error
      }
  });
};

HomieConfig.prototype.connectToWifi = function(ssid, password, callback) {
  // POST /wifi-connect
  //
  // Initiates the connection of the device to the wifi network while in config mode. This request is not synchronous and the result (wifi connected or not) must be obtained by "/wifi-status".
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
    url: this.homieUrl + '/wifi-connect',
    form: {ssid: ssid, password: password},
    json: true,
    headers: {
      'User-Agent': this.userAgent
    }
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('success')) {
        callback(null, true);
      } else if (response.statusCode === 400 && body && body.hasOwnProperty('success') && body.hasOwnProperty('error')) {
          callback(new Error(body.error), false); // TODO: Change this to custom error type
      } else {
        callback(new Error(response.statusCode), false); // TODO: Change to http error
      }
  });
};

HomieConfig.prototype.getWifiStatus = function(callback) {
  // GET /wifi-status
  //
  // Returns the current wifi connection status.
  //
  // Helpful when monitoring Wifi connectivity after sending ssid/password and waiting for an answer.
  //
  // Request params
  //
  // None
  //
  // Response
  //
  // In case of success:
  // 200 OK (application/json)
  //
  // { "status": "[status of wifi connection]" }

  var options = {
    method: 'GET',
    url: this.homieUrl + '/wifi-status',
    json: true,
    headers: {
      'User-Agent': this.userAgent
    }
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('status')) {
        callback(null, body.status);
      } else {
        callback(new Error(response.statusCode), false); // TODO: Change to http error
      }
  });
};

HomieConfig.prototype.setTransparentWifiProxy = function(enabled, callback) {
  // POST /proxy-control
  //
  // Enable/disable the device to act as a transparent proxy between AP and Station networks.
  //
  // All requests that don't collide with existing api paths will be bridged to the destination according to the "Host" header in http. The destination host is called using the existing Wifi connection (Station Mode established after ssid/password is configured in "/wifi-connect") and all contents are bridged back to the connection made to the AP side.
  //
  // This feature can be used to help captive portals to perform cloud api calls during device enrollment using the esp wifi ap connection without having to patch the Homie firmware. By using the transparent proxy, all operations can be performed by the custom javascript running on the browser (/data/homie/ui_bundle.gz)
  //
  // https is not supported.
  //
  // Important: The http request and responses must be kept as small as possible because all contents are transported using ram memory, which is very limited.
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
    url: this.homieUrl + '/proxy-control',
    form: {'enable': enabled ? true : false},
    json: true,
    headers: {
      'User-Agent': this.userAgent
    }
  };

  this.r(options, function(err, response, body) {
      if (err) return callback(err);
      if (response.statusCode === 200 && body && body.hasOwnProperty('message')) {
        callback(null, body);
      } else {
        callback(new Error(response.statusCode), false); // TODO: Change to http error
      }
  });
};

module.exports = HomieConfig;
