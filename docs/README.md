# Travel Agency API — Documentation

REST API for a travel agency booking system. Agency staff (agents) manage bookings and customer records; public users search flights and verify tickets.

---

## Base URL

| Environment | URL |
|-------------|-----|
| Local       | `http://localhost:5000/api` |
| Production  | `{YOUR_HOST}/api` |

---

## Quick Start for Testers

1. Start the server: `npm run dev`
2. Register an agent: `POST /api/auth/register`
3. Copy the `token` from the response
4. Use the token on all **Admin** endpoints: `Authorization: Bearer <token>`
5. Search flights (no auth): `GET /api/flights?originAirportCode=KBL&destinationAirportCode=DXB&departureDate=2026-08-15`
6. Create a booking with the `offerId` from search results: `POST /api/admin/bookings`
7. Confirm the booking: `PATCH /api/admin/bookings/:id/confirm`
8. Verify ticket publicly: `GET /api/tickets/verify?bookingReference=...&phone=...`

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [Authentication](./authentication.md) | Agent register, login, profile |
| [Public — Flights](./public-flights.md) | Search flights, suggestions, offer details |
| [Public — Tickets](./public-tickets.md) | Verify ticket (public users) |
| [Admin — Flights](./admin-flights.md) | Agent flight search (same as public) |
| [Admin — Bookings](./admin-bookings.md) | Create, confirm, cancel, reschedule |
| [Admin — Customers](./admin-customers.md) | Customer records & ticket history |
| [Admin — Tickets](./admin-tickets.md) | Ticket details & print data |
| [Testing Scenarios](./testing-scenarios.md) | End-to-end test flows |

---

## Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes (POST/PUT/PATCH) | Must be `application/json` |
| `Authorization` | Admin endpoints only | `Bearer <JWT token>` |

---

## Response Format

### Success

```json
{
  "success": true,
  "data": { }
}
```

List endpoints may also include `count`:

```json
{
  "success": true,
  "count": 10,
  "data": [ ]
}
```

### Error

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

In development (`NODE_ENV=development`), errors may include a `stack` field.

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded |
| `201` | Created — resource created |
| `400` | Bad Request — validation failed or invalid input |
| `401` | Unauthorized — missing/invalid token or verification failed |
| `403` | Forbidden — account inactive or insufficient permissions |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — duplicate resource (e.g. email already exists) |
| `502` | Bad Gateway — external flight API (Amadeus) error |
| `503` | Service Unavailable — Amadeus credentials not configured |
| `500` | Internal Server Error |

---

## Authentication Overview

| API Group | Auth Required |
|-----------|---------------|
| `/api/health` | No |
| `/api/auth/register`, `/api/auth/login` | No |
| `/api/flights/*` | No |
| `/api/tickets/verify` | No |
| `/api/admin/*` | Yes — Bearer JWT |
| `/api/auth/me` | Yes — Bearer JWT |

JWT expires in **7 days** by default (`JWT_EXPIRES_IN`).

---

## Important Notes

- **Flight data** comes from the [Amadeus API](https://developers.amadeus.com). Use **IATA airport codes** (e.g. `KBL`, `DXB`, `IST`).
- Search results return an **`offerId`** (`id` field). Offers are cached for **30 minutes**. Book within that window.
- **Customers** are identified by **phone number**. Creating a booking auto-creates or updates the customer record.
- **Confirm booking** issues a ticket and sends an email via Resend if the passenger has an email address.
- **Booking statuses:** `Pending` → `Confirmed` → `Completed` (or `Cancelled`)
- **Payment methods:** `Cash`, `Card`, `Bank Transfer`, `Other`
- **Seat classes:** `Economy`, `Premium Economy`, `Business`, `First Class`

---

## Endpoint Summary

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/register` | Register agent |
| POST | `/auth/login` | Login agent |
| GET | `/flights` | Search available flights |
| GET | `/flights/suggestions` | Alternate date suggestions |
| GET | `/flights/:offerId` | Get flight offer details |
| GET | `/tickets/verify` | Verify ticket / booking |

### Admin (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Current agent profile |
| GET | `/admin/flights/search` | Search flights (agent) |
| GET | `/admin/flights/offers/:offerId` | Get offer details (agent) |
| GET | `/admin/bookings` | List all bookings |
| POST | `/admin/bookings` | Create booking |
| GET | `/admin/bookings/:id` | Get booking |
| PATCH | `/admin/bookings/:id/confirm` | Confirm & issue ticket |
| PATCH | `/admin/bookings/:id/cancel` | Cancel booking |
| PATCH | `/admin/bookings/:id/reschedule` | Reschedule booking |
| GET | `/admin/customers` | List customers |
| GET | `/admin/customers/phone/:phone` | Find by phone |
| GET | `/admin/customers/:id` | Get customer |
| PUT | `/admin/customers/:id` | Update customer |
| GET | `/admin/customers/:id/tickets` | Ticket history |
| GET | `/admin/tickets/:id` | Get ticket |
| GET | `/admin/tickets/:id/print` | Printable ticket data |
