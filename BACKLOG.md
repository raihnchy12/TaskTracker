# 📋 Product Backlog 30 Hari — Task Tracker (Fullstack)

> **Proyek**: Task Tracker Application (Task Management & Productivity)  
> **Tech Stack**:
>
> - **Backend**: Node.js, Express.js (v5), PostgreSQL (`pg`), JWT (`jsonwebtoken`), Bcrypt, CORS, Dotenv.
> - **Frontend**: React 19, TypeScript, Vite, React Router v7, `@dnd-kit/core`, Modern Vanilla CSS (Glassmorphism & Responsive Design).
> - **Infrastruktur / Deployment**: Neon / Railway (Database & API), Vercel (Frontend SPA).
>
> **Keterangan Status**:
>
> - `[x]` : **Selesai dikerjakan** _(Sudah terimplementasi di dalam codebase saat ini)_
> - `[ ]` : **Backlog / Rencana Kerja** _(Akan dikerjakan sesuai sprint timeline)_

---

## 📊 Ringkasan Progress 30 Hari

```
Sprint 1 (Hari 01 - 07) : [████████████████████] 100% (Selesai)
Sprint 2 (Hari 08 - 14) : [████████████████████] 100% (Selesai)
Sprint 3 (Hari 15 - 21) : [███████████████░░░░░]  75% (Fitur Utama Aktif)
Sprint 4 (Hari 22 - 30) : [░░░░░░░░░░░░░░░░░░░░]   0% (Mendatang)
```

---

## 🏃 Sprint 1: Fondasi Arsitektur, Database & Sistem Autentikasi (Hari 1 – 7)

**Sprint Goal**: Membangun fondasi sistem backend & frontend yang kokoh, konfigurasi koneksi database PostgreSQL, serta alur autentikasi pengguna berbasis JWT yang aman dan responsif.

### 📅 Hari 1 – 2: Inisialisasi Proyek & Konfigurasi Basis Data

- [x] **BE-01**: Setup repositori proyek terstruktur (`task-tracker-backend` dan `task-tracker-frontend`).
- [x] **BE-02**: Inisialisasi Express server (`server.js`), manajemen environment variables (`.env`, `dotenv`).
- [x] **BE-03**: Konfigurasi koneksi PostgreSQL Database Pool (`db.js`) mendukung database lokal dan Cloud Database (Neon/Railway) dengan SSL config.
- [x] **BE-04**: Setup handler manual CORS & Preflight (`OPTIONS`) di Express untuk komunikasi lintas domain frontend-backend.
- [x] **FE-01**: Inisialisasi project frontend menggunakan Vite + React 19 + TypeScript.
- [x] **FE-02**: Setup sistem desain dasar pada `index.css` (Glassmorphism, CSS Variables, dark/vibrant aesthetics, Google Fonts, reset CSS).

### 📅 Hari 3 – 5: Backend Authentication & Authorization (JWT)

- [x] **BE-05**: Desain skema tabel `users` (`id`, `name`, `email`, `password`, `created_at`).
- [x] **BE-06**: Endpoint Register User `POST /api/auth/register` dengan hashing kata sandi (`bcrypt`, salt 10).
- [x] **BE-07**: Endpoint Login User `POST /api/auth/login` dengan verifikasi hash kata sandi dan penerbitan token JWT (`jsonwebtoken`, masa berlaku 1 hari).
- [x] **BE-08**: Pembuatan middleware `authMiddleware.js` untuk memvalidasi `Authorization: Bearer <token>` pada endpoint privat.
- [x] **BE-09**: Pembuatan `errorMiddleware.js` untuk penanganan error terpusat dalam format JSON konsisten.

### 📅 Hari 6 – 7: Frontend Authentication Flow & Routing

