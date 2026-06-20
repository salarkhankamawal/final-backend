import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      required: true,
    },

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },

    passenger: {
      name: { type: String, required: true, trim: true },
      age: { type: Number, required: true, min: 0 },
      email: { type: String, lowercase: true, trim: true, default: "" },
      passportNumber: { type: String, required: true, trim: true },
    },

    seatClass: {
      type: String,
      enum: ["Economy", "Premium Economy", "Business", "First Class"],
      default: "Economy",
    },

    paymentInfo: {
      method: {
        type: String,
        enum: ["Cash", "Card", "Bank Transfer", "Other"],
        default: "Cash",
      },
      amount: { type: Number, required: true },
      transactionId: { type: String, default: "" },
      notes: { type: String, default: "" },
    },

    totalFare: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Partially Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    bookingStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Ticketed", "Cancelled", "Completed"],
      default: "Pending",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelReason: {
      type: String,
      default: "",
    },

    rescheduledAt: {
      type: Date,
      default: null,
    },

    previousFlight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = mongoose.model("Booking", bookingSchema);
