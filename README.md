# Task Management API - Express.js + TypeScript

Solusi technical test Backend Developer: REST API multi-user untuk mengelola task per user menggunakan Express.js, TypeScript, JWT Authentication, Sequelize, PostgreSQL, structured error handling, idempotency key, database transaction, structured logging, dan unit test concurrency/idempotency.

## Tech Stack

- Node.js + Express.js
- TypeScript strict mode
- Sequelize ORM
- PostgreSQL untuk database relational dan transaction
- JWT untuk authentication
- bcryptjs untuk hashing password
- Zod untuk request validation
- Pino untuk structured JSON logging
- Jest + ts-jest untuk unit test

## Cara Menjalankan Project

### 1. Clone repository

```bash
git clone <repo-url>
cd task-management-api-express
```

### 2. Install dependency

```bash
npm install
```

### 3. Jalankan PostgreSQL lokal

```bash
docker compose up -d
```

> PostgreSQL container tetap berjalan di port internal `5432`, tetapi diexpose ke host pada port `5433` agar tidak bentrok dengan PostgreSQL lokal yang biasanya memakai port `5432`.

### 4. Setup environment

```bash
cp .env.example .env
```

Default `DATABASE_URL` sudah mengarah ke PostgreSQL dari `docker-compose.yml` pada `localhost:5433`.
Ubah `JWT_SECRET` sebelum production.

### 5. Sync database

```bash
npm run db:sync
```

### 6. Jalankan server development

```bash
npm run dev
```

Server default berjalan di:

```text
http://localhost:3000
```

### 7. Build TypeScript

```bash
npm run build
```

### 8. Jalankan production build

```bash
npm start
```

### 9. Jalankan unit test

```bash
npm test
```

Unit test idempotency/concurrency tidak membutuhkan koneksi database atau service eksternal. Test menggunakan repository mock/stub in-memory.

## Authentication

Semua endpoint `/tasks` membutuhkan header:

```text
Authorization: Bearer <token>
```

Token didapat dari endpoint register atau login.

## Daftar Endpoint

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "success",
  "message": "OK"
}
```

---

## Auth Endpoints

### Register

```http
POST /auth/register
Content-Type: application/json
```

Body:

```json
{
  "name": "Juan Delima",
  "email": "juan@example.com",
  "password": "password123",
  "teamName": "Engineering"
}
```

Notes:

- `teamName` optional.
- User dengan `teamName` yang sama dianggap berada dalam satu tim.
- Password minimal 8 karakter.

Response `201`:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Juan Delima",
      "email": "juan@example.com",
      "teamId": "uuid"
    },
    "token": "jwt-token"
  }
}
```

### Login

```http
POST /auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Juan Delima",
      "email": "juan@example.com",
      "teamId": "uuid"
    },
    "token": "jwt-token"
  }
}
```

---

## Task Endpoints

### Create Task

```http
POST /tasks
Authorization: Bearer <token>
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
```

Body:

```json
{
  "title": "Implement task API",
  "description": "Create CRUD API using Express.js + TypeScript",
  "status": "todo"
}
```

Response `201`:

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Implement task API",
    "description": "Create CRUD API using Express.js + TypeScript",
    "status": "todo",
    "ownerId": "uuid",
    "assigneeId": "uuid",
    "teamId": "uuid"
  }
}
```

#### Idempotency Behavior

Endpoint `POST /tasks` wajib mengirim header:

```text
Idempotency-Key: <uuid>
```

Rules:

- Request pertama dengan key baru akan membuat task baru.
- Request berikutnya dengan key yang sama dalam window 24 jam akan mengembalikan response yang sama tanpa membuat task baru.
- Jika key yang sama dipakai dengan body berbeda, API mengembalikan `409 IDEMPOTENCY_KEY_REUSED`.
- Proteksi race condition dilakukan dengan kombinasi keyed mutex di level aplikasi dan unique constraint di database.

---

### List Tasks

```http
GET /tasks?page=1&limit=10&status=todo&search=api
Authorization: Bearer <token>
```

Query optional:

| Query    | Description                                  |
| -------- | -------------------------------------------- |
| `status` | Filter status: `todo`, `in_progress`, `done` |
| `search` | Search by title                              |
| `page`   | Default `1`                                  |
| `limit`  | Default `10`, max `100`                      |

Response `200`:

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "title": "Implement task API",
      "status": "todo"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalData": 1,
    "totalPage": 1
  }
}
```

---

### Detail Task

```http
GET /tasks/:id
Authorization: Bearer <token>
```

Response `200`:

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Implement task API",
    "description": "Create CRUD API using Express.js + TypeScript",
    "status": "todo"
  }
}
```

---

### Update Task

```http
PUT /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "title": "Implement task API v2",
  "status": "in_progress"
}
```

Response `200`:

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Implement task API v2",
    "status": "in_progress"
  }
}
```

---

### Delete Task

```http
DELETE /tasks/:id
Authorization: Bearer <token>
```

Response:

```text
204 No Content
```

---

### Assign Task to Another User in Same Team

```http
POST /tasks/:id/assign
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "assigneeId": "user-uuid"
}
```

Rules:

- Task hanya bisa di-assign oleh owner task.
- Assignee harus user dalam tim yang sama.
- Proses assign berjalan dalam satu database transaction:
  1. Update `assigneeId` di tabel `tasks`
  2. Insert riwayat perubahan ke tabel `task_logs`
  3. Kirim notifikasi mock/log
