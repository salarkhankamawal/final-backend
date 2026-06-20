# Admin Flights API

Agent-authenticated flight search. Functionally identical to the [Public Flights API](./public-flights.md) but scoped under `/admin/flights` for the agency booking UI.

**Base path:** `/api/admin/flights`  
**Auth:** Bearer JWT required on all endpoints

---

## Search Flights

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/flights/search` |
| **Auth** | Bearer JWT |

### Query Parameters

Same as [Search Flights](./public-flights.md#search-flights) — see public flights documentation for full parameter list.

### Example Request

```http
GET /api/admin/flights/search?originAirportCode=KBL&destinationAirportCode=DXB&departureDate=2026-08-15
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

Same response format as public search. Save the `id` from each result as `offerId` for booking creation.

```json
{
  "success": true,
  "source": "amadeus",
  "count": 5,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "flightNumber": "EK301",
      "lowestPrice": 350,
      "availability": "Available"
    }
  ]
}
```

---

## Get Flight Offer Details

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/flights/offers/:offerId` |
| **Auth** | Bearer JWT |

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `offerId` | string | Offer `id` from search results |

### Example Request

```http
GET /api/admin/flights/offers/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response — `200 OK`

Same as [Get Flight Offer Details](./public-flights.md#get-flight-offer-details).

### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `404` | Offer expired — search again |

---

## Agent Booking Workflow

```
1. GET /api/admin/flights/search   → pick a flight, copy `id`
2. POST /api/admin/bookings        → pass `offerId: "<id>"`
3. PATCH /api/admin/bookings/:id/confirm
```

> Offers expire after 30 minutes. If booking creation fails with "offer expired", repeat the search step.
