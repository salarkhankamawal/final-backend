import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";

const SEARCHAPI_BASE = "https://www.searchapi.io/api/v1/search";

const formatDuration = (minutes) => {
  const total = Number(minutes) || 0;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const parseCarrierCode = (flightNumber = "", airlineName = "") => {
  const match = flightNumber.trim().match(/^([A-Z0-9]{2})\b/i);
  if (match) return match[1].toUpperCase();
  return airlineName.replace(/\s+/g, "").slice(0, 2).toUpperCase() || "XX";
};

const toDateTime = (date, time) => new Date(`${date}T${time}:00Z`);

const buildOfferKey = (carrier, flightNumber, depIso, price) =>
  crypto
    .createHash("sha256")
    .update([carrier, flightNumber, depIso, price].join("|"))
    .digest("hex")
    .slice(0, 24);

const mapSortToSearchApi = (sort) => {
  const map = {
    price_asc: "price",
    price_desc: "price",
    departure_asc: "departure_time",
    seats_desc: "top_flights",
  };
  return map[sort] || "top_flights";
};

const normalizeItinerary = (itinerary, currency) => {
  const legs = itinerary.flights || [];
  if (!legs.length) return null;

  const first = legs[0];
  const last = legs[legs.length - 1];
  const dep = first.departure_airport;
  const arr = last.arrival_airport;

  if (!dep?.id || !arr?.id || !dep.date || !dep.time) return null;

  const departureDate = toDateTime(dep.date, dep.time);
  const arrivalDate = toDateTime(arr.date, arr.time);
  const carrierCode = parseCarrierCode(first.flight_number, first.airline);
  const flightNumber = (first.flight_number || `${carrierCode}000`).replace(/\s+/g, "");
  const price = Number(itinerary.price) || 0;
  const depIso = departureDate.toISOString();

  const segments = legs.map((leg) => ({
    carrierCode: parseCarrierCode(leg.flight_number, leg.airline),
    flightNumber: (leg.flight_number || "").replace(/\s+/g, ""),
    from: leg.departure_airport?.id,
    to: leg.arrival_airport?.id,
    departureAt: `${leg.departure_airport.date}T${leg.departure_airport.time}:00`,
    arrivalAt: `${leg.arrival_airport.date}T${leg.arrival_airport.time}:00`,
    duration: formatDuration(leg.duration),
  }));

  return {
    id: crypto.randomUUID(),
    source: "google_flights",
    offerKey: buildOfferKey(carrierCode, flightNumber, depIso, price),
    flightNumber,
    carrierCode,
    airlineName: first.airline || carrierCode,
    originAirportCode: dep.id,
    originAirport: dep.id,
    originCity: dep.name || dep.id,
    originCountry: "",
    destinationAirportCode: arr.id,
    destinationAirport: arr.id,
    destinationCity: arr.name || arr.id,
    destinationCountry: "",
    departureDate,
    departureTime: dep.time,
    arrivalDate,
    arrivalTime: arr.time,
    duration: formatDuration(itinerary.total_duration),
    stops: Math.max(legs.length - 1, 0),
    segments,
    seatClass: first.travel_class || "Economy",
    economyPrice: price,
    premiumEconomyPrice: 0,
    businessPrice: 0,
    firstClassPrice: 0,
    currency,
    availableSeats: 9,
    totalSeats: 9,
    flightStatus: "Scheduled",
    availability: price > 0 ? "Available" : "Sold Out",
    lowestPrice: price,
    airlineLogo: itinerary.airline_logo || first.airline_logo || "",
    bookingToken: itinerary.booking_token || null,
  };
};

export const searchFlightOffers = async ({
  originLocationCode,
  destinationLocationCode,
  departureDate,
  returnDate,
  adults = 1,
  max = 20,
  currencyCode = "USD",
  sort,
}) => {
  const apiKey = process.env.SEARCHAPI_API_KEY;

  if (!apiKey) {
    throw new ApiError(
      503,
      "Flight search is not configured. Set SEARCHAPI_API_KEY in .env — get a free key at https://www.searchapi.io/"
    );
  }

  if (!originLocationCode || !destinationLocationCode || !departureDate) {
    throw new ApiError(
      400,
      "originLocationCode, destinationLocationCode, and departureDate are required"
    );
  }

  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    departure_id: originLocationCode.toUpperCase(),
    arrival_id: destinationLocationCode.toUpperCase(),
    outbound_date: departureDate,
    flight_type: returnDate ? "round_trip" : "one_way",
    adults: String(adults),
    currency: currencyCode,
    sort_by: mapSortToSearchApi(sort),
  });

  if (returnDate) params.set("return_date", returnDate);

  const response = await fetch(`${SEARCHAPI_BASE}?${params}`);

  if (!response.ok) {
    const errText = await response.text();
    throw new ApiError(502, `Flight search failed: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new ApiError(502, data.error || "Flight search provider error");
  }

  const itineraries = [
    ...(data.best_flights || []),
    ...(data.other_flights || []),
  ];

  let offers = itineraries
    .map((item) => normalizeItinerary(item, currencyCode))
    .filter(Boolean);

  if (sort === "price_desc") {
    offers.sort((a, b) => b.lowestPrice - a.lowestPrice);
  }

  return offers.slice(0, max);
};
