# Authentication API

Agent authentication for agency staff. All `/api/admin/*` endpoints require a valid JWT obtained from register or login.

**Base path:** `/api/auth`

---

## Register Agent

Create a new agent account. Returns a JWT immediately (auto-login).

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/auth/register` |
| **Auth** | None |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | Yes | Agent first name |
| `lastName` | string | Yes | Agent last name |
| `email` | string | Yes | Unique email (login username) |
| `phone` | string | Yes | Contact phone |
| `password` | string | Yes | Plain-text password (hashed server-side) |
| `agencyName` | string | Yes | Travel agency name |
| `role` | string | No | `admin`, `manager`, or `agent` (default: `agent`) |

### Example Request

```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "Ahmad",
  "lastName": "Khan",
  "email": "ahmad@agency.com",
  "phone": "0700123456",
  "password": "SecurePass123",
  "agencyName": "Kabul Travel Co.",
  "role": "admin"
}
```

### Success Response — `201 Created`

```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "665f1a2b3c4d5e6f7a8b9c0d",
      "fullName": "Ahmad Khan",
      "email": "ahmad@agency.com",
      "role": "admin",
      "agencyName": "Kabul Travel Co."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Missing required fields |
| `409` | Email already registered |

---

## Login Agent

Authenticate an existing agent.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/auth/login` |
| **Auth** | None |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered email |
| `password` | string | Yes | Account password |

### Example Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ahmad@agency.com",
  "password": "SecurePass123"
}
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "665f1a2b3c4d5e6f7a8b9c0d",
      "fullName": "Ahmad Khan",
      "email": "ahmad@agency.com",
      "role": "admin",
      "agencyName": "Kabul Travel Co."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Email or password missing |
| `401` | Invalid credentials |
| `403` | Account is inactive or suspended |

---

## Get Current Agent

Return the authenticated agent's profile.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/auth/me` |
| **Auth** | Bearer JWT |

### Example Request

```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c0d",
    "firstName": "Ahmad",
    "lastName": "Khan",
    "fullName": "Ahmad Khan",
    "email": "ahmad@agency.com",
    "phone": "0700123456",
    "role": "admin",
    "agencyName": "Kabul Travel Co.",
    "status": "active",
    "createdAt": "2026-06-20T10:00:00.000Z",
    "updatedAt": "2026-06-20T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Missing, expired, or invalid token |

---

## Using the Token

Include the token on every admin request:

```http
Authorization: Bearer <token>
```

Tokens expire after 7 days by default. Re-login to obtain a new token.
