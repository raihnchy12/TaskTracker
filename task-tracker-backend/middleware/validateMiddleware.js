const { ZodError } = require('zod');

/**
 * Middleware untuk memvalidasi body request menggunakan skema Zod
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => {
  return async (req, res, next) => {
    if (!schema || typeof schema.parseAsync !== 'function') {
      console.error('[VALIDATION ERROR]: Schema yang dikirim ke validate() bernilai undefined.');
      return res.status(500).json({
        success: false,
        message: 'Konfigurasi skema validasi server tidak terdefinisi',
      });
    }

    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Ambil issue dari error.issues atau error.errors
        const issues = error.issues || error.errors || [];
        
        const formattedErrors = issues.map((err) => ({
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