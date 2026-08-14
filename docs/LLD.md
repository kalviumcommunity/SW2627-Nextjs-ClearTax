# Low-Level Design (LLD) - ClearTax Bulk Invoice Processor

## 1. Database Schema (Prisma / PostgreSQL)

The backend utilizes Prisma as an ORM to interact with a PostgreSQL database.

### 1.1 `User` Table
Stores user credentials and profile information.
- `id` (Int, PK, Auto-increment)
- `name` (String)
- `email` (String, Unique)
- `password` (String, hashed via `bcryptjs`)
- `role` (Enum: `USER`, `ADMIN`)

### 1.2 `UploadBatch` Table
Represents a single CSV file upload job. Tracks the progress of the background worker.
- `id` (Int, PK, Auto-increment)
- `fileName` (String) - path or UUID of the stored file
- `originalFileName` (String)
- `totalRows` (Int, default: 0)
- `processedRows` (Int, default: 0)
- `successfulRows` (Int, default: 0)
- `failedRows` (Int, default: 0)
- `userId` (Int, FK to `User.id`)
- `status` (Enum: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`)

### 1.3 `Invoice` Table
Stores individual invoice records parsed from the CSV.
- `id` (Int, PK, Auto-increment)
- `invoiceNumber` (String)
- `vendor` (String)
- `amount` (Float)
- `errorMessage` (String, nullable) - populated if the row failed validation
- `uploadBatchId` (Int, FK to `UploadBatch.id`)
- `status` (Enum: `PENDING`, `MATCHED`, `MISMATCHED`, `FAILED`)

---

## 2. Server Architecture (Express.js)

The server utilizes a layered architecture to separate concerns.

### 2.1 Routing (`src/routes/`)
Defines the API endpoints and maps them to controllers/services.
- `POST /api/auth/login` -> Auth Service
- `POST /api/auth/signup` -> Auth Service
- `POST /api/upload` -> File Upload Service (protected by JWT middleware)
- `GET /api/jobs/:id` -> Job Status Service (protected by JWT middleware)

### 2.2 Middleware (`src/middleware/`)
- `authMiddleware.js`: Verifies the JWT token from the `Authorization` header. If valid, attaches the `userId` to the `req` object. If invalid, returns `401 Unauthorized`.
- `uploadMiddleware.js`: Configures `multer` for handling `multipart/form-data`. Defines storage limits and file type validations (e.g., ensuring it's a `.csv`).

### 2.3 Services (`src/services/`)
Contains business logic.
- `AuthService`: Handles password hashing (`bcryptjs`), token generation (`jsonwebtoken`), and user creation.
- `UploadService`: Creates the `UploadBatch` in the DB and adds a job to the BullMQ queue.

### 2.4 Background Processing (`src/workers/` & `src/queues/`)
- **Queue Initialization**: A BullMQ `Queue` instance is created, connected to a Redis URL.
- **Worker Process**: A BullMQ `Worker` listens on the queue. 
  - When a job (containing `batchId` and `fileName`) arrives, the worker fetches the file.
  - It uses `papaparse` to stream the CSV row-by-row.
  - Validation (via `zod` or custom logic) checks the row.
  - Valid rows are added to a batch array. When the array reaches a chunk size (e.g., 500 rows), `prisma.invoice.createMany` is called to insert them.
  - It uses `setInterval` or chunk-based triggers to periodically update the `UploadBatch` progress in the DB.

---

## 3. Client Architecture (Next.js)

### 3.1 Global State Management (`src/store/`)
Uses `Zustand` for simple, unopinionated client state.
- `useAuthStore`: Stores `{ user, token, isAuthenticated }`. Persists to `localStorage` or `sessionStorage` for session recovery across reloads.
- `useUploadStore`: Stores temporary UI state during drag-and-drop operations (e.g., `isDragging`, `selectedFile`, `uploadProgress`).

### 3.2 Data Fetching & Caching (`src/hooks/`)
Uses `React Query (@tanstack/react-query)` to manage server state and polling.
- `useJobStatus(jobId)`: A custom hook that uses `useQuery`. When a job is active, it configures `refetchInterval: 2000` to poll the API every 2 seconds. When the job status turns `COMPLETED` or `FAILED`, the `refetchInterval` is set to `false` to stop polling.

### 3.3 Axios Interceptors (`src/lib/axios.js`)
An Axios instance is configured for all backend communication.
- **Request Interceptor**: Retrieves the token from `useAuthStore` and attaches it to the headers.
- **Response Interceptor**: Catches global errors. If a `401 Unauthorized` is returned, it automatically triggers a logout action in `useAuthStore` and redirects the user to `/login`.
