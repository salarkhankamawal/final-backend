# Admin Customers API

Manage customer records. Customers are automatically created or updated when bookings are made, keyed by **phone number**.

**Base path:** `/api/admin/customers`  
**Auth:** Bearer JWT required on all endpoints

---

## List Customers

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/customers` |
| **Auth** | Bearer JWT |

### Example Request

```http
GET /api/admin/customers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c10",
      "phone": "0700123456",
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "passportNumber": "P1234567",
      "createdAt": "2026-06-20T10:30:00.000Z",
      "updatedAt": "2026-06-20T10:30:00.000Z"
    }
  ]
}
```

---

## Find Customer by Phone

Look up a customer using their contact number.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/customers/phone/:phone` |
| **Auth** | Bearer JWT |

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `phone` | string | Customer phone number (exact match) |

### Example Request

```http
GET /api/admin/customers/phone/0700123456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c10",
    "phone": "0700123456",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "passportNumber": "P1234567"
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `404` | Customer not found |

---

## Get Customer

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/customers/:id` |
| **Auth** | Bearer JWT |

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Customer MongoDB `_id` |

### Example Request

```http
GET /api/admin/customers/665f1a2b3c4d5e6f7a8b9c10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c10",
    "phone": "0700123456",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "passportNumber": "P1234567"
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `404` | Customer not found |

---

## Update Customer

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/admin/customers/:id` |
| **Auth** | Bearer JWT |

### Request Body

All fields optional — only send fields to update.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Customer name |
| `email` | string | Email address |
| `age` | number | Age |
| `passportNumber` | string | Passport number |
| `phone` | string | Phone (must remain unique) |

### Example Request

```http
PUT /api/admin/customers/665f1a2b3c4d5e6f7a8b9c10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "passportNumber": "P9876543"
}
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c10",
    "phone": "0700123456",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "passportNumber": "P9876543"
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `404` | Customer not found |
| `400` | Validation error (e.g. duplicate phone) |

---

## Customer Ticket History

Get all bookings and tickets for a customer.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/customers/:id/tickets` |
| **Auth** | Bearer JWT |

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Customer MongoDB `_id` |

### Example Request

```http
GET /api/admin/customers/665f1a2b3c4d5e6f7a8b9c10/tickets
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "customer": {
      "_id": "665f1a2b3c4d5e6f7a8b9c10",
      "phone": "0700123456",
      "name": "John Doe"
    },
    "bookings": [
      {
        "bookingReference": "BK1A2B3C4D5",
        "bookingStatus": "Confirmed",
        "grandTotal": 350,
        "flight": {
          "originAirportCode": "KBL",
          "destinationAirportCode": "DXB",
          "airline": { "airlineName": "EK" }
        }
      }
    ],
    "tickets": [
      {
        "ticketNumber": "TK1A2B3C4D5E6",
        "ticketStatus": "Confirmed",
        "seatNumber": "E1",
        "flight": { },
        "booking": { }
      }
    ]
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `404` | Customer not found |
