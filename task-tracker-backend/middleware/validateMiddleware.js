const { ZodError } = require('zod');

/**
 * Middleware untuk memvalidasi body request menggunakan skema Zod
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          status: 'fail',
          message: 'Validasi data gagal',
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
};

module.exports = validate;