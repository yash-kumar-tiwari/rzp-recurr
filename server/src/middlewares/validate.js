const { sendBadRequest } = require('../utils/response');

/**
 * Factory: Creates a validation middleware from a Joi schema
 * Usage: router.post('/route', validate(schema), controller)
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    const errors = error.details.map((d) => d.message.replace(/"/g, ''));
    return sendBadRequest(res, 'Validation failed', errors);
  }

  next();
};

module.exports = validate;
