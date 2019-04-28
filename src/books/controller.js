/**
 * @typedef {object} BooksController
 * @property {function} getOne
 * @property {function} getMany
 * @property {function} update
 * @property {function} create
 * @property {function} delete
 */

const UserInputError = require("../errors").UserInputError;
const isTesting = require("../env").isTesting;
const {NotFoundError} = require("../errors");

/**
 * @param store
 * @return {BooksController}
 */
module.exports = (store) => ({
    async getOne(params) {
        const result = await store.getOne(params.id);
        if (!result) throw new NotFoundError('no such book');
        return result;
    },
    async getMany(params) {
        if (params.group && params.sort && params.sort !== params.group) {
            throw new UserInputError('Sort should be equal group if group defined');
        }
        const result = await store.getMany({
            by: params.sort || params.group || 'id',
            direction: params.sortDirection || 1,
        }, params.group, params.pagination);
        console.log(result);
        return result;
    },
    async patch({id, ...update}) {
        const affected = await store.update(id, update);
        if (affected === 0) throw new Error();
    },
    async create(params) {
        const result = await store.create(params);
        return {id: result};
    },
    async delete(params) {
        if (!isTesting) {
            throw new Error('forbidden in production');
        }
        await store.delete();
    }
});