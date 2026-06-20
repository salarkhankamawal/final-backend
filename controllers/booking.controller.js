import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Booking } from "../models/BookingSchema.model.js";
import {
  createBooking,
  confirmBooking,
  cancelBooking,
  rescheduleBooking,
} from "../services/booking.service.js";

const bookingPopulate = [
  { path: "customer" },
  { path: "flight", populate: { path: "airline" } },
  { path: "agent", select: "-password" },
  { path: "previousFlight", populate: { path: "airline" } },
];

export const getBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { bookingStatus: status } : {};

  const bookings = await Booking.find(filter)
    .populate(bookingPopulate)
    .sort({ createdAt: -1 });

  res.json({ success: true, count: bookings.length, data: bookings });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(bookingPopulate);
  if (!booking) throw new ApiError(404, "Booking not found");
  res.json({ success: true, data: booking });
});

export const createBookingHandler = asyncHandler(async (req, res) => {
  const { phone, passenger, flightId, offerId, seatClass, paymentInfo, discount } =
    req.body;

  if (
    !phone ||
    !passenger?.name ||
    !passenger?.age ||
    !passenger?.passportNumber ||
    (!flightId && !offerId)
  ) {
    throw new ApiError(
      400,
      "phone, passenger (name, age, passportNumber), and offerId (or flightId) are required"
    );
  }

  const booking = await createBooking(
    { phone, passenger, flightId, offerId, seatClass, paymentInfo, discount },
    req.agent._id
  );

  res.status(201).json({ success: true, data: booking });
});

export const confirmBookingHandler = asyncHandler(async (req, res) => {
  const result = await confirmBooking(req.params.id, req.agent._id);
  res.json({ success: true, data: result });
});

export const cancelBookingHandler = asyncHandler(async (req, res) => {
  const { cancelReason } = req.body;
  const booking = await cancelBooking(req.params.id, cancelReason);
  res.json({ success: true, data: booking });
});

export const rescheduleBookingHandler = asyncHandler(async (req, res) => {
  const { newFlightId, newOfferId } = req.body;
  if (!newFlightId && !newOfferId) {
    throw new ApiError(400, "newOfferId or newFlightId is required");
  }

  const booking = await rescheduleBooking(req.params.id, { newFlightId, newOfferId });
  res.json({ success: true, data: booking });
});