- Jika salah satu step gagal, seluruh operasi rollback.

Response `200`:

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Implement task API",
    "assigneeId": "user-uuid"
  }
}
```

## Format Error Response

Semua error response menggunakan format konsisten:

```json
{
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Validation error",
  "timestamp": "2026-06-13T03:00:00.000Z",
  "details": [
    {
      "field": "body.title",
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

Contoh error code:

| HTTP Status | Code                        |
| ----------- | --------------------------- |
| 401         | `UNAUTHORIZED`              |
| 401         | `INVALID_CREDENTIALS`       |
| 403         | `ASSIGNEE_NOT_IN_SAME_TEAM` |
| 404         | `TASK_NOT_FOUND`            |
| 409         | `EMAIL_ALREADY_REGISTERED`  |
| 409         | `IDEMPOTENCY_KEY_REUSED`    |
| 422         | `VALIDATION_ERROR`          |
| 500         | `INTERNAL_SERVER_ERROR`     |

Stack trace atau detail internal tidak di-expose di production.

## Structured Logging & Observability

Setiap request menghasilkan structured log JSON dengan field minimal:

```json
{
  "request_id": "uuid",
  "method": "POST",
  "path": "/tasks",
  "status_code": 201,
  "latency_ms": 24.12
}
```

Log level:

- `INFO` untuk response normal 2xx/3xx
- `WARN` untuk client error 4xx
- `ERROR` untuk server error 5xx

Header `X-Request-Id` otomatis dibuat jika client tidak mengirimkannya.

## Database Design Singkat

### `teams`

Menyimpan data tim.

### `users`

Menyimpan user, email, password hash, dan `teamId`.

### `tasks`

Menyimpan task milik user.

Field penting:

- `ownerId`: pemilik task
- `assigneeId`: user yang sedang di-assign task
- `teamId`: tim task
- `status`: `todo`, `in_progress`, `done`

### `task_logs`

Menyimpan riwayat perubahan task, terutama assign task.

### `idempotency_keys`

Menyimpan response dari request pertama untuk `POST /tasks`.

Field penting:

- `key`
- `userId`
- `method`
- `path`
- `requestHash`
- `statusCode`
- `responseBody`
- `expiresAt`

Unique constraint pada kombinasi:

```text
key + userId + method + path
```

## Penjelasan Arsitektur Singkat

Project menggunakan layered architecture agar logic mudah dites dan dirawat.

```text
src/
  app.ts                  Express app composition
  server.ts               Bootstrap server + DB connection
  config/                 Environment & database config
  controllers/            HTTP handler
  routes/                 Route definition
  services/               Business logic
  repositories/           Database access abstraction
  models/                 Sequelize model & association
  middleware/             Auth, validation, logging, error handler
  validators/             Zod validation schema
  types/                  Shared DTO, repository ports, Express type augmentation
  utils/                  Helper, logger, error class, mutex

tests/
  unit/                   Unit test without DB/external service
```

Alur request umum:

```text
Request -> Middleware -> Validator -> Controller -> Service -> Repository -> Database
```

Keuntungan:

- Controller tetap tipis.
- Business logic berada di service.
- Type DTO dan repository port lebih jelas.
- Repository bisa diganti mock/stub saat unit test.
- Idempotency dan transaction logic dapat dites tanpa database eksternal.

## Catatan Security Basic Practice

- Password tidak disimpan plain text, tetapi di-hash menggunakan bcrypt.
- JWT secret menggunakan environment variable.
- Endpoint task dilindungi middleware authentication.
- User hanya bisa mengakses task miliknya sendiri.
- Validation menggunakan Zod.
- Error production tidak menampilkan stack trace.
- Helmet dan rate limit diaktifkan.

## Unit Test yang Dicakup

Fokus utama sesuai requirement soal:

- Sequential duplicate: request pertama membuat task, request kedua dengan `Idempotency-Key` sama mengembalikan response identik.
- Concurrent duplicate: 25 request paralel dengan key sama hanya membuat tepat 1 task.
- Same key different payload: key sama dengan body berbeda ditolak `409 IDEMPOTENCY_KEY_REUSED`.

Command:

```bash
npm test
```

## Contoh Flow Testing Manual

### 1. Register user pertama

```bash
curl --location 'http://localhost:3000/auth/register' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "name": "Juan",
    "email": "juan@example.com",
    "password": "password123",
    "teamName": "Engineering"
  }'
```

### 2. Register user kedua dalam tim yang sama

```bash
curl --location 'http://localhost:3000/auth/register' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "name": "Budi",
    "email": "budi@example.com",
    "password": "password123",
    "teamName": "Engineering"
  }'
```

### 3. Create task dengan idempotency key

```bash
curl --location 'http://localhost:3000/tasks' \
  --header 'Authorization: Bearer <token-juan>' \
  --header 'Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000' \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "Build API",
    "description": "Express.js + TypeScript task API",
    "status": "todo"
  }'
```

Kirim command yang sama berkali-kali dengan key dan body yang sama. API akan mengembalikan response yang sama dan tidak membuat task duplikat.

### 4. Assign task ke user kedua

```bash
curl --location 'http://localhost:3000/tasks/<task-id>/assign' \
  --header 'Authorization: Bearer <token-juan>' \
  --header 'Content-Type: application/json' \
  --data '{
    "assigneeId": "<user-id-budi>"
  }'
```
