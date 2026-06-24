import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  fetchAvailableFlights,
  fetchFlightSuggestions,
  getCachedOffer,
  getFlightDataSource,
} from "../services/flightOffer.service.js";

export const searchFlights = asyncHandler(async (req, res) => {
  const origin =
    req.query.originAirportCode ||
    req.query.originLocationCode ||
    req.query.originCity;
  const destination =
    req.query.destinationAirportCode ||
    req.query.destinationLocationCode ||
    req.query.destinationCity;

  if (!origin) {
    throw new ApiError(400, "originAirportCode (IATA) is required, e.g. KBL");
  }
  if (!destination) {
    throw new ApiError(400, "destinationAirportCode (IATA) is required, e.g. DXB");
  }
  if (!req.query.departureDate) {
    throw new ApiError(400, "departureDate is required (YYYY-MM-DD)");
  }

  const results = await fetchAvailableFlights(req.query);

  console.log(results)

  res.json({
    success: true,
    source: getFlightDataSource(),
    count: results.length,
    data: results,
  });
});

export const getFlightSuggestions = asyncHandler(async (req, res) => {
  const { originAirportCode, destinationAirportCode, departureDate } = req.query;

  if (!originAirportCode && !req.query.originCity) {
    throw new ApiError(400, "originAirportCode is required for suggestions");
  }
  if (!destinationAirportCode && !req.query.destinationCity) {
    throw new ApiError(400, "destinationAirportCode is required for suggestions");
  }
  if (!departureDate) {
    throw new ApiError(400, "departureDate is required");
  }

  const { exactMatches, suggestions } = await fetchFlightSuggestions(req.query);

  res.json({
    success: true,
    source: getFlightDataSource(),
    data: { exactMatches, suggestions },
  });
});

export const getPublicFlight = asyncHandler(async (req, res) => {
  const offer = getCachedOffer(req.params.id);

  if (!offer) {
    throw new ApiError(
      404,
      "Flight offer not found or expired. Please search again."
    );
  }

  res.json({
    success: true,
    source: offer.source || getFlightDataSource(),
    data: {
      ...offer,
      prices: {
        economy: offer.economyPrice,
        premiumEconomy: offer.premiumEconomyPrice,
        business: offer.businessPrice,
        firstClass: offer.firstClassPrice,
        currency: offer.currency,
      },
    },
  });
});
