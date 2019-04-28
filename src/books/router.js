const Router = require("koa-router");
const validator = require('./validators');
/**
 * @param {BooksController} controller
 * @return {Router}
 */
module.exports = (controller) => {

    return new Router()
        .get('/', async ctx => {
            const params = {
                sort: ctx.query.sort,
                sortDirection: ctx.query.sortDirection && parseInt(ctx.query.sortDirection),
                group: ctx.query.group,
                pagination: {
                    page: parseInt(ctx.query.page),
                    pageSize: parseInt(ctx.query.pageSize),
                },
            };
            await validator.getMany(params);
            ctx.body = await controller.getMany(params);
        })
        .get('/:id', async ctx => {
            const params = {
                id: parseInt(ctx.params.id),
            };
            await validator.getOne(params);
            ctx.body = await controller.getOne(params);
        })
        .post('/', async ctx => {
            const params = {
                ...ctx.request.body,
                date: new Date(ctx.request.body.date),
            };
            await validator.create(params);
            ctx.body = await controller.create(params);
        })
        .patch('/:id', async ctx => {
            const params = {
                ...ctx.request.body,
                id: parseInt(ctx.params.id),
            };
            await validator.patch(params);
            ctx.body = await controller.patch(params);
        })
        .delete('/', async ctx => {
            ctx.body = await controller.delete();
        });
};