---
title: "ClearTax: Bulk Invoice Upload & Processing System"
author: "Nirbhay & Priyanshu Dolwani (Team Leader: Payal Vats)"
date: "2026-08-05"
---

# ClearTax: Bulk Invoice Upload System

## 1. Executive Summary
**ClearTax** is a robust, full-stack web application built to streamline and automate the processing of bulk invoice data. By allowing users to upload large CSV files containing invoice records, the system processes them asynchronously in the background. It provides real-time progress tracking, row-level validation, and detailed reconciliation reports, effectively eliminating manual auditing errors.

---

## 2. Key Features & Capabilities

* **Bulk CSV Uploads:** Users can easily upload single or multiple CSV files containing hundreds of invoice records.
* **Asynchronous Background Processing:** Heavy data processing is offloaded to a background job queue, ensuring the UI remains blazing fast and non-blocking.
* **Real-time Progress Tracking:** Users see live updates as their files are being processed.
* **Fault-Tolerant Row Processing:** The system evaluates every row independently. If one row fails validation, it does not stop or fail the rest of the batch.
* **Granular Validation & Reconciliation:** Every invoice gets categorized as a **Match (✅)** or **Mismatch (❌)** based on business logic, with exact error messages provided for failures.
* **Interactive Results Table:** A scrollable, filterable results table for reviewing processed invoices.
* **Responsive UI:** Fully optimized for both desktop and mobile viewing.

---

## 3. Architecture & Tech Stack

The project is structured as a **Monorepo**, cleanly separating the frontend client from the backend API server.

### Frontend (Client)
* **Framework:** Next.js (App Router) & React 19
* **State Management & Data Fetching:** Zustand & React Query (@tanstack/react-query)
* **Styling & UI:** Tailwind CSS, Radix UI, Framer Motion (for animations)
* **Data Visualization:** Recharts (for dashboard analytics)
* **Form Handling:** React Hook Form & Zod

### Backend (Server)
* **Framework:** Node.js with Express.js
* **Job Queuing & Background Workers:** BullMQ & Redis (ioredis)
* **Database & ORM:** PostgreSQL & Prisma ORM
* **Authentication:** JWT (JSON Web Tokens) & bcryptjs
* **File Handling:** Multer (upload handling) & PapaParse (CSV parsing)

---

## 4. System Workflow

The architecture is designed for high throughput and reliability:

1. **Upload Initiation:** User selects and uploads a CSV file via the Next.js frontend.
2. **File Reception:** The Express server receives the file using Multer.
3. **Queueing (BullMQ):** Instead of processing the file immediately, the server creates a Job and pushes it to a Redis-backed queue (BullMQ), immediately returning a `jobId` to the client.
4. **Background Processing:** A background worker picks up the job, parses the CSV using PapaParse, and processes the rows in chunks.
5. **Validation:** Each row is checked against business rules (e.g., tax calculation correctness).
6. **Data Persistence:** The Prisma ORM saves the results into the PostgreSQL database, marking rows as `Match`, `Mismatch`, or `Failed`.
7. **Client Updates:** The frontend polls or uses WebSockets/SSE to fetch job progress using the `jobId` and updates the progress bar in real-time.

---

## 5. Technical Highlights & Business Value

### Why This Architecture?
* **Scalability:** By using **BullMQ** and **Redis**, the system can handle thousands of rows without crashing the Node.js event loop. If traffic spikes, we can simply spin up more worker nodes.
* **User Experience:** Real-time feedback and the use of **React Query** ensure the user is never left wondering about the state of their upload.
* **Resilience:** The independent row-processing logic means data integrity is maintained even if partial data is corrupt. Users can download the failed rows, fix them, and re-upload just the failed delta.

### Summary
ClearTax transforms a tedious, manual data-entry task into a seamless, automated workflow, empowering financial teams to reconcile invoices faster and with near-perfect accuracy.
