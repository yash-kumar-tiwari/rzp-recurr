# SubscriptionHub — Razorpay Subscription Management

A production-style full-stack SaaS Subscription Management application built with **Next.js**, **Node.js/Express**, **MongoDB**, and **Razorpay Auto Recurring APIs**.

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js (latest) · Tailwind CSS v4 · shadcn/ui · Redux Toolkit + RTK Query · React Hook Form + Zod · Framer Motion |
| Backend | Node.js · Express.js · MongoDB + Mongoose · JWT Auth |
| Payments | Razorpay Subscription APIs |

---

## Project Structure

```
razorpay-auto-recurr/
├── server/          # Express API
│   ├── src/
│   │   ├── configs/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/     # Seed script
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   ├── .env.example
│   └── server.js
└── client/          # Next.js App
    ├── app/
    │   ├── (auth)/    login, signup
    │   └── (dashboard)/  dashboard, plans, payment-history
    ├── components/
    ├── hooks/
    ├── lib/
    ├── providers/
    └── store/         Redux + RTK Query
```

---

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`)
- [Razorpay Account](https://razorpay.com/) (test mode)

---

## Setup Guide

### 1. Clone and navigate

```bash
cd razorpay-auto-recurr
```

### 2. Backend Setup

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your values:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/razorpay_subscriptions
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Install dependencies:

```bash
npm install
```

### 3. Create Razorpay Plans (Seed)

This script creates 3 subscription plans on Razorpay and saves them to MongoDB:

```bash
npm run seed
```

> ✅ Run this once. It's idempotent — safe to re-run.

Expected output:
```
✅ MongoDB connected
🔄 Creating Razorpay plan: Basic...
  ✅ Razorpay plan created: plan_xxxxxxxxxxxx
  ✅ Plan saved to MongoDB: basic
🔄 Creating Razorpay plan: Pro...
...
🎉 Seeding complete! All 3 plans are ready.
```

### 4. Start Backend

```bash
npm run dev
```

Server starts at `http://localhost:3001`

### 5. Frontend Setup

```bash
cd ../client
cp .env.local.example .env.local
```

Edit `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

Install dependencies:

```bash
npm install
```

Start frontend:

```bash
npm run dev
```

App runs at `http://localhost:3000`

---

## Webhook Setup (Local Development)

For webhooks to work locally, you need to expose your server using **ngrok**:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3001
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`).

**Configure in Razorpay Dashboard:**
1. Go to Settings → Webhooks
2. Click **Add New Webhook**
3. URL: `https://abc123.ngrok.io/api/webhooks/razorpay`
4. Secret: Same value as `RAZORPAY_WEBHOOK_SECRET` in your `.env`
5. Events to subscribe:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `subscription.completed`
   - `subscription.halted`
   - `payment.failed`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ✗ | Register user |
| POST | `/api/auth/login` | ✗ | Login, returns JWT |
| POST | `/api/auth/logout` | ✓ | Logout |
| GET | `/api/plans` | ✗ | List all plans |
| GET | `/api/subscriptions/me` | ✓ | Get my subscription |
| POST | `/api/subscriptions` | ✓ | Create subscription |
| PATCH | `/api/subscriptions/upgrade` | ✓ | Upgrade plan |
| DELETE | `/api/subscriptions/cancel` | ✓ | Cancel subscription |
| GET | `/api/payments/history` | ✓ | Payment history |
| POST | `/api/webhooks/razorpay` | ✗ | Webhook receiver |

---

## Test Cards (Razorpay Test Mode)

| Card Number | Type |
|-------------|------|
| `4111 1111 1111 1111` | Visa (Success) |
| `5267 3181 8797 5449` | Mastercard (Success) |
| `4000 0000 0000 0002` | Visa (Declined) |

- CVV: Any 3 digits
- Expiry: Any future date
- OTP: `1234` (test)

---

## Razorpay Subscription Flow

```
1. User clicks "Subscribe" on a plan
2. POST /api/subscriptions → Razorpay subscription created (status: created)
3. Razorpay checkout modal opens
4. User completes card authentication
5. Razorpay fires webhook: subscription.activated
6. Server updates DB: status → active
7. Dashboard shows active subscription
```

---

## Features

- ✅ Register / Login with JWT auth
- ✅ View 3 pricing plans (Basic · Pro · Enterprise)
- ✅ Subscribe via Razorpay Checkout
- ✅ Upgrade subscription (Basic → Pro → Enterprise)
- ✅ Cancel subscription with confirmation modal
- ✅ View active plan, renewal date, billing cycles
- ✅ Full payment history with pagination
- ✅ Webhook handling (activated, charged, cancelled, completed, halted)
- ✅ Dark / Light mode
- ✅ Responsive design
- ✅ Skeleton loaders, toast notifications, empty states

---

## Environment Variables Reference

### `server/.env`

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (keep secure) |
| `JWT_EXPIRES_IN` | Token validity (default: 7d) |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature secret |
| `CLIENT_URL` | Frontend URL for CORS |

### `client/.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public Razorpay key (safe to expose) |
