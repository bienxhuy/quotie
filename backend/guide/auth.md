# Stateless Authentication with JWT (Access + Refresh Tokens)

This guide describes a **production-grade stateless authentication flow** using JWT, with **server-side refresh token storage** and **secure client handling**.

---

## SERVER

### 1. Token types and responsibilities

| Token         | Purpose                | Lifetime         | Stored where                  |
| ------------- | ---------------------- | ---------------- | ----------------------------- |
| Access Token  | Authorize API requests | Short (5–15 min) | Client memory                 |
| Refresh Token | Renew access token     | Long (7–30 days) | DB (hashed) + HttpOnly cookie |

---

### 2. JWT configuration

* **Access token**

  * Signed JWT
  * Contains: `sub`, `role`, `exp`
  * No sensitive data

* **Refresh token**

  * Random, high-entropy string OR JWT
  * Must include expiry
  * **Stored hashed in DB**

Never store raw refresh tokens in DB.

---

### 3. Database schema (minimum viable)

```
refresh_tokens
- id
- user_id
- token_hash
- expires_at
- revoked (boolean)
- created_at
- last_used_at
```

---

### 4. Login flow (`POST /auth/login`)

**Steps:**

1. Validate credentials
2. Generate access token
3. Generate refresh token
4. Hash refresh token
5. Store hashed refresh token in DB
6. Set refresh token as cookie
7. Return access token in response body

**Cookie flags:**

```
HttpOnly
Secure
SameSite=Lax (or Strict)
Path=/auth/refresh
```

**Response:**

```json
{
  "accessToken": "..."
}
```

---

### 5. Authenticated API requests

* Client sends:

  ```
  Authorization: Bearer <access_token>
  ```
* Server:

  * Verifies signature
  * Verifies expiration
  * Extracts user info
* No DB lookup required

If expired:

* Return `401 Unauthorized`
* Do **not** refresh automatically

---

### 6. Refresh flow (`POST /auth/refresh`)

**Steps:**

1. Read refresh token from cookie
2. If missing → `401`
3. Hash incoming refresh token
4. Look up token in DB
5. Validate:

   * not revoked
   * not expired
6. Rotate refresh token

   * Mark the current refresh token as **revoked** (single-use)
   * Generate a **new refresh token** with the **same expiration time**
   * Store the **hash of the new token** and send it to the client (cookie)
7. Issue new access token
8. Set new refresh cookie
9. Return new access token

**Security rules:**

* Refresh tokens are **single-use**
* Reuse = possible theft → revoke all user sessions

---

### 7. Logout (`POST /auth/logout`)

**Steps:**

1. Read refresh token from cookie
2. Hash it
3. Mark matching DB entry as revoked
4. Clear refresh cookie
5. Return `204 No Content`

Logout is now **enforced**, not pretend.

---

### 8. Logout all devices (`POST /auth/logout-all`)

**Steps:**

1. Authenticate user
2. Revoke all refresh tokens for `user_id`
3. Clear current refresh cookie

This is impossible without server-side refresh storage.

---

### 9. Expired refresh token behavior

If refresh token is:

* expired
* revoked
* reused
* missing

Then:

* Return `401 Unauthorized`
* Clear cookie
* Client must redirect to login

No silent recovery. Session is dead.

---

## CLIENT

### 1. Token storage rules

| Token         | Storage                           |
| ------------- | --------------------------------- |
| Access token  | Memory only (JS variable / state) |
| Refresh token | HttpOnly cookie (invisible to JS) |

Never use `localStorage` or `sessionStorage`.

---

### 2. App startup (bootstrap auth)

On app load:

1. Call `/auth/refresh` with `credentials: include`
2. If success:

   * store access token in memory
3. If `401`:

   * ignore. Some features in future will need authorization, it will ask for authentication then. 

This happens **every page reload** by design.

---

### 3. Making API requests

For every protected request:

```
Authorization: Bearer <access_token>
```

If response is `401`:

* Call `/auth/refresh`
* Retry original request once
* If refresh fails → logout

Do not loop infinitely.

---

### 4. Logout flow

When user clicks logout:

1. Call `/auth/logout`
2. Clear access token from memory
3. Redirect to login

Never assume clearing client state is enough.

---

### 5. Multi-tab behavior

Because access tokens are in memory:

* Each tab refreshes independently
* Closing a tab kills its session
* Refresh token persists until logout or expiry

This is acceptable and expected.

---

## SECURITY INVARIANTS (DO NOT BREAK THESE)

* Access tokens are disposable
* Refresh tokens are controlled by server
* No auto-refresh inside normal APIs
* Logout must revoke server state
* Refresh token reuse is a security event

Break these and the system degrades silently.

---

## TL;DR

* Stateless access, **stateful refresh**
* Memory for access tokens
* DB + HttpOnly cookie for refresh tokens
* Explicit refresh endpoint
* Expired refresh token = login again
