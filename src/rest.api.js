const {NotFoundError} = require("./errors");
const Koa = require("koa");
const KoaRouter = require("koa-router");
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const UserInputError = require("./errors").UserInputError;
const promisify = require("util").promisify;

class RestApi {

    constructor() {
        this._router = new KoaRouter();
        this._app = new Koa();
    }

    /**
     * @param {number} port
     */
    start(port) {
        console.log('start listening port', port);
        this._app.use(logger());
        this._app.use(this.joiValidatorPlugin());
        this._app.use(this.applicationErrorsHandlerPlugin());
        this._app.use(bodyParser({
            enableTypes: ['json'],
            strict: true, // only objects and arrays
        }));
        this._app.use(this._router.routes());
        this._server = this._app.listen(port);
    }

    async stop() {
        await promisify(this._server.close.bind(this._server))();
    }

    /**
     * @param {string} prefix route prefix
     * @param {Router} router
     */
    attachRouter(prefix, router) {
        console.log('attaching router of', prefix);
        this._router.use('/' + prefix, router.routes());
    }

    joiValidatorPlugin() {
        return async (ctx, next) => {
            try {
                await next();
            } catch (err) {
                if (err.isJoi) {
                    ctx.throw(400, err.message);
                }
                throw err;
            }
        };
    }

    applicationErrorsHandlerPlugin() {
        return async (ctx, next) => {
            try {
                await next();
            } catch (err) {
                if (err instanceof NotFoundError) {
                    ctx.throw(404, err.message);
                }
                if (err instanceof UserInputError) {
                    ctx.throw(400, err.message);
                }
                throw err;
            }
        }
    }
}

module.exports = RestApi;
