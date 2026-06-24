import { ApiError } from "../utils/ApiError.js";
import { Airline } from "../models/airlineSchema.model.js";
import { Flight } from "../models/flightSchema.model.js";
import { searchFlightOffers, getFlightDataSource } from "./flightSearch.service.js";

const OFFER_TTL_MS = 30 * 60 * 1000;
const offerCache = new Map();

const cacheOffer = (offer) => {
  offerCache.set(offer.id, { offer, expiresAt: Date.now() + OFFER_TTL_MS });
  return offer;
};

export const getCachedOffer = (offerId) => {
  const entry = offerCache.get(offerId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    offerCache.delete(offerId);
    return null;
  }
  return entry.offer;
};

const applyFilters = (offers, query) => {
  let filtered = [...offers];

  if (query.airline) {
    const airline = query.airline.toUpperCase();
    filtered = filtered.filter(
      (o) =>
        o.carrierCode === airline ||
        o.flightNumber.startsWith(airline)
    );
  }

  if (query.minPrice) {
    filtered = filtered.filter((o) => o.lowestPrice >= Number(query.minPrice));
  }
  if (query.maxPrice) {
    filtered = filtered.filter((o) => o.lowestPrice <= Number(query.maxPrice));
  }

  switch (query.sort) {
    case "price_asc":
      filtered.sort((a, b) => a.lowestPrice - b.lowestPrice);
      break;
    case "price_desc":
      filtered.sort((a, b) => b.lowestPrice - a.lowestPrice);
      break;
    case "departure_asc":
      filtered.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
      break;
    case "seats_desc":
      filtered.sort((a, b) => b.availableSeats - a.availableSeats);
      break;
    default:
      filtered.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
  }

  return filtered;
};

export const fetchAvailableFlights = async (query) => {
  const origin =
    query.originAirportCode ||
    query.originLocationCode ||
    query.originCity;
  const destination =
    query.destinationAirportCode ||
    query.destinationLocationCode ||
    query.destinationCity;

  const offers = await searchFlightOffers({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: query.departureDate,
    returnDate: query.returnDate,
    adults: query.adults || 1,
    max: query.max || 20,
    currencyCode: query.currency,
    sort: query.sort,
  });

  return applyFilters(offers.map(cacheOffer), query);
};

export const fetchFlightSuggestions = async (query) => {
  const exactMatches = await fetchAvailableFlights(query);

  if (exactMatches.length > 0 || !query.departureDate) {
    return { exactMatches, suggestions: [] };
  }

  const baseDate = new Date(query.departureDate);
  const alternateDates = [1, 2, 3].map((days) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  });

  const suggestions = [];

  for (const date of alternateDates) {
    const results = await fetchAvailableFlights({ ...query, departureDate: date });
    for (const offer of results.slice(0, 3)) {
      suggestions.push({
        ...offer,
        suggestionReason: `Available on ${date}`,
      });
    }
    if (suggestions.length >= 6) break;
  }

  return { exactMatches, suggestions: suggestions.slice(0, 6) };
};

const upsertAirlineFromOffer = async (offer) => {
  let airline = await Airline.findOne({ iataCode: offer.carrierCode });

  if (!airline) {
    airline = await Airline.create({
      airlineName: offer.airlineName || offer.carrierCode,
      iataCode: offer.carrierCode,
      icaoCode: offer.carrierCode.padEnd(3, "X").slice(0, 3),
      country: offer.originCountry || "Unknown",
      status: "Active",
      cabinClasses: ["Economy"],
    });
  }

  return airline;
};

export const persistFlightFromOffer = async (offer) => {
  let flight = await Flight.findOne({ externalOfferKey: offer.offerKey });

  if (flight) {
    return flight.populate("airline");
  }

  const airline = await upsertAirlineFromOffer(offer);

  flight = await Flight.create({
    flightNumber: `${offer.flightNumber}-${offer.departureDate.toISOString().slice(0, 10)}`,
    airline: airline._id,
    originAirport: offer.originAirport,
    originAirportCode: offer.originAirportCode,
    originCity: offer.originCity,
    originCountry: offer.originCountry || "—",
    destinationAirport: offer.destinationAirport,
    destinationAirportCode: offer.destinationAirportCode,
    destinationCity: offer.destinationCity,
    destinationCountry: offer.destinationCountry || "—",
    departureDate: offer.departureDate,
    departureTime: offer.departureTime,
    arrivalDate: offer.arrivalDate,
    arrivalTime: offer.arrivalTime,
    duration: offer.duration,
    totalSeats: offer.totalSeats,
    availableSeats: offer.availableSeats,
    economyPrice: offer.economyPrice,
    premiumEconomyPrice: offer.premiumEconomyPrice,
    businessPrice: offer.businessPrice,
    firstClassPrice: offer.firstClassPrice,
    currency: offer.currency,
    stops: offer.stops,
    flightStatus: "Scheduled",
    externalSource: offer.source || getFlightDataSource(),
    externalOfferKey: offer.offerKey,
  });

  return flight.populate("airline");
};

export { getFlightDataSource };

export const resolveOfferForBooking = async (offerId) => {
  const cached = getCachedOffer(offerId);
  if (!cached) {
    throw new ApiError(
      400,
      "Flight offer expired or not found. Please search flights again."
    );
  }
  return cached;
};
