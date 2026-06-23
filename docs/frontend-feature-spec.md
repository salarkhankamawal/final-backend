# Travel Agency Frontend — Feature Specification

> **Purpose:** Step-by-step feature guide for building the frontend against the Travel Agency REST API.  
> **Backend base URL (local):** `http://localhost:5000/api`  
> **Backend repo context:** Express + MongoDB + JWT auth + Amadeus flight search

---

## 1. Product Overview

This is a **travel agency booking system** with two distinct user surfaces:

| Surface | Users | Auth |
|---------|-------|------|
| **Public website** | Travelers / customers | None |
| **Admin dashboard** | Agency agents, managers, admins | JWT Bearer token |

### Core business flow

```
Agent searches flights → Creates booking (Pending) → Confirms booking → Ticket issued (+ optional email)
Customer verifies ticket publicly using booking reference + phone/passport
```

### Key domain rules (must reflect in UI)

- Flight search uses **IATA airport codes** (e.g. `KBL`, `DXB`, `IST`).
- Search results return an **`offerId`** (`id` field). Offers are cached **30 minutes** — show a countdown or warning.
- Customers are keyed by **phone number** — booking auto-creates/updates customer records.
- **Booking statuses:** `Pending` → `Confirmed` → `Completed` (or `Cancelled`). Reschedule from `Confirmed` returns to `Pending`.
- **Payment methods:** `Cash`, `Card`, `Bank Transfer`, `Other`
- **Seat classes:** `Economy`, `Premium Economy`, `Business`, `First Class`
- **Agent roles:** `admin`, `manager`, `agent` (role-based UI can be added later; backend has `authorize` middleware but routes don't enforce roles yet)
- JWT expires in **7 days** — handle token expiry and re-login.

---

## 2. Recommended App Structure

```
src/
├── api/                    # Axios/fetch client, interceptors, endpoint helpers
├── components/             # Shared UI (buttons, modals, status badges, loaders)
├── features/
│   ├── auth/               # Login, register, profile
│   ├── flights/            # Search, results, offer details
│   ├── bookings/           # CRUD + confirm/cancel/reschedule
│   ├── customers/          # List, detail, edit, ticket history
│   ├── tickets/            # View, print, verify
│   └── public/             # Public-only pages
├── hooks/                  # useAuth, useApi, etc.
├── layouts/
│   ├── PublicLayout.jsx    # Marketing / customer pages
│   └── AdminLayout.jsx     # Sidebar + protected routes
├── pages/
│   ├── public/
│   └── admin/
├── routes/                 # React Router (or equivalent)
├── store/                  # Auth state, optional global cache
├── utils/                  # Formatters, validators, constants
└── types/                  # TypeScript interfaces (if using TS)
```

### Suggested routes

| Route | Page | Auth |
|-------|------|------|
| `/` | Home / landing | Public |
| `/flights` | Flight search & results | Public |
| `/flights/:offerId` | Offer detail | Public |
| `/verify-ticket` | Ticket verification | Public |
| `/login` | Agent login | Public |
| `/register` | Agent registration | Public |
| `/admin` | Dashboard home | Protected |
| `/admin/flights` | Agent flight search | Protected |
| `/admin/bookings` | Bookings list | Protected |
| `/admin/bookings/new` | Create booking wizard | Protected |
| `/admin/bookings/:id` | Booking detail + actions | Protected |
| `/admin/customers` | Customers list | Protected |
| `/admin/customers/:id` | Customer profile + history | Protected |
| `/admin/tickets/:id` | Ticket detail | Protected |
| `/admin/tickets/:id/print` | Printable ticket view | Protected |

---

## 3. API Client Setup (Step 0 — Foundation)

Build this before any feature screens.

### 3.1 HTTP client

- Base URL: `import.meta.env.VITE_API_URL` or `http://localhost:5000/api`
- Default headers: `Content-Type: application/json`
- Attach `Authorization: Bearer <token>` on all `/admin/*` and `/auth/me` requests

### 3.2 Response handling

All API responses follow:

```json
// Success
{ "success": true, "data": { }, "count": 10 }

// Error
{ "success": false, "message": "Human-readable error" }
```

Map HTTP status codes to user-friendly messages:

| Status | UI behavior |
|--------|-------------|
| `400` | Show validation error from `message` |
| `401` | Clear token, redirect to login (admin) or show auth error (public verify) |
| `403` | Show "account inactive" or permission denied |
| `404` | Show not-found state |
| `409` | Show conflict (e.g. duplicate email on register) |
| `502` / `503` | Show "flight search unavailable" with retry |
| `500` | Generic error + optional retry |

### 3.3 Auth storage

- Store JWT in `localStorage` or `sessionStorage` (prefer `sessionStorage` for security)
- Store minimal agent profile: `{ id, fullName, email, role, agencyName }`
- On app load, call `GET /auth/me` to validate token; if `401`, redirect to login

### 3.4 Shared constants

```js
BOOKING_STATUSES = ['Pending', 'Confirmed', 'Ticketed', 'Cancelled', 'Completed']
PAYMENT_STATUSES = ['Pending', 'Paid', 'Partially Paid', 'Failed', 'Refunded']
PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'Other']
SEAT_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First Class']
TICKET_STATUSES = ['Issued', 'Confirmed', 'Checked-In', 'Boarded', 'Completed', 'Cancelled', 'Refunded']
AGENT_ROLES = ['admin', 'manager', 'agent']

// Common airports for autocomplete / quick picks
POPULAR_AIRPORTS = [
  { code: 'KBL', city: 'Kabul' },
  { code: 'DXB', city: 'Dubai' },
  { code: 'IST', city: 'Istanbul' },
  { code: 'DOH', city: 'Doha' },
  { code: 'ISB', city: 'Islamabad' },
  { code: 'DEL', city: 'Delhi' },
]
```

---

## 4. Feature Steps (Implementation Order)

Implement in this order — each phase builds on the previous.

---

### Phase 1 — Public Shell & Health Check

**Goal:** App boots, connects to API, basic layout works.

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 1.1 | Health check on app init (optional dev indicator) | `GET /health` | Show API status badge in dev mode |
| 1.2 | Public layout with header, footer, nav links | — | Links: Home, Search Flights, Verify Ticket, Agent Login |
| 1.3 | Landing page | — | Hero, CTA to search flights & verify ticket |
| 1.4 | 404 page | — | Friendly not-found with nav back |

**Acceptance:** Visiting `/` shows landing; API health returns `{ success: true, message: "Travel Agency API is running" }`.

---

### Phase 2 — Agent Authentication

**Goal:** Agents can register, log in, and access protected routes.

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 2.1 | Login page | `POST /auth/login` | Fields: `email`, `password`. On success save token + agent, redirect to `/admin` |
| 2.2 | Register page | `POST /auth/register` | Fields: `firstName`, `lastName`, `email`, `phone`, `password`, `agencyName`, optional `role` |
| 2.3 | Protected route wrapper | `GET /auth/me` | Redirect unauthenticated users to `/login`. Validate token on mount |
| 2.4 | Admin layout shell | — | Sidebar: Dashboard, Flights, Bookings, Customers. Header: agent name, agency, logout |
| 2.5 | Profile display | `GET /auth/me` | Show full profile in settings/header dropdown |
| 2.6 | Logout | — | Clear token + agent from storage, redirect to `/login` |
| 2.7 | Login error states | — | Handle `401` invalid credentials, `403` inactive account, `409` on register |

**Login request:**
```json
{ "email": "agent@agency.com", "password": "SecurePass123" }
```

**Register request:**
```json
{
  "firstName": "Ahmad", "lastName": "Khan", "email": "ahmad@agency.com",
  "phone": "0700123456", "password": "SecurePass123", "agencyName": "Kabul Travel Co.",
  "role": "agent"
}
```

**Acceptance:** Register → auto-login → `/admin` accessible. Logout → `/admin` redirects to login.

---

### Phase 3 — Public Flight Search

**Goal:** Anyone can search and browse flights without logging in.

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 3.1 | Search form | — | Fields: origin, destination (IATA autocomplete), departure date, optional return date, adults, currency |
| 3.2 | Search results list | `GET /flights` | Query: `originAirportCode`, `destinationAirportCode`, `departureDate`, `returnDate`, `adults`, `max`, `currency`, `airline`, `minPrice`, `maxPrice`, `sort` |
| 3.3 | Sort & filter controls | same endpoint | Sort: `price_asc`, `price_desc`, `departure_asc`, `seats_desc` |
| 3.4 | Flight result card | — | Show: airline, flight number, times, duration, stops, price, availability badge, seat class |
| 3.5 | Connecting flights UI | — | If `stops > 0`, expand `segments` array showing each leg |
| 3.6 | Empty state + suggestions | `GET /flights/suggestions` | When no results, show alternate dates from `suggestions` with `suggestionReason` |
| 3.7 | Offer detail page | `GET /flights/:offerId` | Full pricing breakdown (`prices.economy`, `business`, etc.), segments, availability |
| 3.8 | Offer expiry warning | — | Banner: "Prices valid for 30 minutes" — store `offerId` + timestamp client-side |
| 3.9 | Error handling | — | `400` missing params, `502`/`503` Amadeus down — show retry button |
| 3.10 | "Book with agency" CTA | — | Public users cannot book online — CTA links to contact info or agent login |

**Acceptance:** Search KBL → DXB with future date shows results. Click offer → detail page. No results → suggestions appear.

---

### Phase 4 — Public Ticket Verification

**Goal:** Customers verify bookings/tickets without an account.

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 4.1 | Verification form | — | Fields: `bookingReference` (required), `phone` OR `passportNumber` (at least one) |
| 4.2 | Submit verification | `GET /tickets/verify` | Query params: `bookingReference`, `phone` or `passportNumber` |
| 4.3 | Confirmed ticket view | — | Show ticket number, passenger, flight, seat, booking ref, status badge |
| 4.4 | Pending booking view | — | When `ticket: null` and `status: "Pending"`, show message: "Contact the agency" |
| 4.5 | Error states | — | `401` identity mismatch, `404` not found, `400` missing fields |

**Acceptance:** Verified confirmed booking shows full ticket. Pending booking shows informative message, no ticket section.

---

### Phase 5 — Admin Flight Search

**Goal:** Agents search flights inside the dashboard (same data, authenticated endpoints).

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 5.1 | Admin search form | `GET /admin/flights/search` | Same fields as public search |
| 5.2 | Results table/cards | same | Reuse public flight card components |
| 5.3 | "Select for booking" action | — | Clicking a flight stores `offerId` and navigates to booking creation |
| 5.4 | Offer detail (admin) | `GET /admin/flights/offers/:offerId` | Same as public detail, with "Create Booking" button |
| 5.5 | Offer expiry handling | — | If `404` on offer fetch, prompt to re-search |

**Acceptance:** Logged-in agent searches, selects flight, proceeds to booking wizard with `offerId` pre-filled.

---

### Phase 6 — Booking Management (Core Admin Feature)

**Goal:** Full booking lifecycle for agents.

#### 6A — Create Booking

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 6.1 | Booking wizard — flight summary | — | Show selected flight/offer recap at top |
| 6.2 | Customer phone lookup | `GET /admin/customers/phone/:phone` | On phone blur, auto-fill passenger if customer exists; `404` = new customer |
| 6.3 | Passenger form | — | Fields: `name`, `age`, `passportNumber`, optional `email` |
| 6.4 | Payment section | — | `method`, `amount`, `transactionId`, `notes`; optional `discount`, `seatClass` override |
| 6.5 | Submit booking | `POST /admin/bookings` | Body: `offerId`, `phone`, `passenger`, `paymentInfo`, `discount`, `seatClass` |
| 6.6 | Success screen | — | Show `bookingReference`, status `Pending`, link to booking detail |
| 6.7 | Error handling | — | `400` offer expired / no seats → redirect to re-search. `404` flight not found |

**Create booking body:**
```json
{
  "offerId": "<from search>",
  "phone": "0700123456",
  "passenger": {
    "name": "John Doe", "age": 30,
    "email": "john@example.com", "passportNumber": "P1234567"
  },
  "paymentInfo": { "method": "Cash", "amount": 350, "notes": "Paid at counter" },
  "discount": 0
}
```

#### 6B — Bookings List & Detail

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 6.8 | Bookings table | `GET /admin/bookings` | Optional filter: `?status=Pending`. Columns: ref, passenger, route, status, total, date |
| 6.9 | Status filter tabs | — | Tabs: All, Pending, Confirmed, Cancelled, Completed |
| 6.10 | Booking detail page | `GET /admin/bookings/:id` | Full booking: passenger, customer, flight, agent, payment, timestamps |
| 6.11 | Status badge component | — | Color-coded badges per `bookingStatus` and `paymentStatus` |

#### 6C — Booking Actions

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 6.12 | Confirm booking | `PATCH /admin/bookings/:id/confirm` | Button visible only when `Pending`. Show confirmation modal |
| 6.13 | Post-confirm UI | — | Display issued `ticketNumber`, `seatNumber`, email send status (`email.sent`, `email.reason`) |
| 6.14 | Cancel booking | `PATCH /admin/bookings/:id/cancel` | Modal with optional `cancelReason` field |
| 6.15 | Reschedule booking | `PATCH /admin/bookings/:id/reschedule` | Open flight search modal → select new flight → send `newOfferId` |
| 6.16 | Action guards | — | Disable confirm if already confirmed/cancelled. Disable cancel if already cancelled |
| 6.17 | Reschedule flow note | — | After reschedule, status returns to `Pending` — show "Re-confirm required" banner |

**Booking lifecycle diagram for UI:**

```
Pending  ──[Confirm]──▶  Confirmed  ──▶  Completed
   │                         │
   └──[Cancel]───────────────┴──[Cancel]──▶  Cancelled

Reschedule (from Confirmed) ──▶  Pending  (must confirm again)
```

**Acceptance:** Full flow: search → create → list shows booking → confirm → ticket issued → email status shown.

---

### Phase 7 — Customer Management

**Goal:** Agents view and edit customer records.

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 7.1 | Customers list | `GET /admin/customers` | Table: phone, name, email, passport, created date |
| 7.2 | Customer search/filter | — | Client-side filter by name, phone, email |
| 7.3 | Customer detail page | `GET /admin/customers/:id` | Profile card with all fields |
| 7.4 | Edit customer form | `PUT /admin/customers/:id` | Editable: `name`, `email`, `age`, `passportNumber`, `phone` |
| 7.5 | Ticket history tab | `GET /admin/customers/:id/tickets` | Two sections: `bookings[]` and `tickets[]` with links to detail pages |
| 7.6 | Quick lookup by phone | `GET /admin/customers/phone/:phone` | Reusable component for booking wizard |

**Acceptance:** Customer auto-created from booking appears in list. Edit saves. History shows bookings and tickets.

---

### Phase 8 — Ticket Viewing & Printing

**Goal:** Agents view and print tickets after confirmation.

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 8.1 | Ticket detail page | `GET /admin/tickets/:id` | Full ticket: passenger, flight, booking, issuedBy agent |
| 8.2 | Ticket status badge | — | Map `ticketStatus` to colors |
| 8.3 | Print view | `GET /admin/tickets/:id/print` | Dedicated print layout using flat print payload |
| 8.4 | Print layout design | — | Boarding-pass style: airline, route, times, seat, passenger, barcode area (optional QR of ticket number) |
| 8.5 | Browser print | — | `window.print()` with `@media print` CSS hiding nav/sidebar |
| 8.6 | Link from booking detail | — | After confirm, link to ticket detail and print page |

**Print payload fields to render:**
- `ticketNumber`, `bookingReference`, `status`
- `passenger.name`, `passenger.passportNumber`
- `flight.number`, `flight.airline`, `flight.origin`, `flight.destination`, times, duration
- `seat.number`, `seat.class`
- `fare.amount`, `fare.currency`
- `issuedAt`, `issuedBy`

**Acceptance:** Print page renders cleanly on A4/letter. Print preview hides chrome.

---

### Phase 9 — Admin Dashboard (Summary Home)

**Goal:** At-a-glance overview for agents.

| Step | Feature | API | UI notes |
|------|---------|-----|----------|
| 9.1 | Pending bookings count | `GET /admin/bookings?status=Pending` | Stat card with link to filtered list |
| 9.2 | Recent bookings | `GET /admin/bookings` | Last 5 bookings table |
| 9.3 | Quick actions | — | Buttons: New Booking, Search Flights, Verify Ticket (public link) |
| 9.4 | Welcome header | `GET /auth/me` | "Welcome, {fullName} — {agencyName}" |

**Note:** No dedicated analytics endpoint exists yet — derive stats client-side from list endpoints or add backend later.

**Acceptance:** Dashboard loads with real counts from API.

---

### Phase 10 — Polish & UX Enhancements

**Goal:** Production-ready feel.

| Step | Feature | Notes |
|------|---------|-------|
| 10.1 | Loading skeletons | All list/detail pages |
| 10.2 | Toast notifications | Success/error on create, confirm, cancel, update |
| 10.3 | Form validation | Client-side before API calls (required fields, email format, date in future) |
| 10.4 | Date picker | Min date = today for flight search |
| 10.5 | Currency formatting | Format `grandTotal`, `lowestPrice` with locale |
| 10.6 | Responsive design | Mobile-friendly public search; admin usable on tablet |
| 10.7 | Offer timer | Countdown from 30 min when offer selected |
| 10.8 | Breadcrumbs | Admin: Dashboard > Bookings > BK123... |
| 10.9 | Confirmation modals | Destructive actions: cancel booking, logout |
| 10.10 | Empty states | No bookings, no customers, no search results |
| 10.11 | Token expiry | On `401` from any admin call, redirect to login with "session expired" message |
| 10.12 | SEO (public pages) | Meta tags on landing, flight search, verify ticket |

---

## 5. Reusable UI Components Checklist

Build these as shared components early:

| Component | Used in |
|-----------|---------|
| `StatusBadge` | Bookings, tickets, payments |
| `FlightCard` | Public + admin search results |
| `FlightSegmentTimeline` | Offer detail, ticket detail |
| `AirportInput` | Search forms (IATA autocomplete) |
| `PassengerForm` | Booking wizard |
| `PaymentForm` | Booking wizard |
| `BookingActions` | Booking detail (confirm/cancel/reschedule) |
| `ProtectedRoute` | Admin routes |
| `ApiErrorAlert` | All pages |
| `ConfirmModal` | Cancel, confirm, logout |
| `EmptyState` | Lists with no data |
| `PageHeader` | Admin pages (title + actions) |
| `DataTable` | Bookings, customers lists |

---

## 6. State Management Recommendations

| State | Storage | Notes |
|-------|---------|-------|
| Auth token + agent | Context / Zustand / Redux | Persist to storage |
| Selected `offerId` + flight summary | Booking wizard context or URL params | Pass `?offerId=...` in route |
| Search params | URL query string | Enables shareable flight search URLs |
| List filters (status) | URL query string | `?status=Pending` |
| API cache | React Query / SWR (recommended) | Stale-while-revalidate for lists |

---

## 7. End-to-End User Flows (Test These)

### Flow A — Public traveler

1. Visit `/flights` → search KBL to DXB
2. Browse results, view offer detail
3. Visit `/verify-ticket` → enter booking ref + phone
4. See ticket or pending message

### Flow B — Agent happy path

1. Register at `/register` → lands on `/admin`
2. `/admin/flights` → search → select flight
3. `/admin/bookings/new` → enter phone (auto-fill if returning customer) → submit
4. `/admin/bookings/:id` → Confirm → see ticket number + email status
5. `/admin/tickets/:id/print` → print ticket
6. Customer verifies at `/verify-ticket`

### Flow C — Cancel & reschedule

1. Create + confirm booking
2. Cancel → status `Cancelled`, payment `Refunded`
3. (Separate booking) Reschedule → status back to `Pending` → re-confirm → new ticket

---

## 8. API Endpoint Quick Reference

### Public (no auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| POST | `/auth/register` | Register agent |
| POST | `/auth/login` | Login agent |
| GET | `/flights` | Search flights |
| GET | `/flights/suggestions` | Alternate dates |
| GET | `/flights/:offerId` | Offer details |
| GET | `/tickets/verify` | Verify ticket |

### Admin (Bearer JWT)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/auth/me` | Current agent |
| GET | `/admin/flights/search` | Search flights |
| GET | `/admin/flights/offers/:offerId` | Offer details |
| GET | `/admin/bookings` | List bookings |
| POST | `/admin/bookings` | Create booking |
| GET | `/admin/bookings/:id` | Get booking |
| PATCH | `/admin/bookings/:id/confirm` | Confirm + issue ticket |
| PATCH | `/admin/bookings/:id/cancel` | Cancel booking |
| PATCH | `/admin/bookings/:id/reschedule` | Reschedule |
| GET | `/admin/customers` | List customers |
| GET | `/admin/customers/phone/:phone` | Find by phone |
| GET | `/admin/customers/:id` | Get customer |
| PUT | `/admin/customers/:id` | Update customer |
| GET | `/admin/customers/:id/tickets` | Ticket history |
| GET | `/admin/tickets/:id` | Get ticket |
| GET | `/admin/tickets/:id/print` | Print data |

---

## 9. Future / Not Yet Wired (Backend Exists, Routes Not Mounted)

The backend has an **Airline CRUD** controller (`airline.controller.js`) but routes are **not registered** in `routes/index.js` yet. Skip in v1 or coordinate with backend to expose:

| Method | Planned Endpoint | Purpose |
|--------|------------------|---------|
| GET | `/admin/airlines` | List airlines |
| POST | `/admin/airlines` | Create airline |
| GET | `/admin/airlines/:id` | Get airline |
| PUT | `/admin/airlines/:id` | Update airline |
| DELETE | `/admin/airlines/:id` | Delete airline |

If added later, build an **Airlines management** page under admin settings.

---

## 10. Environment Variables (Frontend)

```env
VITE_API_URL=http://localhost:5000/api
```

For production, point to deployed backend URL.

---

## 11. Suggested Tech Stack (Flexible)

The backend does not mandate a frontend stack. Recommended:

- **Framework:** React (Vite) or Next.js
- **Routing:** React Router or Next.js App Router
- **HTTP:** Axios or fetch + React Query
- **Forms:** React Hook Form + Zod validation
- **UI:** Tailwind CSS + shadcn/ui (or MUI, Chakra)
- **Dates:** date-fns or dayjs
- **Icons:** Lucide React

---

## 12. Phase Summary Timeline

| Phase | Focus | Depends on |
|-------|-------|------------|
| 0 | API client + constants | — |
| 1 | Public shell | 0 |
| 2 | Auth + admin layout | 0 |
| 3 | Public flight search | 1 |
| 4 | Ticket verification | 1 |
| 5 | Admin flight search | 2 |
| 6 | Bookings (create, list, actions) | 5 |
| 7 | Customers | 6 |
| 8 | Tickets + print | 6 |
| 9 | Dashboard | 6, 7 |
| 10 | Polish | All |

---

## 13. Sample API Service Functions

```js
// api/auth.js
export const login = (body) => api.post('/auth/login', body);
export const register = (body) => api.post('/auth/register', body);
export const getMe = () => api.get('/auth/me');

// api/flights.js
export const searchFlights = (params) => api.get('/flights', { params });
export const getFlightSuggestions = (params) => api.get('/flights/suggestions', { params });
export const getOffer = (offerId) => api.get(`/flights/${offerId}`);
export const adminSearchFlights = (params) => api.get('/admin/flights/search', { params });
export const adminGetOffer = (offerId) => api.get(`/admin/flights/offers/${offerId}`);

// api/bookings.js
export const listBookings = (params) => api.get('/admin/bookings', { params });
export const getBooking = (id) => api.get(`/admin/bookings/${id}`);
export const createBooking = (body) => api.post('/admin/bookings', body);
export const confirmBooking = (id) => api.patch(`/admin/bookings/${id}/confirm`);
export const cancelBooking = (id, body) => api.patch(`/admin/bookings/${id}/cancel`, body);
export const rescheduleBooking = (id, body) => api.patch(`/admin/bookings/${id}/reschedule`, body);

// api/customers.js
export const listCustomers = () => api.get('/admin/customers');
export const getCustomer = (id) => api.get(`/admin/customers/${id}`);
export const getCustomerByPhone = (phone) => api.get(`/admin/customers/phone/${phone}`);
export const updateCustomer = (id, body) => api.put(`/admin/customers/${id}`, body);
export const getCustomerTickets = (id) => api.get(`/admin/customers/${id}/tickets`);

// api/tickets.js
export const verifyTicket = (params) => api.get('/tickets/verify', { params });
export const getTicket = (id) => api.get(`/admin/tickets/${id}`);
export const getTicketPrint = (id) => api.get(`/admin/tickets/${id}/print`);
```

---

*Generated from Travel Agency Backend API — use with `docs/README.md` and individual API docs for full request/response schemas.*
