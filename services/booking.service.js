import { ApiError } from "../utils/ApiError.js";
import { generateBookingReference, generateTicketNumber } from "../utils/generateReference.js";
import { Customer } from "../models/customerSchema.model.js";
import { Flight } from "../models/flightSchema.model.js";
import { Booking } from "../models/BookingSchema.model.js";
import { Ticket } from "../models/ticketSchema.model.js";
import { sendTicketEmail } from "./email.service.js";
import { Airline } from "../models/airlineSchema.model.js";
import {
  resolveOfferForBooking,
  persistFlightFromOffer,
} from "./flightOffer.service.js";

const SEAT_CLASS_PRICE_FIELD = {
  Economy: "economyPrice",
  "Premium Economy": "premiumEconomyPrice",
  Business: "businessPrice",
  "First Class": "firstClassPrice",
};

export const getFlightPrice = (flight, seatClass) => {
  const field = SEAT_CLASS_PRICE_FIELD[seatClass] || "economyPrice";
  return flight[field] || flight.economyPrice;
};

export const upsertCustomer = async ({ phone, name, email, age, passportNumber }) => {
  let customer = await Customer.findOne({ phone });

  if (customer) {
    customer.name = name;
    if (email) customer.email = email;
    if (age != null) customer.age = age;
    if (passportNumber) customer.passportNumber = passportNumber;
    await customer.save();
  } else {
    customer = await Customer.create({ phone, name, email, age, passportNumber });
  }

  return customer;
};

export const createBooking = async (payload, agentId) => {
  const {
    phone,
    passenger,
    flightId,
    offerId,
    seatClass = "Economy",
    paymentInfo,
    discount = 0,
  } = payload;

  let flight;
  let resolvedSeatClass = seatClass;

  if (offerId) {
    const offer = await resolveOfferForBooking(offerId);
    if (offer.availableSeats < 1) {
      throw new ApiError(400, "No seats available on this flight");
    }
    resolvedSeatClass = offer.seatClass || seatClass;
    flight = await persistFlightFromOffer(offer);
    if (flight.availableSeats < 1) {
      throw new ApiError(400, "No seats available on this flight");
    }
  } else if (flightId) {
    flight = await Flight.findById(flightId);
    if (!flight) throw new ApiError(404, "Flight not found");
    if (flight.flightStatus === "Cancelled") {
      throw new ApiError(400, "Flight is cancelled");
    }
    if (flight.availableSeats < 1) {
      throw new ApiError(400, "No seats available on this flight");
    }
  } else {
    throw new ApiError(400, "offerId or flightId is required");
  }

  const customer = await upsertCustomer({
    phone,
    name: passenger.name,
    email: passenger.email,
    age: passenger.age,
    passportNumber: passenger.passportNumber,
  });

  const totalFare = getFlightPrice(flight, resolvedSeatClass);
  const grandTotal = Math.max(totalFare - (discount || 0), 0);

  flight.availableSeats -= 1;
  await flight.save();
  // Build a lightweight snapshot of the flight for this booking
  const airlineDoc = await Airline.findById(flight.airline).select("airlineName iataCode");
  const flightSnapshot = {
    flightNumber: flight.flightNumber,
    originAirportCode: flight.originAirportCode,
    destinationAirportCode: flight.destinationAirportCode,
    departureDate: flight.departureDate,
    departureTime: flight.departureTime,
    arrivalDate: flight.arrivalDate,
    arrivalTime: flight.arrivalTime,
    duration: flight.duration,
    currency: flight.currency,
    airline: {
      id: flight.airline,
      name: airlineDoc?.airlineName,
      code: airlineDoc?.iataCode,
    },
  };

  const booking = await Booking.create({
    bookingReference: generateBookingReference(),
    customer: customer._id,
    flight: flight._id,
    agent: agentId,
    passenger,
    seatClass: resolvedSeatClass,
    paymentInfo: {
      ...paymentInfo,
      amount: paymentInfo?.amount ?? grandTotal,
    },
    totalFare,
    discount: discount || 0,
    grandTotal,
    currency: flight.currency,
    paymentStatus: paymentInfo?.method ? "Paid" : "Pending",
    bookingStatus: "Pending",
    flightSnapshot,
  });

  return booking.populate([
    { path: "customer" },
    { path: "flight", populate: { path: "airline" } },
    { path: "agent", select: "-password" },
  ]);
};

const assignSeatNumber = async (flightId, seatClass) => {
  const prefix =
    seatClass === "Business" || seatClass === "First Class" ? "B" : "E";
  const ticketCount = await Ticket.countDocuments({
    flight: flightId,
    ticketStatus: { $ne: "Cancelled" },
  });
  return `${prefix}${ticketCount + 1}`;
};