- [x] **FE-03**: Pembuatan HTTP client wrapper (`src/api/client.ts`) yang otomatis menyertakan header `Authorization: Bearer <token>` dan dynamic `VITE_API_URL`.
- [x] **FE-04**: Halaman Registrasi (`RegisterPage.tsx`) dengan validasi form (nama, email, password min 8 karakter, persetujuan syarat ketentuan).
- [x] **FE-05**: Halaman Login (`LoginPage.tsx`) dengan fitur toggle visibilitas kata sandi, penyimpanan token & user data di `localStorage`.
- [x] **FE-06**: Setup routing dinamis (`App.tsx`) dengan React Router v7 dan komponen `ProtectedRoute.tsx` untuk melindungi halaman dashboard.
- [x] **FE-07**: Komponen navigasi header (`AppHeader.tsx`) dengan tombol logout yang membersihkan sesi pengguna.

---

## 🏃 Sprint 2: Core Feature — Manajemen Proyek & Tugas (Hari 8 – 14)

**Sprint Goal**: Mengimplementasikan kapabilitas penuh CRUD (Create, Read, Update, Delete) untuk Proyek dan Tugas pengguna, lengkap dengan sistem status alur kerja (Kanban workflow).

### 📅 Hari 8 – 10: Manajemen Proyek (Backend & Frontend)

- [x] **BE-10**: Desain skema tabel `projects` (`id`, `title`, `description`, `owner_id`, `created_at`) berelasi ke `users`.
- [x] **BE-11**: Endpoint `GET /api/projects` untuk mengambil daftar proyek milik user yang sedang aktif.
- [x] **BE-12**: Endpoint `POST /api/projects` untuk membuat proyek baru dengan validasi title wajib.
- [x] **BE-13**: Endpoint `PUT /api/projects/:id` untuk memperbarui title & deskripsi proyek milik user.
- [x] **BE-14**: Endpoint `DELETE /api/projects/:id` yang menghapus proyek beserta seluruh tugas di dalamnya secara _cascade_.
- [x] **FE-08**: Halaman Dashboard (`DashboardPage.tsx`) yang menyapa user secara personal berdasarkan nama akun.
- [x] **FE-09**: Komponen daftar proyek (`ProjectList.tsx`) dengan fitur pencarian proyek secara _real-time_ berbasis judul dan deskripsi.
- [x] **FE-10**: Form interaktif pembuatan proyek baru dan modal pengeditan proyek.
- [x] **FE-11**: Fitur hapus proyek dengan konfirmasi keamanan dialog modal (`ConfirmModal.tsx`).

### 📅 Hari 11 – 14: Manajemen Tugas & Alur Status (Backend & Frontend)

- [x] **BE-15**: Desain skema tabel `tasks` (`id`, `project_id`, `title`, `description`, `status`, `priority`, `due_date`, `created_at`).
- [x] **BE-16**: Validasi status alur kerja valid (`BACKLOG`, `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`) dan tingkat prioritas (`LOW`, `MEDIUM`, `HIGH`).
- [x] **BE-17**: Sanitasi tanggal tenggat (`parseValidDate`) untuk mencegah error overflow tahun pada PostgreSQL.
- [x] **BE-18**: Endpoint `GET /api/tasks/project/:projectId` untuk memuat seluruh tugas spesifik per proyek.
- [x] **BE-19**: Endpoint `POST /api/tasks` untuk menambah tugas baru ke proyek dengan validasi kepemilikan proyek.
- [x] **BE-20**: Endpoint `PUT /api/tasks/:id` untuk edit detail lengkap tugas (title, deskripsi, prioritas, status, tenggat waktu).
- [x] **BE-21**: Endpoint `PATCH /api/tasks/:id/status` khusus untuk memperbarui status perpindahan tugas secara cepat.
- [x] **BE-22**: Endpoint `DELETE /api/tasks/:id` untuk menghapus tugas spesifik.
- [x] **FE-12**: Komponen kartu proyek interaktif (`ProjectCard.tsx`) dengan mekanisme buka/tutup (_accordion_) untuk memuat tugas sesuai kebutuhan (_lazy fetch_).
- [x] **FE-13**: Tab filter status tugas (`StatusTabs.tsx`) menampilkan jumlah indikator counter per status: Backlog, To Do, In Progress, Review, dan Done.
- [x] **FE-14**: Kartu tugas dengan detail tenggat waktu terformat Bahasa Indonesia dan lencana warna tingkat prioritas (Rendah, Sedang, Tinggi).
- [x] **FE-15**: Tombol kontrol perpindahan status cepat (Maju / Mundur status) disertai modal konfirmasi alur perpindahan (`PendingMove` modal).
- [x] **FE-16**: Form modal tambah tugas baru dan edit tugas langsung dari kartu proyek.
- [x] **FE-17**: Konfigurasi deployment frontend di Vercel (`vercel.json` rewrite routing).

