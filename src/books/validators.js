const joi = require('@hapi/joi');

const maxBooks = 100000000;

const idSchema = joi.number().integer().min(1).max(maxBooks);

const withoutIdSchema = {
    title: joi.string().min(1).max(1000),
    description: joi.string().min(1).max(10000),
    author: joi.string().min(1).max(500),
    image: joi.string().min(1).max(3000),
    date: joi.date().iso(),
};

const getValidator = joi.object({
    id: idSchema,
});

const getManyValidator = joi.object({
    sort: joi.valid('title', 'description', 'author', 'image', 'date', 'id').optional(),
    sortDirection: joi.valid(-1, 1).optional(),
    group: joi.valid('title', 'description', 'author', 'image', 'date').optional(),
    pagination: joi.object()
        .keys({
            page: joi.number().integer().min(0).max(maxBooks),
            pageSize: joi.number().integer().min(1).max(100),
        }),
});

const createValidator = joi.object(withoutIdSchema);

const patchValidator = joi.object({
    ...withoutIdSchema,
    id: idSchema.required(),
})
    .or(Object.keys(withoutIdSchema));


const joiParams = {
    convert: false,
    presence: 'required',
    allowUnknown: false,
};

module.exports.getOne = module.exports.delete = (params) => getValidator.validate(params, joiParams);
module.exports.getMany = (params) => getManyValidator.validate(params, joiParams);
module.exports.create = (params) => createValidator.validate(params, joiParams);
module.exports.patch = (params) => patchValidator.validate(params, {convert: false});