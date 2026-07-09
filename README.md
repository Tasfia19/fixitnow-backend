# FixItNow Backend API 🔧

**"Your Trusted Home Service Platform"**

FixItNow is a robust backend REST API built with Node.js, Express, TypeScript, and Prisma (PostgreSQL), with Stripe integrated for home services marketplace booking payments. Customers can browse services, hire technicians, submit secure card payments, track booking progress, and leave reviews. Technicians can manage service profiles, services, availability slots, and jobs. Admins moderate users, browse all bookings, and create categories.

---

## 🛠️ Technology Stack

- **Runtime Environment**: Node.js (v24+)
- **Server Framework**: Express.js
- **Programming Language**: TypeScript
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) & BcryptJS (password hashing)
- **Input Validation**: Zod
- **Payment Processing**: Stripe API (Checkout Sessions & Session Verification)

---

## 🔑 Administrative & Test Credentials

The database comes pre-seeded with the following credentials for testing each role:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| **Admin** | `admin@fixitnow.com` | `admin123` | Platform Moderator (ban users, oversee categories) |
| **Customer** | `customer@fixitnow.com` | `customer123` | Regular customer account |
| **Customer 2** | `tasfi@fixitnow.com` | `customer123` | Regular customer account |
| **Technician 1** | `plumber@fixitnow.com` | `tech123` | Technician profile (Mario Bros - Plumber) |
| **Technician 2** | `electrician@fixitnow.com` | `tech123` | Technician profile (Nikola Tesla - Electrician) |

---

## 🚀 Installation & Setup

Follow these steps to run the backend API locally:

### 1. Install Dependencies
Run the following command at the root of the project to install all npm packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file at the root of the folder based on `.env.example`:
```env
PORT=5000
DATABASE_URL=postgres://507cbd3ffaa89632673f51f54a6857ce65be103947170072a047a8bde6993d2d:sk_WmIZeUtjwF5f1nqxaOJqK@pooled.db.prisma.io:5432/postgres?sslmode=require
JWT_SECRET=super_secret_jwt_key_for_fixitnow_api_123!
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_51OpB3s... # Your Stripe Test Secret Key
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=development
```

### 3. Run Database Migrations
Prisma will apply migrations and synchronize the PostgreSQL schema:
```bash
npx prisma migrate dev --name init
```

### 4. Seed the Database
Seed the database with default users, categories, services, completed bookings, reviews, and admin credentials:
```bash
npm run seed
```

### 5. Start Development Server
Start the Express API server in hot-reload development mode:
```bash
npm run dev
```
The server will boot on http://localhost:5000.

---

## 🗃️ Git History Automation (Mandatory 20 Commits)

If you are running the project locally and need to generate the **20 mandatory Git commits with descriptive messages** in your local git history before pushing to GitHub, you can execute our automated PowerShell script:

```powershell
# Open PowerShell in the project root directory
.\run-commits.ps1
```
This script will safely back up your files, initialize a clean git repository, copy files back component-by-component, and commit each stage in chronological order to generate exactly 20 meaningful commits in your history!

---

## 📚 API Endpoints Summary

### 🔑 Authentication (`/api/auth`)
- `POST /register`: Registers customer or technician user.
- `POST /login`: Logs in user, returns signed JWT.
- `GET /me`: Returns details of current authenticated user.

### 🌎 Public Exploration
- `GET /api/services`: List services with filters (`categoryId`, `location`, `rating`, `priceMin`, `priceMax`, `search`).
- `GET /api/technicians`: List technicians with filters (`location`, `rating`, `skills`, `priceMin`, `priceMax`, `search`).
- `GET /api/technicians/:id`: Retrieve profile of technician, services, and past customer reviews.
- `GET /api/categories`: List all service categories.

### 💼 Bookings (`/api/bookings`)
- `POST /`: Book technician for a specific service and date (Customer only).
- `GET /`: Get current user's bookings (Customer sees theirs, technician sees theirs, admin sees all).
- `GET /:id`: View detailed booking record.
- `PATCH /:id/cancel`: Cancel booking request (Allowed at any point before `IN_PROGRESS`).

### 🛠️ Technician Actions (`/api/technician`)
- `PUT /profile`: Update skills, pricing, bio, and location.
- `PUT /availability`: Set available slots (e.g. `["Monday 09:00-17:00"]`).
- `POST /services`: Add a service offered by this technician.
- `GET /services`: View all services registered by this technician.
- `DELETE /services/:id`: Remove service.
- `GET /bookings`: View bookings requested for this technician.
- `PATCH /bookings/:id`: Accept, decline, start progress, or complete a booking.

### 💳 Payments (`/api/payments`)
- `POST /create`: Generate Stripe checkout URL session for an `ACCEPTED` booking (Customer only).
- `POST /confirm`: Verifies a payment checkout session (updates payment to `COMPLETED` and booking to `PAID`).
- `GET /`: Get payment transaction history.
- `GET /:id`: Get specific transaction details.

### ⭐ Reviews (`/api/reviews`)
- `POST /`: Submit rating (1-5) and feedback comment for a booking after it is marked `COMPLETED`. Automatically recalculates technician's average profile rating.

### 👑 Admin Controls (`/api/admin`)
- `GET /users`: List all platform users (customers, technicians, admins).
- `PATCH /users/:id`: Ban/unban user (preventing login or access).
- `GET /bookings`: View all bookings.
- `GET /categories`: Manage service categories.
- `POST /categories`: Create new category.
