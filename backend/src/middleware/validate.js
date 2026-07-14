const ApiError = require('../utils/ApiError');

// usage: validate(schema) or validate(schema, 'query')
module.exports = function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return next(new ApiError(400, message));
    }
    req[source] = result.data; // replaced with parsed/coerced values
    next();
  };
};