---

## 🏃 Sprint 3: Visual Kanban Board, Filter Lanjutan & UX Enhancement (Hari 15 – 21)

**Sprint Goal**: Meningkatkan pengalaman pengguna dari tampilan tab tugas menjadi papan visual Kanban penuh (Drag & Drop), penambahan sistem filter/sorting tingkat lanjut, serta optimasi antarmuka.

### 📅 Hari 15 – 17: Transformasi ke Papan Visual Kanban (Drag & Drop)

- [x] **FE-18**: Integrasi library `@dnd-kit/core` pada dependensi `package.json`.
- [x] **FE-19**: Implementasi tampilan multi-kolom Kanban Board interaktif berdampingan (Kolom: Backlog | To Do | In Progress | Review | Done) sebagai opsi tampilan alternatif dengan toggle switch di samping mode Tab.
- [x] **FE-20**: Fitur drag-and-drop kartu tugas antar kolom dengan feedback visual (shadow elevasi, placeholder kolom tujuan, kartu overlay melayang) menggunakan `@dnd-kit/core`.
- [x] **FE-21**: Integrasi auto-save status ke backend via endpoint `PATCH /api/tasks/:id/status` dengan _optimistic UI update_ dan penanganan _rollback_ bila terjadi kegagalan jaringan.

### 📅 Hari 18 – 19: Pencarian & Filtering Tugas Lanjutan

- [x] **FE-22**: Fitur pencarian tugas spesifik berdasarkan kata kunci judul atau deskripsi di dalam proyek secara dinamis.
- [x] **FE-23**: Filter tugas berdasarkan prioritas (`Semua`, `Tinggi`, `Sedang`, `Rendah`) dan indikator status tenggat waktu.
- [x] **FE-24**: Opsi pengurutan (_sorting_) tugas: berdasarkan tenggat waktu terdekat, tanggal dibuat, atau prioritas tertinggi.
- [x] **BE-23**: Penambahan query parameters pada endpoint `GET /api/tasks/project/:projectId?search=&priority=&status=&sort=` untuk mendukung pagination dan filtering di level database bila data berjumlah besar.

### 📅 Hari 20 – 21: Validasi Skema & Notifikasi Feedback Pengguna

- [ ] **BE-24**: Implementasi skema validasi request terpusat (misal menggunakan Joi atau Zod) untuk body request auth, project, dan task.
- [x] **FE-25**: Komponen Toast Notifications global (`Toast.tsx` tipe: Success, Error, Info) untuk menggantikan penggunaan `alert()` bawaan browser.
- [x] **FE-26**: Indikator visual progres penyelesaian proyek (Progress Bar: persentase tugas dengan status `DONE` dibandingkan total tugas dalam proyek) dengan lencana status interaktif.

---

## 🏃 Sprint 4: Kolaborasi Tim, Keamanan, Testing & Dokumentasi (Hari 22 – 30)

**Sprint Goal**: Menghadirkan fitur kolaborasi tim, memperketat keamanan API, melengkapi unit/integration test, membuat dokumentasi API interaktif, dan finalisasi rilis produksi.

### 📅 Hari 22 – 24: Fitur Kolaborasi Proyek & Profil Pengguna

