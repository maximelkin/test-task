const env = require('./src/env');
const Database = require("./src/database");
const booksStore = require('./src/books/store');
const promisify = require("util").promisify;

async function concurrentExecute(parallel, totalTasks, taskFactory) {
    let firstUndone = 0;
    const workers = [];

    async function worker() {
        while (firstUndone < totalTasks) {
            await taskFactory(firstUndone++);
        }
    }

    for (let i = 0; i < parallel; i++) {
        workers.push(worker());
    }
    await Promise.all(workers);
}

const authors = Array.from({length: Math.random() * 1000}, (_, i) => 'Author name #' + i);

async function main() {
    console.log('Starting script for filling data');
    const db = new Database();
    try {
        await db.connect(env.dbUrl);
        await db.executeQuery('DELETE FROM books');

        const store = booksStore(db);

        await concurrentExecute(7, 1e5, async (i) => {
            const randomAuthor = authors[Math.round(Math.random() * (authors.length - 1))];
            await store.create({
                title: 'book title' + Math.random(),
                author: randomAuthor,
                description: 'book description: ' + Math.random(),
                image: 'book::/image.link/' + Math.random(),
                date: new Date(Math.random() * Date.now()),
            });
            await promisify(setTimeout)(1);
            if ((i + 1) % 100 === 0) {
                // a little lie
                console.log('inserted', i + 1, 'books');
            }
        });

        console.log('random data filled!');
    } catch (err) {
        console.error(err);
    } finally {
        await db.stop();
    }
}

main()
    .catch(console.error);
