import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Booking } from "../models/BookingSchema.model.js";
import { Ticket } from "../models/ticketSchema.model.js";

const ticketPopulate = [
  { path: "flight", populate: { path: "airline" } },
  { path: "booking", populate: "customer" },
  { path: "issuedBy", select: "fullName email agencyName" },
];

const verifyIdentity = (booking, { phone, passportNumber }) => {
  const customer = booking.customer;
  const matchesPhone = phone && customer?.phone === phone;
  const matchesPassport =
    passportNumber &&
    (booking.passenger?.passportNumber === passportNumber ||
      customer?.passportNumber === passportNumber);

  return matchesPhone || matchesPassport;
};

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate(ticketPopulate);
  if (!ticket) throw new ApiError(404, "Ticket not found");
  res.json({ success: true, data: ticket });
});

export const printTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate(ticketPopulate);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const { flight, booking, passenger } = ticket;
  const airline = flight?.airline;

  const printable = {
    ticketNumber: ticket.ticketNumber,
    bookingReference: booking?.bookingReference,
    status: ticket.ticketStatus,
    passenger: {
      name: passenger.name,
      age: passenger.age,
      passportNumber: passenger.passportNumber,
    },
    flight: {
      number: flight?.flightNumber,
      airline: airline?.airlineName,
      airlineCode: airline?.iataCode,
      origin: `${flight?.originCity} (${flight?.originAirportCode})`,
      destination: `${flight?.destinationCity} (${flight?.destinationAirportCode})`,
      departureDate: flight?.departureDate,
      departureTime: flight?.departureTime,
      arrivalDate: flight?.arrivalDate,
      arrivalTime: flight?.arrivalTime,
      duration: flight?.duration,
    },
    seat: {
      number: ticket.seatNumber,
      class: ticket.seatClass,
    },
    fare: {
      amount: ticket.fareAmount,
      currency: booking?.currency || "USD",
    },
    issuedAt: ticket.issueDate,
    issuedBy: ticket.issuedBy?.fullName,
  };

  res.json({ success: true, data: printable });
});

export const verifyTicket = asyncHandler(async (req, res) => {
  const { bookingReference, phone, passportNumber } = req.query;

  if (!bookingReference || (!phone && !passportNumber)) {
    throw new ApiError(
      400,
      "bookingReference and either phone or passportNumber are required"
    );
  }

  const booking = await Booking.findOne({ bookingReference }).populate("customer");
  if (!booking) throw new ApiError(404, "Booking not found");

  if (!verifyIdentity(booking, { phone, passportNumber })) {
    throw new ApiError(401, "Verification failed — details do not match");
  }

  const ticket = await Ticket.findOne({ booking: booking._id }).populate(ticketPopulate);

  if (!ticket) {
    return res.json({
      success: true,
      data: {
        verified: true,
        status: booking.bookingStatus,
        message:
          booking.bookingStatus === "Pending"
            ? "Booking found but ticket not yet issued. Contact the agency."
            : "Booking found",
        booking,
        ticket: null,
      },
    });
  }

  res.json({
    success: true,
    data: {
      verified: true,
      status: ticket.ticketStatus,
      ticket,
      booking,
    },
  });
});