export const confirmBooking = async (bookingId, agentId) => {
  const booking = await Booking.findById(bookingId).populate([
    { path: "customer" },
    { path: "flight", populate: { path: "airline" } },
  ]);

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.bookingStatus === "Cancelled") {
    throw new ApiError(400, "Cannot confirm a cancelled booking");
  }
  if (booking.bookingStatus === "Confirmed" || booking.bookingStatus === "Ticketed") {
    throw new ApiError(400, "Booking is already confirmed");
  }

  const existingTicket = await Ticket.findOne({ booking: booking._id });
  if (existingTicket) {
    throw new ApiError(400, "Ticket already issued for this booking");
  }

  const flight = booking.flight;
  const bookingSnapshot = {
    bookingReference: booking.bookingReference,
    passenger: booking.passenger,
    seatClass: booking.seatClass,
    grandTotal: booking.grandTotal,
  };

  const flightSnapshot = booking.flightSnapshot || {
    flightNumber: flight.flightNumber,
    originAirportCode: flight.originAirportCode,
    destinationAirportCode: flight.destinationAirportCode,
    departureDate: flight.departureDate,
    departureTime: flight.departureTime,
    arrivalDate: flight.arrivalDate,
    arrivalTime: flight.arrivalTime,
    duration: flight.duration,
    currency: flight.currency,
    airline: flight.airline,
  };

  const ticket = await Ticket.create({
    ticketNumber: generateTicketNumber(),
    booking: booking._id,
    flight: flight._id,
    passenger: booking.passenger,
    seatNumber: await assignSeatNumber(flight._id, booking.seatClass),
    seatClass: booking.seatClass,
    fareAmount: booking.grandTotal,
    ticketStatus: "Confirmed",
    issuedBy: agentId,
    bookingSnapshot,
    flightSnapshot,
  });

  booking.bookingStatus = "Confirmed";
  booking.paymentStatus = booking.paymentStatus === "Pending" ? "Paid" : booking.paymentStatus;
  await booking.save();

  const email = booking.customer?.email || booking.passenger?.email;
  let emailResult = { sent: false, reason: "No email provided" };

  if (email) {
    try {
      emailResult = await sendTicketEmail({
        to: email,
        ticket,
        booking,
        flight,
        airline: flight.airline,
      });
    } catch (err) {
      emailResult = { sent: false, reason: err.message };
    }
  }

  return {
    booking,
    ticket: await ticket.populate([
      { path: "flight", populate: { path: "airline" } },
      { path: "booking", populate: "customer" },
      { path: "issuedBy", select: "-password" },
    ]),
    email: emailResult,
  };
};

export const cancelBooking = async (bookingId, cancelReason = "") => {
  const booking = await Booking.findById(bookingId).populate("flight");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.bookingStatus === "Cancelled") {
    throw new ApiError(400, "Booking is already cancelled");
  }

  const flight = await Flight.findById(booking.flight._id);
  if (flight) {
    flight.availableSeats = Math.min(flight.availableSeats + 1, flight.totalSeats);
    await flight.save();
  }

  booking.bookingStatus = "Cancelled";
  booking.cancelledAt = new Date();
  booking.cancelReason = cancelReason;
  booking.paymentStatus = "Refunded";
  await booking.save();

  await Ticket.updateMany(
    { booking: booking._id },
    { ticketStatus: "Cancelled" }
  );

  return booking.populate([
    { path: "customer" },
    { path: "flight", populate: { path: "airline" } },
  ]);
};

export const rescheduleBooking = async (bookingId, { newFlightId, newOfferId }) => {
  const booking = await Booking.findById(bookingId).populate("flight");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.bookingStatus === "Cancelled") {
    throw new ApiError(400, "Cannot reschedule a cancelled booking");
  }

  let newFlight;

  if (newOfferId) {
    const offer = await resolveOfferForBooking(newOfferId);
    if (offer.availableSeats < 1) {
      throw new ApiError(400, "No seats available on the new flight");
    }
    newFlight = await persistFlightFromOffer(offer);
    if (newFlight.availableSeats < 1) {
      throw new ApiError(400, "No seats available on the new flight");
    }
  } else if (newFlightId) {
    newFlight = await Flight.findById(newFlightId);
    if (!newFlight) throw new ApiError(404, "New flight not found");
    if (newFlight.flightStatus === "Cancelled") {
      throw new ApiError(400, "Selected flight is cancelled");
    }
    if (newFlight.availableSeats < 1) {
      throw new ApiError(400, "No seats available on the new flight");
    }
  } else {
    throw new ApiError(400, "newOfferId or newFlightId is required");
  }

  const oldFlight = await Flight.findById(booking.flight._id);
  if (oldFlight) {
    oldFlight.availableSeats = Math.min(oldFlight.availableSeats + 1, oldFlight.totalSeats);
    await oldFlight.save();
  }

  newFlight.availableSeats -= 1;
  await newFlight.save();

  const newFare = getFlightPrice(newFlight, booking.seatClass);
  booking.previousFlight = booking.flight._id;
  booking.flight = newFlight._id;
  booking.totalFare = newFare;
  booking.grandTotal = Math.max(newFare - booking.discount, 0);
  booking.rescheduledAt = new Date();
  booking.currency = newFlight.currency;

  if (booking.bookingStatus === "Confirmed" || booking.bookingStatus === "Ticketed") {
    booking.bookingStatus = "Pending";
  }

  await booking.save();

  await Ticket.updateMany(
    { booking: booking._id },
    { ticketStatus: "Cancelled" }
  );

  return booking.populate([
    { path: "customer" },
    { path: "flight", populate: { path: "airline" } },
    { path: "previousFlight", populate: { path: "airline" } },
  ]);
};
