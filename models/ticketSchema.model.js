import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      required: true,
    },

    passenger: {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      email: { type: String, default: "" },
      passportNumber: { type: String, required: true },
    },

    seatNumber: {
      type: String,
      required: true,
    },

    seatClass: {
      type: String,
      enum: ["Economy", "Premium Economy", "Business", "First Class"],
      required: true,
    },

    ticketStatus: {
      type: String,
      enum: [
        "Issued",
        "Confirmed",
        "Checked-In",
        "Boarded",
        "Completed",
        "Cancelled",
        "Refunded",
      ],
      default: "Issued",
    },

    issueDate: {
      type: Date,
      default: Date.now,
    },

    fareAmount: {
      type: Number,
      required: true,
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    // Embed snapshots of the booking and flight at time of ticket issuance
    bookingSnapshot: {
      bookingReference: { type: String },
      passenger: { type: Object },
      seatClass: { type: String },
      grandTotal: { type: Number },
    },
    flightSnapshot: {
      flightNumber: { type: String },
      originAirportCode: { type: String },
      destinationAirportCode: { type: String },
      departureDate: { type: Date },
      departureTime: { type: String },
      arrivalDate: { type: Date },
      arrivalTime: { type: String },
      airline: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Airline" },
        name: { type: String },
        code: { type: String },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
