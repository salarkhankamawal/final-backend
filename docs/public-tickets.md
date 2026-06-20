# Public Tickets API

Allow public users to verify their booking or ticket using booking reference and identity details. **No authentication required.**

**Base path:** `/api/tickets`

---

## Verify Ticket / Booking

Verify a booking or ticket belongs to the user by matching booking reference with phone or passport number.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/tickets/verify` |
| **Auth** | None |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookingReference` | string | Yes | Booking reference (e.g. `BK1A2B3C4D5`) |
| `phone` | string | Conditional | Customer phone — required if `passportNumber` not provided |
| `passportNumber` | string | Conditional | Passenger passport — required if `phone` not provided |

At least one of `phone` or `passportNumber` must be provided.

### Example Request — by phone

```http
GET /api/tickets/verify?bookingReference=BK1A2B3C4D5&phone=0700123456
```

### Example Request — by passport

```http
GET /api/tickets/verify?bookingReference=BK1A2B3C4D5&passportNumber=P1234567
```

---

### Success Response — Ticket issued (`200 OK`)

```json
{
  "success": true,
  "data": {
    "verified": true,
    "status": "Confirmed",
    "ticket": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0e",
      "ticketNumber": "TK1A2B3C4D5E6",
      "ticketStatus": "Confirmed",
      "seatNumber": "E1",
      "seatClass": "Economy",
      "passenger": {
        "name": "John Doe",
        "age": 30,
        "email": "john@example.com",
        "passportNumber": "P1234567"
      },
      "flight": {
        "flightNumber": "EK301-2026-08-15",
        "originAirportCode": "KBL",
        "destinationAirportCode": "DXB",
        "departureDate": "2026-08-15T08:00:00.000Z",
        "departureTime": "08:00",
        "airline": {
          "airlineName": "EK",
          "iataCode": "EK"
        }
      },
      "booking": {
        "bookingReference": "BK1A2B3C4D5",
        "bookingStatus": "Confirmed",
        "grandTotal": 350,
        "currency": "USD"
      }
    },
    "booking": { }
  }
}
```

---

### Success Response — Booking pending, no ticket yet (`200 OK`)

Returned when the booking exists but has not been confirmed by an agent.

```json
{
  "success": true,
  "data": {
    "verified": true,
    "status": "Pending",
    "message": "Booking found but ticket not yet issued. Contact the agency.",
    "booking": {
      "bookingReference": "BK1A2B3C4D5",
      "bookingStatus": "Pending",
      "passenger": {
        "name": "John Doe",
        "passportNumber": "P1234567"
      }
    },
    "ticket": null
  }
}
```

---

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Missing `bookingReference` or both `phone` and `passportNumber` |
| `401` | Identity verification failed — phone/passport does not match |
| `404` | Booking not found |

---

## Verification Logic

The server matches **one of**:

1. `phone` equals the customer's registered phone on the booking, **OR**
2. `passportNumber` equals the passenger passport on the booking or the customer record

Both `bookingReference` and at least one identity field must match for verification to succeed.
