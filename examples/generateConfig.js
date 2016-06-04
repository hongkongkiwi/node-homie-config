var HomieConfig = require('../index.js');

var homie = new HomieConfig();

var device_name = "Example Device Name", // We can set this,
    //device_name = null, // Or if null a default one will be set
    device_id = "somedevice-id", // We can set this,
    //device_id = null, // Or if null a random one will be generated
    wifi_ssid = "TEST SSID NAME", // We can pass this if we want
    //wifi_ssid = null, // Or just pass null to detect current SSID from this computer
    wifi_password = "SOMEWIFIPASSWORD",
    mqtt_host = "mqtthostname",
    mqtt_options = null, // Pass null if you don't want to set more options
    ota = null; // Pass null if you don't want to set these options

var config = homie.generateConfig(device_name,
                    device_id,
                    wifi_ssid,
                    wifi_password,
                    mqtt_host,
                    mqtt_options,
                    ota)
    .then(function(config) {
        // This config can be passed to saveConfig function
        console.log(config);
    });
