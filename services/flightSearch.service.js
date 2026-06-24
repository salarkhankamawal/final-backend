import { searchFlightOffers as searchFromSearchApi } from "./searchApiFlight.service.js";
import { searchFlightOffers as searchFromMock } from "./mockFlight.service.js";

export const getFlightDataSource = () =>
  process.env.SEARCHAPI_API_KEY ? "google_flights" : "mock";

export const searchFlightOffers = async (params) => {
  if (process.env.SEARCHAPI_API_KEY) {
    return searchFromSearchApi(params);
  }
  return searchFromMock(params);
};
