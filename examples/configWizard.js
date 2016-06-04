var HomieConfig = require('../index.js');
var readlineSync = require('readline-sync');
var _ = require('underscore');
var Promise = require('bluebird');
var SimpleJsonStore = require('simple-json-store');
var network = require('network');
var configSettingsFile = './configSettings.json';
var store = new SimpleJsonStore(configSettingsFile, {});

var homie;

console.log('Checking if board is alive...');

var getGatewayIpAsync = Promise.promisify(network.get_gateway_ip);

var p = getGatewayIpAsync().then(function(ip) {
        var homie_ip = readlineSync.question('Enter Homie IP [' + ip + ']: ', {defaultInput: ip});
        homie = new HomieConfig({url: homie_ip, promise: Promise});
        return homie.getHeartBeatAsync();
    }).then(function() {
        console.log('-> Homie Board is alive');
        console.log('-> Getting Board Info');
        return homie.getDeviceInfoAsync();
    }).then(function(deviceInfo) {
        var config = store.get('config') ? store.get('config') : {};
        if (!config.device_id) {
            config.device_id = 'Homie-' + deviceInfo.device_id;
        }
        store.set('config', config);
        console.log('-> Scanning wifi networks using Homie board');
        return homie.getNetworksAsync();
    }).then(function(networks) {
        networks = _.map(networks.networks, function(network) {
                return network.ssid;
            });
        var config = store.get('config');
        if (config && config.wifi && config.wifi.ssid) {
            if (readlineSync.keyInYN('Use Wifi Network \"' + config.wifi.ssid + '\"?')) {
                return config.wifi.ssid;
            }
        }
        ssidIndex = readlineSync.keyInSelect(networks, 'Please select a wifi network?', {cancel: 'EXIT CONFIG WIZARD'});
        if (ssidIndex === -1) {
            console.log('User Quit Wizard!');
            return p.cancel();
        }
        return networks[ssidIndex];
    }).then(function(network_ssid) {
        var config = store.get('config') ? store.get('config') : {};
        var def = (config && config.wifi && config.wifi.password) ? ' [HIDDEN]' : '';
        var wifi_password = readlineSync.question('Password for \"' + network_ssid + '\"' + def + ': ', {hideEchoBack: true, defaultInput: (config && config.wifi && config.wifi.password) ? config.wifi.password : ''});
        def = (config && config.name) ? ' [' + config.name + ']' : '';
        var device_name = readlineSync.question('Homie Device Name' + def + ': ', {defaultInput: config.name || ''});
        def = (config && config.device_id) ? ' [' + config.device_id + ']' : '';
        var device_id = readlineSync.question('Homie Device ID' + def +': ', {defaultInput: config.device_id || ''});
        def = (config && config.mqtt && config.mqtt.host) ? ' [' + config.mqtt.host + ']' : '';
        var mqtt_host = readlineSync.question('MQTT Hostname' + def + ': ', {defaultInput: (config && config.mqtt && config.mqtt.host) ? config.mqtt.host : ''});
        var mqtt = null;
        var ota = null;
        if (readlineSync.keyInYN('Does MQTT require authentication?')) {
            // Ask some more authentication questions
            var mqtt_username = readlineSync.question('MQTT Username: ');
            var mqtt_password = readlineSync.question('MQTT Username: ');
            mqtt = {
                auth: true,
                username: mqtt_username,
                password: mqtt_password
            };
        }
        if (readlineSync.keyInYN('Enable OTA functions?')) {
            // Ask some more authentication questions
            ota = {
                enabled: true
            };
        }
        return homie.generateConfig(device_name,
                            device_id,
                            network_ssid,
                            wifi_password,
                            mqtt_host,
                            mqtt,
                            ota);
    }).then(function(config) {
        // This config can be passed to saveConfig function
        store.set('config', config);
        console.log('-> Generated JSON Config & Saved to ' + configSettingsFile);
        return config;
    }).then(function(config) {
        console.log(config);
    }).catch(function(err) {
        if (err.code === 'ETIMEDOUT') {
            console.log('Failed! Timeout Connecting to Board. Are you connected to the AP?');
        } else if (err.code === '') {
            console.log('');
        } else {
            console.log('There was an error during the wizard', err);
        }
        process.exit(1);
    });
