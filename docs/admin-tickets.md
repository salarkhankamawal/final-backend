# Admin Tickets API

View ticket details and retrieve printable ticket data for agency staff.

**Base path:** `/api/admin/tickets`  
**Auth:** Bearer JWT required on all endpoints

> Tickets are created automatically when a booking is **confirmed**. Use the ticket `_id` returned in the confirm response or from customer ticket history.

---

## Get Ticket

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/tickets/:id` |
| **Auth** | Bearer JWT |

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Ticket MongoDB `_id` |

### Example Request

```http
GET /api/admin/tickets/665f1a2b3c4d5e6f7a8b9c11
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c11",
    "ticketNumber": "TK1A2B3C4D5E6",
    "ticketStatus": "Confirmed",
    "seatNumber": "E1",
    "seatClass": "Economy",
    "fareAmount": 350,
    "issueDate": "2026-06-20T11:00:00.000Z",
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
      "arrivalTime": "11:25",
      "duration": "3h 25m",
      "airline": {
        "airlineName": "EK",
        "iataCode": "EK"
      }
    },
    "booking": {
      "bookingReference": "BK1A2B3C4D5",
      "bookingStatus": "Confirmed",
      "grandTotal": 350,
      "currency": "USD",
      "customer": {
        "phone": "0700123456",
        "name": "John Doe"
      }
    },
    "issuedBy": {
      "fullName": "Ahmad Khan",
      "email": "ahmad@agency.com",
      "agencyName": "Kabul Travel Co."
    }
  }
}
```

### Ticket Status Values

| Status | Description |
|--------|-------------|
| `Issued` | Ticket created |
| `Confirmed` | Confirmed and valid |
| `Checked-In` | Passenger checked in |
| `Boarded` | Passenger boarded |
| `Completed` | Journey completed |
| `Cancelled` | Ticket cancelled |
| `Refunded` | Ticket refunded |

### Error Responses

| Status | Condition |
|--------|-----------|
| `404` | Ticket not found |

---

## Print Ticket

Return a flat, print-friendly ticket payload suitable for rendering a boarding pass or ticket PDF in the frontend.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/tickets/:id/print` |
| **Auth** | Bearer JWT |

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Ticket MongoDB `_id` |

### Example Request

```http
GET /api/admin/tickets/665f1a2b3c4d5e6f7a8b9c11/print
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "ticketNumber": "TK1A2B3C4D5E6",
    "bookingReference": "BK1A2B3C4D5",
    "status": "Confirmed",
    "passenger": {
      "name": "John Doe",
      "age": 30,
      "passportNumber": "P1234567"
    },
    "flight": {
      "number": "EK301-2026-08-15",
      "airline": "EK",
      "airlineCode": "EK",
      "origin": "KBL (KBL)",
      "destination": "DXB (DXB)",
      "departureDate": "2026-08-15T08:00:00.000Z",
      "departureTime": "08:00",
      "arrivalDate": "2026-08-15T11:25:00.000Z",
      "arrivalTime": "11:25",
      "duration": "3h 25m"
    },
    "seat": {
      "number": "E1",
      "class": "Economy"
    },
    "fare": {
      "amount": 350,
      "currency": "USD"
    },
    "issuedAt": "2026-06-20T11:00:00.000Z",
    "issuedBy": "Ahmad Khan"
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `404` | Ticket not found |

---

## Public vs Admin Ticket Access

| Action | Public | Admin |
|--------|--------|-------|
| Verify by booking ref + phone/passport | `GET /api/tickets/verify` | — |
| Full ticket details | — | `GET /api/admin/tickets/:id` |
| Print layout data | — | `GET /api/admin/tickets/:id/print` |