- [ ] **BE-25**: Desain tabel relasi `project_members` (`project_id`, `user_id`, `role: OWNER | MEMBER`) untuk memungkinkan multi-user mengelola proyek bersama.
- [ ] **BE-26**: Endpoint untuk mengundang anggota tim ke dalam proyek melalui alamat email.
- [ ] **BE-27**: Penambahan kolom `assigned_to` pada tabel `tasks` sehingga tugas dapat didelegasikan ke anggota proyek tertentu.
- [ ] **FE-27**: Halaman/Modal Pengaturan Profil Pengguna (Edit nama, ganti kata sandi, avatar inisial nama).
- [ ] **FE-28**: Modal Anggota Proyek (Daftar anggota tim, undang anggota baru, hapus akses anggota).
- [ ] **FE-29**: Tampilan lencana inisial/avatar penanggung jawab tugas pada masing-masing kartu tugas.

### 📅 Hari 25 – 27: Penguatan Keamanan, Rate Limiting & Optimasi

- [ ] **BE-28**: Pemasangan middleware keamanan `helmet` untuk sanitasi HTTP security headers.
- [ ] **BE-29**: Implementasi `express-rate-limit` pada endpoint autentikasi (`/api/auth/login` & `/register`) untuk mencegah serangan _brute force_.
- [ ] **BE-30**: Penerapan mekanisme Refresh Token dengan HTTP-only cookie untuk keamanan autentikasi tingkat lanjut.
- [ ] **BE-31**: Penambahan database indexing pada foreign key (`tasks.project_id`, `projects.owner_id`) untuk mempercepat performa query.

### 📅 Hari 28 – 30: Automated Testing, Dokumentasi API & Rilis Final

- [ ] **BE-32**: Unit testing & Integration testing backend menggunakan Jest dan Supertest (Auth flow, Project CRUD, Task CRUD).
- [ ] **FE-30**: Unit testing komponen frontend menggunakan Vitest dan React Testing Library.
- [ ] **BE-33**: Dokumentasi API interaktif menggunakan Swagger UI / Postman Collection publik.
- [ ] **DE-01**: Konfigurasi CI/CD Pipeline (GitHub Actions) untuk otomatisasi linter, test, dan auto-deployment ke Railway/Vercel setiap push ke branch `main`.
- [ ] **DE-02**: Evaluasi akhir, uji coba beban ringan (_smoke test_), dan serah terima dokumen proyek.

---

## 📑 Matriks Fitur & Status Implementasi

