# Testing Scenarios

End-to-end test flows for QA. Execute steps in order within each scenario.

**Prerequisites:**
- Server running (`npm run dev`)
- MongoDB connected
- Amadeus API keys configured in `.env`
- HTTP client (Postman, Insomnia, or curl)

---

## Scenario 1 — Health Check

| Step | Request | Expected |
|------|---------|----------|
| 1 | `GET /api/health` | `200`, `"Travel Agency API is running"` |

---

## Scenario 2 — Agent Registration & Login

| Step | Request | Expected |
|------|---------|----------|
| 1 | `POST /api/auth/register` with valid body | `201`, returns `token` |
| 2 | `POST /api/auth/login` with same credentials | `200`, returns `token` |
| 3 | `GET /api/auth/me` with token | `200`, agent profile returned |
| 4 | `GET /api/auth/me` without token | `401` |
| 5 | `POST /api/auth/register` with duplicate email | `409` |
| 6 | `POST /api/auth/login` with wrong password | `401` |

**Sample register body:**
```json
{
  "firstName": "Test",
  "lastName": "Agent",
  "email": "test.agent@example.com",
  "phone": "0700999888",
  "password": "TestPass123",
  "agencyName": "Test Agency"
}
```

---

## Scenario 3 — Public Flight Search

| Step | Request | Expected |
|------|---------|----------|
| 1 | `GET /api/flights` without params | `400` missing fields |
| 2 | `GET /api/flights?originAirportCode=KBL&destinationAirportCode=DXB&departureDate=2026-09-01` | `200`, `source: "amadeus"`, array of offers |
| 3 | Save an offer `id` from step 2 | — |
| 4 | `GET /api/flights/{offerId}` | `200`, full offer details |
| 5 | `GET /api/flights/suggestions?originAirportCode=KBL&destinationAirportCode=DXB&departureDate=2026-09-01` | `200`, `exactMatches` and/or `suggestions` |
| 6 | `GET /api/flights?...&sort=price_asc` | Results sorted by price |

---

## Scenario 4 — Full Booking Flow (Happy Path)

Use token from Scenario 2.

| Step | Request | Expected |
|------|---------|----------|
| 1 | Search flights (Scenario 3, step 2) | Copy `offerId` |
| 2 | `POST /api/admin/bookings` with `offerId`, passenger, phone | `201`, `bookingStatus: "Pending"`, `bookingReference` saved |
| 3 | `GET /api/admin/bookings` | New booking in list |
| 4 | `GET /api/admin/customers/phone/0700123456` | Customer auto-created |
| 5 | `PATCH /api/admin/bookings/{id}/confirm` | `200`, ticket issued, `bookingStatus: "Confirmed"` |
| 6 | `GET /api/admin/customers/{customerId}/tickets` | Booking + ticket in history |
| 7 | `GET /api/tickets/verify?bookingReference=...&phone=0700123456` | `200`, `verified: true`, ticket returned |

**Sample create booking body:**
```json
{
  "offerId": "<from search>",
  "phone": "0700123456",
  "passenger": {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com",
    "passportNumber": "P1234567"
  },
  "paymentInfo": {
    "method": "Cash",
    "amount": 350
  }
}
```

---

## Scenario 5 — Booking Without Email

| Step | Request | Expected |
|------|---------|----------|
| 1 | Create booking with no `passenger.email` | `201` |
| 2 | Confirm booking | `200`, `email.sent: false`, `reason: "No email provided"` |
| 3 | Ticket still issued | `ticket.ticketNumber` present |

---

## Scenario 6 — Cancel Booking

| Step | Request | Expected |
|------|---------|----------|
| 1 | Create + confirm a booking | Booking confirmed |
| 2 | `PATCH /api/admin/bookings/{id}/cancel` with reason | `200`, `bookingStatus: "Cancelled"`, `paymentStatus: "Refunded"` |
| 3 | Confirm same booking again | `400` cannot confirm cancelled |
| 4 | Verify ticket publicly | May show cancelled status or pending depending on ticket state |

---

## Scenario 7 — Reschedule Booking

| Step | Request | Expected |
|------|---------|----------|
| 1 | Create + confirm a booking | Confirmed |
| 2 | Search flights for a different date | New `offerId` |
| 3 | `PATCH /api/admin/bookings/{id}/reschedule` with `newOfferId` | `200`, `bookingStatus: "Pending"`, new flight attached |
| 4 | Confirm again | New ticket issued |
| 5 | Old ticket status | `Cancelled` |

---

## Scenario 8 — Ticket Verification (Public)

| Step | Request | Expected |
|------|---------|----------|
| 1 | Verify with correct ref + phone | `200`, `verified: true` |
| 2 | Verify with correct ref + passport | `200`, `verified: true` |
| 3 | Verify with wrong phone | `401` |
| 4 | Verify with non-existent ref | `404` |
| 5 | Verify pending booking (not confirmed) | `200`, `ticket: null`, message about contacting agency |
| 6 | Verify without phone or passport | `400` |

---

## Scenario 9 — Print Ticket

| Step | Request | Expected |
|------|---------|----------|
| 1 | Get ticket `_id` from confirm response | — |
| 2 | `GET /api/admin/tickets/{id}/print` | `200`, flat printable object |
| 3 | `GET /api/admin/tickets/{id}` | `200`, full populated ticket |

---

## Scenario 10 — Offer Expiry

| Step | Request | Expected |
|------|---------|----------|
| 1 | Search flights, save `offerId` | — |
| 2 | Wait 30+ minutes (or restart server to clear cache) | — |
| 3 | `POST /api/admin/bookings` with expired `offerId` | `400`, offer expired message |
| 4 | Re-search and book with fresh `offerId` | `201` |

---

## Scenario 11 — Admin Authorization

| Step | Request | Expected |
|------|---------|----------|
| 1 | `GET /api/admin/bookings` without token | `401` |
| 2 | `GET /api/admin/bookings` with invalid token | `401` |
| 3 | `GET /api/flights` without token | `200` (public, no auth) |

---

## Negative Test Checklist

| Test | Endpoint | Expected Status |
|------|----------|-----------------|
| Create booking without offerId/flightId | `POST /api/admin/bookings` | `400` |
| Create booking without passenger name | `POST /api/admin/bookings` | `400` |
| Confirm already confirmed booking | `PATCH .../confirm` | `400` |
| Cancel already cancelled booking | `PATCH .../cancel` | `400` |
| Reschedule without newOfferId | `PATCH .../reschedule` | `400` |
| Get non-existent booking | `GET /api/admin/bookings/{badId}` | `404` |
| Update non-existent customer | `PUT /api/admin/customers/{badId}` | `404` |

---

## Environment Variables Checklist

| Variable | Required For |
|----------|--------------|
| `MONGODB_URI` | All endpoints |
| `JWT_SECRET` | Auth & admin endpoints |
| `AMADEUS_API_KEY` | Flight search |
| `AMADEUS_API_SECRET` | Flight search |
| `RESEND_API_KEY` | Ticket email on confirm |
| `RESEND_FROM_EMAIL` | Ticket email on confirm |
