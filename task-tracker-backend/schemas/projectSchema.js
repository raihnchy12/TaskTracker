const { z } = require('zod');

// Schema untuk pembuatan proyek baru (POST /api/projects)
const createProjectSchema = z.object({
  title: z
    .string({
      required_error: 'Nama proyek wajib diisi',
    })
    .trim()
    .min(1, 'Nama proyek wajib diisi'),
  description: z.string().nullable().optional(),
});

// Schema untuk pembaruan proyek (PUT /api/projects/:id)
const updateProjectSchema = z.object({
  title: z
    .string({
      required_error: 'Nama proyek wajib diisi',
    })
    .trim()
    .min(1, 'Nama proyek wajib diisi'),
  description: z.string().nullable().optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};
