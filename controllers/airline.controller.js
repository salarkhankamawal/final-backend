import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Airline } from "../models/airlineSchema.model.js";

export const getAirlines = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const airlines = await Airline.find(filter).sort({ airlineName: 1 });
  res.json({ success: true, count: airlines.length, data: airlines });
});

export const getAirline = asyncHandler(async (req, res) => {
  const airline = await Airline.findById(req.params.id);
  if (!airline) throw new ApiError(404, "Airline not found");
  res.json({ success: true, data: airline });
});

export const createAirline = asyncHandler(async (req, res) => {
  const airline = await Airline.create(req.body);
  res.status(201).json({ success: true, data: airline });
});

export const updateAirline = asyncHandler(async (req, res) => {
  const airline = await Airline.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!airline) throw new ApiError(404, "Airline not found");
  res.json({ success: true, data: airline });
});

export const deleteAirline = asyncHandler(async (req, res) => {
  const airline = await Airline.findByIdAndDelete(req.params.id);
  if (!airline) throw new ApiError(404, "Airline not found");
  res.json({ success: true, message: "Airline deleted" });
});
