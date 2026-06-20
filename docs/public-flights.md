# Public Flights API

Search and view available flights via the Amadeus flight search integration. **No authentication required.**

Flight data is fetched live from Amadeus. Search results include a temporary `id` (offer ID) valid for **30 minutes** — use this when creating bookings.

**Base path:** `/api/flights`

---

## Search Flights

Search available flights by route and date.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/flights` |
| **Auth** | None |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `originAirportCode` | string | Yes* | Origin IATA code (e.g. `KBL`) |
| `destinationAirportCode` | string | Yes* | Destination IATA code (e.g. `DXB`) |
| `departureDate` | string | Yes | Departure date `YYYY-MM-DD` |
| `returnDate` | string | No | Return date for round-trip `YYYY-MM-DD` |
| `adults` | number | No | Number of adults (default: `1`) |
| `max` | number | No | Max results (default: `20`) |
| `currency` | string | No | Currency code (e.g. `USD`) |
| `airline` | string | No | Filter by carrier IATA code (e.g. `EK`) |
| `minPrice` | number | No | Minimum price filter |
| `maxPrice` | number | No | Maximum price filter |
| `sort` | string | No | Sort order (see below) |

\* Aliases accepted: `originLocationCode`, `originCity`, `destinationLocationCode`, `destinationCity`

### Sort Values

| Value | Description |
|-------|-------------|
| `price_asc` | Lowest price first |
| `price_desc` | Highest price first |
| `departure_asc` | Earliest departure first (default) |
| `seats_desc` | Most available seats first |

### Example Request

```http
GET /api/flights?originAirportCode=KBL&destinationAirportCode=DXB&departureDate=2026-08-15&sort=price_asc
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "source": "amadeus",
  "count": 2,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "source": "amadeus",
      "flightNumber": "EK301",
      "carrierCode": "EK",
      "airlineName": "EK",
      "originAirportCode": "KBL",
      "destinationAirportCode": "DXB",
      "departureDate": "2026-08-15T08:00:00.000Z",
      "departureTime": "08:00",
      "arrivalDate": "2026-08-15T11:25:00.000Z",
      "arrivalTime": "11:25",
      "duration": "3h 25m",
      "stops": 0,
      "seatClass": "Economy",
      "economyPrice": 350,
      "currency": "USD",
      "availableSeats": 9,
      "availability": "Available",
      "lowestPrice": 350,
      "segments": [
        {
          "carrierCode": "EK",
          "flightNumber": "EK301",
          "from": "KBL",
          "to": "DXB",
          "departureAt": "2026-08-15T08:00:00",
          "arrivalAt": "2026-08-15T11:25:00",
          "duration": "3h 25m"
        }
      ]
    }
  ]
}
```

### Key Response Fields

| Field | Description |
|-------|-------------|
| `id` | **Offer ID** — pass as `offerId` when creating a booking |
| `lowestPrice` | Total fare for the offer |
| `availability` | `"Available"` or `"Sold Out"` |
| `stops` | `0` = non-stop |
| `segments` | Individual flight legs (for connecting flights) |

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Missing origin, destination, or departure date |
| `502` | Amadeus API error |
| `503` | Amadeus credentials not configured on server |

---

## Flight Suggestions

When no flights are available on the requested date, returns alternate dates (+1, +2, +3 days).

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/flights/suggestions` |
| **Auth** | None |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `originAirportCode` | string | Yes* | Origin IATA code |
| `destinationAirportCode` | string | Yes* | Destination IATA code |
| `departureDate` | string | Yes | Original requested date `YYYY-MM-DD` |
| `adults` | number | No | Number of adults (default: `1`) |

\* Aliases: `originCity`, `destinationCity`

### Example Request

```http
GET /api/flights/suggestions?originAirportCode=KBL&destinationAirportCode=DXB&departureDate=2026-08-15
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "source": "amadeus",
  "data": {
    "exactMatches": [],
    "suggestions": [
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "flightNumber": "FZ401",
        "originAirportCode": "KBL",
        "destinationAirportCode": "DXB",
        "departureDate": "2026-08-16T06:00:00.000Z",
        "lowestPrice": 320,
        "availability": "Available",
        "suggestionReason": "Available on 2026-08-16"
      }
    ]
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Missing required query parameters |

---

## Get Flight Offer Details

Retrieve full details for a specific offer from search results.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/flights/:offerId` |
| **Auth** | None |

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `offerId` | string | The `id` from search results |

### Example Request

```http
GET /api/flights/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "source": "amadeus",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "flightNumber": "EK301",
    "carrierCode": "EK",
    "originAirportCode": "KBL",
    "destinationAirportCode": "DXB",
    "departureDate": "2026-08-15T08:00:00.000Z",
    "departureTime": "08:00",
    "duration": "3h 25m",
    "lowestPrice": 350,
    "availability": "Available",
    "prices": {
      "economy": 350,
      "premiumEconomy": 0,
      "business": 0,
      "firstClass": 0,
      "currency": "USD"
    }
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `404` | Offer not found or expired (search again) |

---

## Common IATA Codes for Testing

| Code | Airport |
|------|---------|
| `KBL` | Kabul |
| `DXB` | Dubai |
| `IST` | Istanbul |
| `DOH` | Doha |
| `ISB` | Islamabad |
| `DEL` | Delhi |

> Use future dates for Amadeus test API. Sandbox may return limited routes.
