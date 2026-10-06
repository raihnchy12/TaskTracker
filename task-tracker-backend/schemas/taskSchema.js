const { z } = require('zod');

// Schema untuk pembuatan tugas baru (POST /api/tasks)
const createTaskSchema = z.object({
  project_id: z.coerce.number({
    required_error: 'ID Proyek wajib diisi',
    invalid_type_error: 'ID Proyek harus berupa angka',
  }),
  title: z
    .string({
      required_error: 'Nama tugas wajib diisi',
    })
    .trim()
    .min(1, 'Nama tugas wajib diisi'),
  description: z.string().nullable().optional(),
  status: z
    .enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'], {
      invalid_type_error: 'Status tugas tidak valid',
    })
    .optional()
    .default('BACKLOG'),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'], {
      invalid_type_error: 'Prioritas tugas tidak valid',
    })
    .optional()
    .default('MEDIUM'),
  due_date: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
});

// Schema untuk pembaruan cepat status tugas (PATCH /api/tasks/:id/status)
const updateTaskStatusSchema = z.object({
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'], {
    required_error: 'Status wajib diisi',
    invalid_type_error: 'Status tugas tidak valid',
  }),
});

// Schema untuk pembaruan detail tugas (PUT /api/tasks/:id)
const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Nama tugas wajib diisi').optional(),
  description: z.string().nullable().optional(),
  status: z
    .enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'], {
      invalid_type_error: 'Status tugas tidak valid',
    })
    .optional(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'], {
      invalid_type_error: 'Prioritas tugas tidak valid',
    })
    .optional(),
  due_date: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
});

module.exports = {
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
};
