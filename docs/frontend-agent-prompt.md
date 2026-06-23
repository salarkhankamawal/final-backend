# Frontend Agent Prompt — Travel Agency App

> **Copy everything below the line into your frontend agent chat.**

---

You are building the frontend for a **Travel Agency Booking System**. The backend is a REST API (Express + MongoDB + JWT + Amadeus flight search). Build a complete, production-quality web app.

## API

- **Base URL:** `http://localhost:5000/api` (use `VITE_API_URL` env var)
- **Auth:** `Authorization: Bearer <token>` on all `/admin/*` and `/auth/me` requests
- **Response shape:** `{ success: true, data: {...}, count?: number }` or `{ success: false, message: "..." }`
- **Content-Type:** `application/json` for POST/PUT/PATCH

## Two Surfaces

1. **Public website** (no auth) — travelers search flights and verify tickets
2. **Admin dashboard** (JWT required) — agents manage bookings, customers, tickets

## Domain Rules (enforce in UI)

- Airport codes are **IATA** (KBL, DXB, IST, DOH, ISB, DEL)
- Flight search returns `offerId` in each result's `id` field — **valid 30 min**; show warning/timer
- Customers identified by **phone** — booking auto-creates/updates customer
- Booking flow: `Pending` → confirm → `Confirmed` + ticket issued → `Completed` (or `Cancelled`)
- Reschedule from `Confirmed` → back to `Pending` (must re-confirm)
- Payment methods: `Cash`, `Card`, `Bank Transfer`, `Other`
- Seat classes: `Economy`, `Premium Economy`, `Business`, `First Class`
- JWT expires in 7 days — redirect to login on 401

## Tech Stack (use unless told otherwise)

React + Vite, React Router, React Query, Axios, React Hook Form + Zod, Tailwind + shadcn/ui, date-fns

## Routes to Build

| Route | Page | Auth |
|-------|------|------|
| `/` | Landing | Public |
| `/flights` | Search + results | Public |
| `/flights/:offerId` | Offer detail | Public |
| `/verify-ticket` | Ticket verification | Public |
| `/login` | Agent login | Public |
| `/register` | Agent register | Public |
| `/admin` | Dashboard | Protected |
| `/admin/flights` | Agent flight search | Protected |
| `/admin/bookings` | Bookings list | Protected |
| `/admin/bookings/new` | Create booking | Protected |
| `/admin/bookings/:id` | Booking detail + actions | Protected |
| `/admin/customers` | Customers list | Protected |
| `/admin/customers/:id` | Customer profile + history | Protected |
| `/admin/tickets/:id` | Ticket detail | Protected |
| `/admin/tickets/:id/print` | Printable ticket | Protected |

## Build Order

### 1. Foundation
- Axios client with auth interceptor (attach Bearer token from storage)
- Auth context: login, register, logout, `GET /auth/me` on app load
- `ProtectedRoute` wrapper — redirect to `/login` if no valid token
- PublicLayout + AdminLayout (sidebar: Dashboard, Flights, Bookings, Customers)
- Shared: StatusBadge, ApiErrorAlert, ConfirmModal, EmptyState, loading skeletons

### 2. Auth
- **Login:** `POST /auth/login` — body `{ email, password }` → save `token` + `agent`
- **Register:** `POST /auth/register` — body `{ firstName, lastName, email, phone, password, agencyName, role? }` → auto-login
- **Profile:** `GET /auth/me` — validate token, show agent name/agency in header
- Handle errors: 401 invalid creds, 403 inactive account, 409 duplicate email

### 3. Public Flight Search
- **Search:** `GET /flights?originAirportCode=KBL&destinationAirportCode=DXB&departureDate=YYYY-MM-DD&returnDate=&adults=1&sort=price_asc`
- **Suggestions (no results):** `GET /flights/suggestions?originAirportCode=&destinationAirportCode=&departureDate=`
- **Offer detail:** `GET /flights/:offerId`
- UI: search form, result cards (airline, times, duration, stops, price, availability), segment timeline for connections, sort/filter, 30-min offer warning
- Public users **cannot book** — CTA to contact agency or agent login

### 4. Public Ticket Verification
- **Verify:** `GET /tickets/verify?bookingReference=BK...&phone=...` OR `&passportNumber=...`
- Show full ticket if `Confirmed`; if `Pending` and `ticket: null`, show "Contact the agency"
- Errors: 401 identity mismatch, 404 not found, 400 missing fields

