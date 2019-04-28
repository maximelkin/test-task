const env = require('./src/env');
const Database = require("./src/database");
const booksStore = require('./src/books/store');

async function bootstrap() {
    console.log('Starting script for adding tables');
    const db = new Database();
    try {
        await db.connect(env.dbUrl);
        await booksStore(db).createTable();
        console.log('Tables added successfully!');
    } catch (err) {
        console.error(err);
    } finally {
        await db.stop();
    }
}

bootstrap()
    .catch(console.error);