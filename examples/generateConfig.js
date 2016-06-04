var HomieConfig = require('../index.js');

var homie = new HomieConfig();

var device_name = "Example Device Name",
    device_id = "somedevice-id",
    wifi_ssid = "TEST SSID NAME",
    wifi_password = "SOMEWIFIPASSWORD",
    mqtt_host = "mqtthostname",
    mqtt_options = null,
    ota = null;

var config = homie.generateConfig(device_name,
                    device_id,
                    wifi_ssid,
                    wifi_password,
                    mqtt_host,
                    mqtt_options,
                    ota);

console.log(config);