### 5. Admin Flight Search
- **Search:** `GET /admin/flights/search` (same query params as public)
- **Offer detail:** `GET /admin/flights/offers/:offerId`
- "Select flight" → navigate to `/admin/bookings/new?offerId=...`

### 6. Bookings (core admin feature)
- **List:** `GET /admin/bookings?status=Pending` — filter tabs: All, Pending, Confirmed, Cancelled
- **Detail:** `GET /admin/bookings/:id`
- **Create:** `POST /admin/bookings`
  ```json
  {
    "offerId": "<from search>",
    "phone": "0700123456",
    "passenger": { "name": "John Doe", "age": 30, "email": "john@example.com", "passportNumber": "P1234567" },
    "paymentInfo": { "method": "Cash", "amount": 350, "notes": "" },
    "discount": 0
  }
  ```
- On phone blur: `GET /admin/customers/phone/:phone` — auto-fill passenger if exists
- **Confirm:** `PATCH /admin/bookings/:id/confirm` — shows ticket number, seat, email send status
- **Cancel:** `PATCH /admin/bookings/:id/cancel` — body `{ cancelReason? }`
- **Reschedule:** `PATCH /admin/bookings/:id/reschedule` — body `{ newOfferId }` → status back to Pending
- Action guards: disable confirm if not Pending; disable cancel if already Cancelled

### 7. Customers
- **List:** `GET /admin/customers`
- **Detail:** `GET /admin/customers/:id`
- **Edit:** `PUT /admin/customers/:id` — `{ name, email, age, passportNumber, phone }`
- **History:** `GET /admin/customers/:id/tickets` — bookings + tickets tabs

### 8. Tickets
- **Detail:** `GET /admin/tickets/:id`
- **Print:** `GET /admin/tickets/:id/print` — boarding-pass layout, `window.print()`, hide nav in print CSS
- Link from booking detail after confirm

### 9. Dashboard (`/admin`)
- Pending bookings count (`GET /admin/bookings?status=Pending`)
- Recent bookings table
- Quick actions: New Booking, Search Flights
- Welcome: agent name + agency from `/auth/me`

### 10. Polish
- Toast notifications on success/error
- Client-side form validation before API calls
- Responsive (mobile public search, tablet admin)
- URL query params for search filters and booking status
- Token expiry → login redirect with "session expired"
- SEO meta on public pages

## Key Endpoints Summary

```
GET    /health
POST   /auth/register
POST   /auth/login
GET    /auth/me                          [auth]
GET    /flights                          [public]
GET    /flights/suggestions              [public]
GET    /flights/:offerId                 [public]
GET    /tickets/verify                   [public]
GET    /admin/flights/search             [auth]
GET    /admin/flights/offers/:offerId    [auth]
GET    /admin/bookings                   [auth]
POST   /admin/bookings                   [auth]
GET    /admin/bookings/:id               [auth]
PATCH  /admin/bookings/:id/confirm       [auth]
PATCH  /admin/bookings/:id/cancel        [auth]
PATCH  /admin/bookings/:id/reschedule    [auth]
GET    /admin/customers                  [auth]
GET    /admin/customers/phone/:phone     [auth]
GET    /admin/customers/:id              [auth]
PUT    /admin/customers/:id              [auth]
GET    /admin/customers/:id/tickets      [auth]
GET    /admin/tickets/:id                [auth]
GET    /admin/tickets/:id/print          [auth]
```

## Test Flows (must work end-to-end)

1. **Public:** Search KBL→DXB → view offer → verify ticket with booking ref + phone
2. **Agent:** Register → search flight → create booking → confirm → print ticket → customer verifies publicly
3. **Cancel:** Confirm booking → cancel → cannot confirm again
4. **Reschedule:** Confirm → reschedule with new offer → status Pending → re-confirm → new ticket

## Out of Scope (backend not wired yet)

Skip **Airline CRUD** (`/admin/airlines`) — routes exist in backend but are not mounted.

## Full API docs

If you need request/response schemas, refer to the backend `docs/` folder: `authentication.md`, `public-flights.md`, `public-tickets.md`, `admin-bookings.md`, `admin-customers.md`, `admin-tickets.md`, `admin-flights.md`.

Start with foundation + auth, then build phases in order. Use React Query for server state. Match existing modern travel/booking UI patterns — clean, professional, accessible.
