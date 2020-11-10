const wireless = require("../../../utils/wireless");
const WifiConfigurationCapability = require("../../../core/capabilities/WifiConfigurationCapability");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");

class RoborockWifiConfigurationCapability extends WifiConfigurationCapability {
    /**
     * @returns {Promise<ValetudoWifiConfiguration>}
     */
    async getWifiConfiguration() {
        const output = {
            details: {
                state: ValetudoWifiConfiguration.STATE.UNKNOWN
            }
        };

        if (this.robot.config.get("embedded") === true) {
            return wireless.getEmbeddedWirelessConfiguration("wlan0");
        } else {
            let res = await this.robot.sendCommand("get_network_info");

            if (res !== "unknown_method") {
                if (typeof res === "object" && res.bssid !== "") {
                    output.details.state = ValetudoWifiConfiguration.STATE.CONNECTED;

                    output.details.signal = parseInt(res.rssi);
                    output.details.ips = [res.ip];
                    output.ssid = res.ssid;
                    output.details.frequency = ValetudoWifiConfiguration.FREQUENCY_TYPE.W2_4Ghz;
                } else {
                    output.details.state = ValetudoWifiConfiguration.STATE.NOT_CONNECTED;
                }
            }
        }

        return new ValetudoWifiConfiguration(output);
    }

    /**
     * @param {import("../../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     */
    async setWifiConfiguration(wifiConfig) {
        if (
            wifiConfig && wifiConfig.ssid && wifiConfig.credentials &&
            wifiConfig.credentials.type === ValetudoWifiConfiguration.CREDENTIALS_TYPE.WPA2_PSK &&
            wifiConfig.credentials.typeSpecificSettings && wifiConfig.credentials.typeSpecificSettings.password
        ) {
            await this.robot.sendCommand("miIO.config_router", {
                "ssid": wifiConfig.ssid,
                "passwd": wifiConfig.credentials.typeSpecificSettings.password,
                "uid": 0
            }, {});
        } else {
            throw new Error("Invalid wifiConfig");
        }
    }
}

module.exports = RoborockWifiConfigurationCapability;