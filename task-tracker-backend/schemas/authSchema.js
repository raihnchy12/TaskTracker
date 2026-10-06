const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

// Wajib diekspor sebagai objek bernama registerSchema dan loginSchema
module.exports = {
  registerSchema,
  loginSchema,
};