import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";

const AIRPORTS = {
  KBL: { city: "Kabul", country: "Afghanistan" },
  DXB: { city: "Dubai", country: "UAE" },
  IST: { city: "Istanbul", country: "Turkey" },
  DOH: { city: "Doha", country: "Qatar" },
  ISB: { city: "Islamabad", country: "Pakistan" },
  DEL: { city: "Delhi", country: "India" },
  JED: { city: "Jeddah", country: "Saudi Arabia" },
  FRA: { city: "Frankfurt", country: "Germany" },
};

const AIRLINES = [
  { code: "EK", name: "Emirates" },
  { code: "FZ", name: "Flydubai" },
  { code: "TK", name: "Turkish Airlines" },
  { code: "QR", name: "Qatar Airways" },
  { code: "PA", name: "Ariana Afghan Airlines" },
  { code: "SV", name: "Saudia" },
];

const ROUTE_DEFAULTS = { durationMins: 240, basePrice: 280 };

const ROUTE_META = {
  "KBL-DXB": { durationMins: 205, basePrice: 320 },
  "KBL-IST": { durationMins: 330, basePrice: 410 },
  "KBL-DOH": { durationMins: 220, basePrice: 350 },
  "KBL-ISB": { durationMins: 75, basePrice: 180 },
  "KBL-DEL": { durationMins: 110, basePrice: 220 },
  "DXB-KBL": { durationMins: 205, basePrice: 300 },
  "IST-KBL": { durationMins: 330, basePrice: 400 },
};

const hashSeed = (input) =>
  crypto.createHash("sha256").update(input).digest("hex");

const seededInt = (seed, min, max) => {
  const n = parseInt(seed.slice(0, 8), 16);
  return min + (n % (max - min + 1));
};

const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const buildOfferKey = (carrier, flightNum, depIso, price) =>
  crypto
    .createHash("sha256")
    .update([carrier, flightNum, depIso, price].join("|"))
    .digest("hex")
    .slice(0, 24);

const buildOffer = ({
  origin,
  destination,
  departureDate,
  airline,
  slotIndex,
  currency,
}) => {
  const routeKey = `${origin}-${destination}`;
  const meta = ROUTE_META[routeKey] || ROUTE_DEFAULTS;
  const originInfo = AIRPORTS[origin] || { city: origin, country: "" };
  const destInfo = AIRPORTS[destination] || { city: destination, country: "" };

  const seed = hashSeed(`${origin}-${destination}-${departureDate}-${airline.code}-${slotIndex}`);
  const hour = 6 + seededInt(seed, 0, 14);
  const minute = seededInt(seed.slice(8), 0, 3) * 15;
  const priceOffset = seededInt(seed.slice(16), -40, 120);
  const seats = seededInt(seed.slice(24), 3, 45);
  const durationMins = meta.durationMins + seededInt(seed.slice(32), -15, 30);

  const dep = new Date(`${departureDate}T00:00:00Z`);
  dep.setUTCHours(hour, minute, 0, 0);
  const arr = new Date(dep.getTime() + durationMins * 60_000);

  const price = Math.max(99, meta.basePrice + priceOffset);
  const flightNumber = `${airline.code}${100 + seededInt(seed.slice(40), 0, 899)}`;
  const depIso = dep.toISOString();
  const arrIso = arr.toISOString();

  const offerKey = buildOfferKey(airline.code, flightNumber, depIso, price);

  return {
    id: crypto.randomUUID(),
    source: "mock",
    offerKey,
    flightNumber,
    carrierCode: airline.code,
    airlineName: airline.name,
    originAirportCode: origin,
    originAirport: origin,
    originCity: originInfo.city,
    originCountry: originInfo.country,
    destinationAirportCode: destination,
    destinationAirport: destination,
    destinationCity: destInfo.city,
    destinationCountry: destInfo.country,
    departureDate: dep,
    departureTime: depIso.slice(11, 16),
    arrivalDate: arr,
    arrivalTime: arrIso.slice(11, 16),
    duration: formatDuration(durationMins),
    stops: 0,
    segments: [
      {
        carrierCode: airline.code,
        flightNumber,
        from: origin,
        to: destination,
        departureAt: depIso.slice(0, 19),
        arrivalAt: arrIso.slice(0, 19),
        duration: formatDuration(durationMins),
      },
    ],
    seatClass: "Economy",
    economyPrice: price,
    premiumEconomyPrice: Math.round(price * 1.4),
    businessPrice: Math.round(price * 2.2),
    firstClassPrice: Math.round(price * 3.5),
    currency,
    availableSeats: seats,
    totalSeats: seats + seededInt(seed.slice(48), 5, 20),
    flightStatus: "Scheduled",
    availability: seats > 0 ? "Available" : "Sold Out",
    lowestPrice: price,
  };
};

export const searchFlightOffers = async ({
  originLocationCode,
  destinationLocationCode,
  departureDate,
  currencyCode = "USD",
  max = 20,
}) => {
  if (!originLocationCode || !destinationLocationCode || !departureDate) {
    throw new ApiError(
      400,
      "originLocationCode, destinationLocationCode, and departureDate are required"
    );
  }

  const origin = originLocationCode.toUpperCase();
  const destination = destinationLocationCode.toUpperCase();

  if (origin === destination) {
    throw new ApiError(400, "Origin and destination must be different");
  }

  const dep = new Date(`${departureDate}T12:00:00Z`);
  if (Number.isNaN(dep.getTime())) {
    throw new ApiError(400, "departureDate must be YYYY-MM-DD");
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (dep < today) {
    throw new ApiError(400, "departureDate must be today or in the future");
  }

  const routeSeed = hashSeed(`${origin}-${destination}-${departureDate}`);
  const airlineCount = 3 + seededInt(routeSeed, 0, 2);
  const selectedAirlines = [...AIRLINES]
    .sort((a, b) => {
      const sa = hashSeed(`${routeSeed}-${a.code}`);
      const sb = hashSeed(`${routeSeed}-${b.code}`);
      return sa.localeCompare(sb);
    })
    .slice(0, airlineCount);

  const offers = [];

  for (const airline of selectedAirlines) {
    const flightsPerAirline = 1 + seededInt(hashSeed(`${routeSeed}-${airline.code}`), 0, 1);
    for (let i = 0; i < flightsPerAirline; i++) {
      offers.push(
        buildOffer({
          origin,
          destination,
          departureDate,
          airline,
          slotIndex: i,
          currency: currencyCode,
        })
      );
    }
  }

  return offers
    .sort((a, b) => a.lowestPrice - b.lowestPrice)
    .slice(0, max);
};
