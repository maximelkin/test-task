module.exports.dbUrl = process.env.DATABASE_URL;
module.exports.appPort = process.env.API_PORT;
module.exports.isTesting = process.env.TESTING === 'true';