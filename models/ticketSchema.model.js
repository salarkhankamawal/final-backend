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
  },
  {
    timestamps: true,
  }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
