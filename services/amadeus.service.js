import { ApiError } from "../utils/ApiError.js";

const AMADEUS_BASE_URL =
  process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";

let tokenCache = { token: null, expiresAt: 0 };

const getAccessToken = async () => {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const clientId = process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_API_SECRET;

  if (!clientId || !clientSecret) {
    throw new ApiError(
      503,
      "Flight search is not configured. Set AMADEUS_API_KEY and AMADEUS_API_SECRET."
    );
  }

  const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new ApiError(502, `Amadeus auth failed: ${err}`);
  }

  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.token;
};

const amadeusGet = async (path, params = {}) => {
  const token = await getAccessToken();
  const url = new URL(`${AMADEUS_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message =
      err.errors?.[0]?.detail || err.errors?.[0]?.title || response.statusText;
    throw new ApiError(response.status === 404 ? 404 : 502, `Amadeus: ${message}`);
  }

  return response.json();
};

export const searchFlightOffers = async ({
  originLocationCode,
  destinationLocationCode,
  departureDate,
  returnDate,
  adults = 1,
  max = 20,
  currencyCode,
}) => {
  if (!originLocationCode || !destinationLocationCode || !departureDate) {
    throw new ApiError(
      400,
      "originLocationCode, destinationLocationCode, and departureDate are required"
    );
  }

  const params = {
    originLocationCode: originLocationCode.toUpperCase(),
    destinationLocationCode: destinationLocationCode.toUpperCase(),
    departureDate,
    adults,
    max,
    nonStop: "false",
  };

  if (returnDate) params.returnDate = returnDate;
  if (currencyCode) params.currencyCode = currencyCode;

  const result = await amadeusGet("/v2/shopping/flight-offers", params);
  return result.data || [];
};

export const formatIsoDuration = (isoDuration = "") => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration || "—";
  const hours = match[1] ? `${match[1]}h` : "";
  const mins = match[2] ? ` ${match[2]}m` : "";
  return `${hours}${mins}`.trim();
};

export const parseDateTime = (isoString) => {
  const date = new Date(isoString);
  return {
    date,
    time: date.toISOString().slice(11, 16),
  };
};
