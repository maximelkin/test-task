const requestLib = require('request-promise-native');
const {describe, test, beforeEach} = require("mocha");
const {assert} = require('chai');

const request = requestLib.defaults({json: true, uri: '', baseUrl: `http://${process.env.API_HOST || 'localhost'}:8080/books`});

describe('Server tests', () => {

    async function fillWithBooks(n) {
        const results = [];
        for (let i = 0; i < n; i++) {
            results.push(await request.post({
                body: {
                    title: 'book title' + i,
                    description: 'book description' + (i % 2),
                    author: 'Author name' + (4 - i % 2),
                    image: 'image url',
                    date: new Date('2017-12-22').toISOString(),
                }
            }));
        }
        return results
            .map(x => x.id)
            .sort((x, y) => x - y);
    }

    beforeEach('clear all db', async () => {
        await request.delete();
    });

    test('get 404', async () => {
        try {
            await request('/1');
            assert(false);
        } catch (err) {
            assert.equal(err.statusCode, 404);
        }
    });

    test('create fails without all params', async () => {
        try {
            await request.post({
                body: {
                    title: 'a',
                },
            });
            assert(false);
        } catch (err) {
            assert.equal(err.statusCode, 400);
        }
    });

    test('create success, then get', async () => {
        const result = await request.post('', {
            body: {
                title: 'book title',
                description: 'book description',
                author: 'Author name',
                image: 'image url',
                date: new Date('2017-12-22').toISOString(),
            }
        });
        assert(result.id > 0);
        const fetched = await request.get('/' + result.id);
        assert.deepEqual(fetched, {
            id: result.id,
            title: 'book title',
            description: 'book description',
            author: 'Author name',
            image: 'image url',
            date: new Date('2017-12-22').toISOString(),
        })
    });

    test('patch success', async () => {

        const result = await request.post({
            body: {
                title: 'book title',
                description: 'book description',
                author: 'Author name',
                image: 'image url',
                date: new Date('2017-12-22').toISOString(),
            }
        });
        assert(result.id > 0);

        try {
            await request.patch('/' + result.id, {
                body: {}
            });
            assert(false);
        } catch (e) {
            assert.equal(e.statusCode, 400, 'check patch warns about empty updates');
        }
        await request.patch('/' + result.id, {
            body: {
                title: 'another title',
                author: 'Author 2name',
                image: 'another image',
            }
        });

        const fetched = await request.get('/' + result.id);
        assert.deepEqual(fetched, {
            id: result.id,
            title: 'another title',
            description: 'book description',
            author: 'Author 2name',
            image: 'another image',
            date: new Date('2017-12-22').toISOString(),
        });
    });

    test('get all', async () => {
        const createdIds = await fillWithBooks(4);

        const all = await request.get({
            qs: {
                page: 0,
                pageSize: 2,
            }
        });
        assert.lengthOf(all, 2);
        assert.lengthOf(Object.keys(all[0]), 6);
        assert.equal(all[0].id, createdIds[0]);
        assert.equal(all[1].id, createdIds[1]);
    });

    test('get all sort inverted', async () => {
        const createdIds = await fillWithBooks(4);

        const allInverted = await request({
            qs: {
                page: 0,
                pageSize: 2,
                sortDirection: -1,
            }
        });
        assert.lengthOf(allInverted, 2);
        assert.lengthOf(Object.keys(allInverted[0]), 6);
        assert.equal(allInverted[0].id, createdIds[createdIds.length - 1]);
        assert.equal(allInverted[1].id, createdIds[createdIds.length - 2]);

    });

    test('get all sort inverted by title', async () => {
        await fillWithBooks(4);

        const allByTitleInverted = await request({
            qs: {
                page: 0,
                pageSize: 2,
                sort: 'title',
                sortDirection: -1,
            }
        });
        assert.lengthOf(allByTitleInverted, 2);
        assert.lengthOf(Object.keys(allByTitleInverted[0]), 6);
        assert.equal(allByTitleInverted[0].title, 'book title3');
        assert.equal(allByTitleInverted[1].title, 'book title2');

    });

    test('get all wrong request: sort and group by different fields', async () => {
        await fillWithBooks(4);
        try {
            await request({
                qs: {
                    page: 0,
                    pageSize: 2,
                    group: 'description',
                    sort: 'title',
                }
            });
            assert(false);
        } catch (err) {
            assert.equal(err.statusCode, 400, 'group by and sort by different fields');
        }

    });

    test('get all group by description', async () => {
        await fillWithBooks(4);
        const allGroupedByDescription = await request({
            qs: {
                page: 0,
                pageSize: 4,
                group: 'description',
            }
        });
        assert.lengthOf(allGroupedByDescription, 2);
        assert.lengthOf(Object.keys(allGroupedByDescription[0]), 2);
        assert.sameDeepMembers(allGroupedByDescription, [
            {description: 'book description0', count: 2},
            {description: 'book description1', count: 2},
        ]);
    });


    test('get all sort by author', async () => {
        const ids = await fillWithBooks(4);
        const allSortByAuthor = await request({
            qs: {
                page: 0,
                pageSize: 4,
                sort: 'author',
            }
        });
        assert.lengthOf(allSortByAuthor, 4);
        assert.lengthOf(Object.keys(allSortByAuthor[0]), 6);

        assert.equal(allSortByAuthor[0].author, 'Author name3');
        assert.equal(allSortByAuthor[1].author, 'Author name3');
        assert.equal(allSortByAuthor[2].author, 'Author name4');
        assert.equal(allSortByAuthor[3].author, 'Author name4');

        assert.notDeepEqual(allSortByAuthor.map(book => book.id), ids)
    });
});
