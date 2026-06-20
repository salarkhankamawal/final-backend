# Admin Bookings API

Manage customer bookings. Bookings are created by agents on behalf of customers. Confirming a booking issues a ticket and optionally emails it via Resend.

**Base path:** `/api/admin/bookings`  
**Auth:** Bearer JWT required on all endpoints

---

## List Bookings

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/bookings` |
| **Auth** | Bearer JWT |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by booking status |

**Booking status values:** `Pending`, `Confirmed`, `Ticketed`, `Cancelled`, `Completed`

### Example Request

```http
GET /api/admin/bookings?status=Pending
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c0f",
      "bookingReference": "BK1A2B3C4D5",
      "bookingStatus": "Pending",
      "paymentStatus": "Paid",
      "grandTotal": 350,
      "currency": "USD",
      "passenger": {
        "name": "John Doe",
        "age": 30,
        "email": "john@example.com",
        "passportNumber": "P1234567"
      },
      "customer": {
        "_id": "...",
        "phone": "0700123456",
        "name": "John Doe"
      },
      "flight": {
        "flightNumber": "EK301-2026-08-15",
        "originAirportCode": "KBL",
        "destinationAirportCode": "DXB",
        "airline": { "airlineName": "EK", "iataCode": "EK" }
      },
      "agent": {
        "fullName": "Ahmad Khan",
        "email": "ahmad@agency.com"
      },
      "createdAt": "2026-06-20T10:30:00.000Z"
    }
  ]
}
```

---

## Get Booking

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/bookings/:id` |
| **Auth** | Bearer JWT |

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | MongoDB booking `_id` |

### Example Request

```http
GET /api/admin/bookings/665f1a2b3c4d5e6f7a8b9c0f
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

Returns a single booking object (same shape as list item).

### Error Responses

| Status | Condition |
|--------|-----------|
| `404` | Booking not found |

---

## Create Booking

Create a booking on behalf of a customer. Auto-creates or updates the customer record by phone number.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/admin/bookings` |
| **Auth** | Bearer JWT |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `offerId` | string | Yes* | Offer `id` from flight search |
| `flightId` | string | Yes* | Existing flight MongoDB `_id` (legacy) |
| `phone` | string | Yes | Customer contact number (unique key) |
| `passenger.name` | string | Yes | Passenger full name |
| `passenger.age` | number | Yes | Passenger age |
| `passenger.passportNumber` | string | Yes | Passport number |
| `passenger.email` | string | No | Email for ticket delivery on confirm |
| `seatClass` | string | No | Override seat class (default from offer) |
| `discount` | number | No | Discount amount (default: `0`) |
| `paymentInfo.method` | string | No | `Cash`, `Card`, `Bank Transfer`, `Other` |
| `paymentInfo.amount` | number | No | Amount paid (defaults to fare) |
| `paymentInfo.transactionId` | string | No | Payment reference |
| `paymentInfo.notes` | string | No | Payment notes |

\* Provide `offerId` (recommended) **or** `flightId`.

### Example Request

```http
POST /api/admin/bookings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "offerId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "phone": "0700123456",
  "passenger": {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com",
    "passportNumber": "P1234567"
  },
  "paymentInfo": {
    "method": "Cash",
    "amount": 350,
    "transactionId": "",
    "notes": "Paid in full at counter"
  },
  "discount": 0
}
```

### Success Response — `201 Created`

```json
{
  "success": true,
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c0f",
    "bookingReference": "BK1A2B3C4D5",
    "bookingStatus": "Pending",
    "paymentStatus": "Paid",
    "grandTotal": 350,
    "passenger": { },
    "customer": { },
    "flight": { },
    "agent": { }
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Missing required fields, no seats, offer expired, or flight cancelled |
| `404` | Flight not found |

---

## Confirm Booking

Confirm a pending booking, issue a ticket, and send email if passenger email is set.

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/bookings/:id/confirm` |
| **Auth** | Bearer JWT |

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Booking `_id` |

### Request Body

None required.

### Example Request

```http
PATCH /api/admin/bookings/665f1a2b3c4d5e6f7a8b9c0f/confirm
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "booking": {
      "bookingReference": "BK1A2B3C4D5",
      "bookingStatus": "Confirmed"
    },
    "ticket": {
      "ticketNumber": "TK1A2B3C4D5E6",
      "ticketStatus": "Confirmed",
      "seatNumber": "E1",
      "seatClass": "Economy"
    },
    "email": {
      "sent": true,
      "id": "resend-email-id"
    }
  }
}
```

Email object when no email on file:

```json
{
  "email": {
    "sent": false,
    "reason": "No email provided"
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Already confirmed, cancelled, or ticket already issued |
| `404` | Booking not found |

---

## Cancel Booking

Cancel a booking and restore the seat. Cancels associated tickets.

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/bookings/:id/cancel` |
| **Auth** | Bearer JWT |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cancelReason` | string | No | Reason for cancellation |

### Example Request

```http
PATCH /api/admin/bookings/665f1a2b3c4d5e6f7a8b9c0f/cancel
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "cancelReason": "Customer requested cancellation"
}
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "bookingReference": "BK1A2B3C4D5",
    "bookingStatus": "Cancelled",
    "paymentStatus": "Refunded",
    "cancelledAt": "2026-06-20T12:00:00.000Z",
    "cancelReason": "Customer requested cancellation"
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Booking already cancelled |
| `404` | Booking not found |

---

## Reschedule Booking

Move a booking to a different flight. Previous tickets are cancelled; booking returns to `Pending` if it was confirmed.

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/bookings/:id/reschedule` |
| **Auth** | Bearer JWT |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `newOfferId` | string | Yes* | New offer `id` from flight search |
| `newFlightId` | string | Yes* | Existing flight MongoDB `_id` |

\* Provide `newOfferId` (recommended) **or** `newFlightId`.

### Example Request

```http
PATCH /api/admin/bookings/665f1a2b3c4d5e6f7a8b9c0f/reschedule
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "newOfferId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "bookingReference": "BK1A2B3C4D5",
    "bookingStatus": "Pending",
    "rescheduledAt": "2026-06-20T13:00:00.000Z",
    "grandTotal": 320,
    "flight": { },
    "previousFlight": { }
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Cancelled booking, no seats, offer expired |
| `404` | Booking or new flight not found |

---

## Booking Lifecycle

```
Pending  ──confirm──▶  Confirmed  ──▶  Completed
   │                       │
   └──── cancel ───────────┴──── cancel ────▶  Cancelled

Reschedule (from Confirmed) ──▶  Pending  (re-confirm required)
```
