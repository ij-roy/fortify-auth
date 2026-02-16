# Fortify Auth 🔐

A full-stack authentication system built with a strong focus on security, manual implementation, and high test coverage.

This project implements secure Sign-Up and Sign-In flows using HttpOnly cookies, refresh token rotation, reuse detection, and zero third-party authentication libraries.  

---

# 🚀 Project Objective

Develop a full-stack Authentication System with:

- Manual implementation of authentication logic
- Secure token management (no localStorage)
- Custom validation logic
- Refresh + Access token flow
- Table-driven unit testing
- Docker-based full containerization

---

# 🏗️ Architecture Overview

| Layer        | Technology Used |
|-------------|-----------------|
| Frontend    | Next.js (TypeScript) |
| Backend     | NestJS (TypeScript) |
| Database    | PostgreSQL |
| Infra       | Docker & Docker Compose |

The project is structured as a monorepo:

```
fortify-auth
/api      → NestJS backend
/web      → Next.js frontend
/infra    → Docker Compose + DB migrations
```

---

# 🔐 Security Philosophy

This system is designed to be:

- Stateless for access tokens
- Stateful for refresh tokens
- Immune to XSS token theft
- Resistant to refresh token reuse attacks
- Cookie-based (no localStorage)

---

# 🧠 How Authentication Works (High-Level Flow)

### 1️⃣ Signup / Signin

- User submits credentials
- Password is hashed using `crypto.scrypt`
- A session row is created in `auth_sessions`
- Two tokens are issued:
  - Access Token (short-lived)
  - Refresh Token (long-lived, opaque)

Both tokens are stored in **HttpOnly cookies**.

---

### 2️⃣ Access Token

- JWT-like structure
- Signed manually using HMAC-SHA256
- Contains:
  - `sub` (user id)
  - `iat`
  - `exp`
  - `iss`
  - `aud`
  - `jti`
  - `type`

Access token is:

- Short-lived (default 15 minutes)
- Verified on every protected request

---

### 3️⃣ Refresh Token (Rotation Strategy)

Refresh tokens are:

- Random 32-byte opaque values
- Hashed with HMAC before DB storage
- Stored in `refresh_tokens` table
- Linked via `parent_id`

### Rotation Logic:

When `/auth/refresh` is called:

1. Old token is marked `used_at`
2. New refresh token is issued
3. New token references old token as parent

---

### 🔥 Reuse Detection

If an old refresh token is reused:

- All tokens for that session are revoked
- Session is revoked
- Cookies are cleared
- Request returns 401

This prevents token replay attacks.

---

# 📦 Database Schema

### `users`
Stores:
- Email (normalized, unique)
- Name
- Password salt
- Password hash
- Hash parameters

### `auth_sessions`
Represents a login session.

Fields:
- `user_id`
- `revoked_at`
- `user_agent`

### `refresh_tokens`
Tracks refresh token chain.

Fields:
- `token_hash`
- `parent_id`
- `used_at`
- `revoked_at`
- `expires_at`

---

# 🔐 Password Security

Passwords are:

- Hashed using Node.js native `crypto.scrypt`
- Salted per-user
- Verified using `timingSafeEqual`
- Parameterized (N, r, p configurable)

No bcrypt or third-party library used.

---

# 🍪 Cookie Strategy

| Cookie Name   | Purpose | Path | HttpOnly |
|--------------|---------|------|----------|
| `at`         | Access token | `/` | ✅ |
| `rt`         | Refresh token | `/auth/refresh` | ✅ |

Security settings:

- HttpOnly
- SameSite=Strict
- Optional Secure flag via env

No localStorage usage anywhere.

---

# 🧪 Testing Strategy

All core logic is covered by table-driven tests:

### Covered Areas:

- Base64 URL encoding
- Password hashing & verification
- Token signing & verification
- Expiry validation
- Audience & issuer validation
- Refresh rotation logic
- Reuse detection logic

Run tests:

```bash
cd api
npm test
````

Example output:

```
tests 6
pass 6
fail 0
```

---

# 🛡️ Hardening Features

### ✅ Origin Allowlist Guard

Prevents CSRF by restricting POST/PUT/PATCH/DELETE requests to allowed origins.

### ✅ Email Normalization

All emails are lowercased and trimmed before DB storage.

### ✅ Generic Error Messages

Prevents user enumeration attacks.

### ✅ Secure Cookie Handling

All auth tokens stored in HttpOnly cookies.

### ✅ Session Revocation on Logout

Logout revokes session + refresh chain in DB.

---

# 🖥️ Frontend Behavior

### Pages:

* `/signup`
* `/signin`
* `/dashboard` (protected)

### Features:

* Inline validation
* Show/hide password toggle
* Loading states
* Automatic refresh retry on 401
* SSR authentication guard
* Logout handling

No tokens stored in frontend state.

---

# 🔄 Automatic Refresh Handling

Frontend API wrapper:

If any request returns 401:

1. Automatically calls `/auth/refresh`
2. If refresh succeeds → retries original request
3. If refresh fails → redirects to `/signin`

---

# 🐳 Running with Docker

```bash
docker compose -f infra/compose.yaml up --build
```

App URLs:

* Frontend → [http://localhost:3000](http://localhost:3000)
* Backend → [http://localhost:3001](http://localhost:3001)

---

# ⚙️ Environment Variables

`.env.example` (API)

```env
DATABASE_URL=postgres://app:app@db:5432/app

TOKEN_SECRET=change-me
RT_HASH_SECRET=change-me

TOKEN_ISS=api
TOKEN_AUD=web

ACCESS_TTL_SEC=900
REFRESH_TTL_SEC=1209600

COOKIE_SECURE=false
ALLOWED_ORIGINS=http://localhost:3000
```

---

# Thank You For Reading the Above