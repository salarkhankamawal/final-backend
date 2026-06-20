import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Flight } from "../models/flightSchema.model.js";

export const getFlights = asyncHandler(async (req, res) => {
  const flights = await Flight.find()
    .populate("airline", "airlineName iataCode logo")
    .sort({ departureDate: 1 });

  res.json({ success: true, count: flights.length, data: flights });
});

export const getFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.findById(req.params.id).populate(
    "airline",
    "airlineName iataCode icaoCode logo contactPhone"
  );

  if (!flight) throw new ApiError(404, "Flight not found");
  res.json({ success: true, data: flight });
});

export const createFlight = asyncHandler(async (req, res) => {
  const payload = { ...req.body };

  if (payload.availableSeats == null && payload.totalSeats != null) {
    payload.availableSeats = payload.totalSeats;
  }

  const flight = await Flight.create(payload);
  await flight.populate("airline", "airlineName iataCode");

  res.status(201).json({ success: true, data: flight });
});

export const updateFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("airline", "airlineName iataCode");

  if (!flight) throw new ApiError(404, "Flight not found");
  res.json({ success: true, data: flight });
});

export const deleteFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.findByIdAndDelete(req.params.id);
  if (!flight) throw new ApiError(404, "Flight not found");
  res.json({ success: true, message: "Flight deleted" });
});
