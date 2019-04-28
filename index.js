const Database = require("./src/database");
const RestApi = require("./src/rest.api");
const env = require('./src/env');
const initializeBooks = require('./src/books/index');

const db = new Database();
const restApi = new RestApi();

if (!env.dbUrl || !env.appPort) {
    console.error('env not filled');
    process.exit(-1);
}
db.connect(env.dbUrl)
    .then(() => {
        console.log('connected to db!');

        initializeBooks(db, restApi);

        restApi.start(env.appPort);

        async function stop() {
            console.log('RECEIVED SIGINT, stopping...');
            try {
                await restApi.stop();
            } finally {
                await db.stop();
            }
        }

        process.on('SIGTERM', stop);
        process.on('SIGINT', stop);
    })
    .catch(error => {
        console.error(error);
        process.exit(-1);
    });