| Modul        | Fitur                                              | Kategori  | Status | Lokasi Kode / File Terkait                                |
| :----------- | :------------------------------------------------- | :-------- | :----: | :-------------------------------------------------------- |
| **Auth**     | Registrasi Akun Baru (Bcrypt Hash)                 | Backend   | `[x]`  | `task-tracker-backend/routes/auth.js`                     |
| **Auth**     | Login Pengguna & JWT Issuance                      | Backend   | `[x]`  | `task-tracker-backend/routes/auth.js`                     |
| **Auth**     | Middleware Verifikasi JWT Token                    | Backend   | `[x]`  | `task-tracker-backend/middleware/authMiddleware.js`       |
| **Auth**     | Halaman Form Register & Validasi                   | Frontend  | `[x]`  | `task-tracker-frontend/src/pages/RegisterPage.tsx`        |
| **Auth**     | Halaman Form Login & Toggle Password               | Frontend  | `[x]`  | `task-tracker-frontend/src/pages/LoginPage.tsx`           |
| **Auth**     | Rute Terproteksi (`ProtectedRoute`)                | Frontend  | `[x]`  | `task-tracker-frontend/src/components/ProtectedRoute.tsx` |
| **Auth**     | Tombol Keluar Sesi (_Logout_)                      | Frontend  | `[x]`  | `task-tracker-frontend/src/components/AppHeader.tsx`      |
| **Projects** | Ambil Daftar Proyek Milik User                     | Backend   | `[x]`  | `task-tracker-backend/routes/projects.js`                 |
| **Projects** | Tambah Proyek Baru                                 | Backend   | `[x]`  | `task-tracker-backend/routes/projects.js`                 |
| **Projects** | Edit Judul & Deskripsi Proyek                      | Backend   | `[x]`  | `task-tracker-backend/routes/projects.js`                 |
| **Projects** | Hapus Proyek (Cascade Hapus Tasks)                 | Backend   | `[x]`  | `task-tracker-backend/routes/projects.js`                 |
| **Projects** | Pencarian Proyek Real-time                         | Frontend  | `[x]`  | `task-tracker-frontend/src/components/ProjectList.tsx`    |
| **Projects** | Modal Buat & Edit Proyek                           | Frontend  | `[x]`  | `task-tracker-frontend/src/components/ProjectList.tsx`    |
| **Projects** | Modal Konfirmasi Hapus Proyek                      | Frontend  | `[x]`  | `task-tracker-frontend/src/components/ConfirmModal.tsx`   |
| **Tasks**    | Ambil Tugas per Proyek                             | Backend   | `[x]`  | `task-tracker-backend/routes/tasks.js`                    |
| **Tasks**    | Tambah Tugas Baru & Sanitasi Tanggal               | Backend   | `[x]`  | `task-tracker-backend/routes/tasks.js`                    |
| **Tasks**    | Edit Detail Lengkap Tugas (Title, Due, Pri)        | Backend   | `[x]`  | `task-tracker-backend/routes/tasks.js`                    |
| **Tasks**    | Patch Cepat Status Tugas (Kanban drag API)         | Backend   | `[x]`  | `task-tracker-backend/routes/tasks.js`                    |
| **Tasks**    | Hapus Tugas                                        | Backend   | `[x]`  | `task-tracker-backend/routes/tasks.js`                    |
| **Tasks**    | Tab Status (Backlog, Todo, Progress, Review, Done) | Frontend  | `[x]`  | `task-tracker-frontend/src/components/StatusTabs.tsx`     |
| **Tasks**    | Detail Tugas Expandable & Due Date                 | Frontend  | `[x]`  | `task-tracker-frontend/src/components/ProjectCard.tsx`    |
| **Tasks**    | Tombol Navigasi Status (Maju/Mundur)               | Frontend  | `[x]`  | `task-tracker-frontend/src/components/ProjectCard.tsx`    |
| **Tasks**    | Modal Konfirmasi Hapus Tugas                       | Frontend  | `[x]`  | `task-tracker-frontend/src/components/ConfirmModal.tsx`   |
| **Kanban**   | Papan Kolom Visual Drag-and-Drop (`@dnd-kit`)      | Frontend  | `[x]`  | `task-tracker-frontend/src/components/KanbanBoard.tsx`    |
| **Kanban**   | Kolom Droppable & Kartu Draggable                  | Frontend  | `[x]`  | `task-tracker-frontend/src/components/KanbanColumn.tsx`   |
| **Tasks**    | Filter Prioritas & Pencarian di Kartu Proyek       | Frontend  | `[x]`  | `task-tracker-frontend/src/components/ProjectCard.tsx`    |
| **UX**       | Progress Bar Persentase Selesai Proyek             | Frontend  | `[x]`  | `task-tracker-frontend/src/components/ProjectCard.tsx`    |
| **UX**       | Toast Notification UI (Pengganti Alert)            | Frontend  | `[x]`  | `task-tracker-frontend/src/components/Toast.tsx`          |
| **UX**       | View Switcher (Papan Kanban vs Tab Status)         | Frontend  | `[x]`  | `task-tracker-frontend/src/components/ProjectCard.tsx`    |
| **Security** | Rate Limiter & Helmet Headers                      | Backend   | `[ ]`  | _Sprint 4 Backlog_                                        |
| **Collab**   | Multi-user Project Collaboration                   | Fullstack | `[ ]`  | _Sprint 4 Backlog_                                        |
| **Testing**  | Automated Unit & Integration Tests                 | Fullstack | `[ ]`  | _Sprint 4 Backlog_                                        |
| **Docs**     | Dokumentasi API Swagger / Postman                  | Backend   | `[ ]`  | _Sprint 4 Backlog_                                        |
| **DevOps**   | CI/CD GitHub Actions Pipeline                      | DevOps    | `[ ]`  | _Sprint 4 Backlog_                                        |
