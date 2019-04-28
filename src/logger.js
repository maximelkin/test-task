const env = require("./env");

module.exports.log = function (...args) {
    if (env.isTesting) {
        console.log(...args);
    }
}