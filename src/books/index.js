const makeApiController = require('./controller');
const makeRouter = require('./router');
const makeStore = require('./store');

/**
 * @param database
 * @param {RestApi} restApiApp
 */
module.exports = async (database, restApiApp) => {
    const store = makeStore(database);
    const controller = makeApiController(store);
    const router = makeRouter(controller);

    restApiApp.attachRouter('books', router);
};