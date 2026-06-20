import mongoose, { model } from "mongoose";

const flightSchema = new mongoose.Schema(
  {
    flightNumber: {
      type: String,
      required: true,
      trim: true,
    },

    externalSource: {
      type: String,
      enum: ["amadeus", "manual"],
      default: "manual",
    },

    externalOfferKey: {
      type: String,
      unique: true,
      sparse: true,
    },

    airline: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Airline",
      required: true,
    },

    // Origin
    originAirport: {
      type: String,
      required: true,
    },

    originAirportCode: {
      type: String,
      required: true,
      uppercase: true,
    },

    originCity: {
      type: String,
      required: true,
    },

    originCountry: {
      type: String,
      required: true,
    },

    // Destination
    destinationAirport: {
      type: String,
      required: true,
    },

    destinationAirportCode: {
      type: String,
      required: true,
      uppercase: true,
    },

    destinationCity: {
      type: String,
      required: true,
    },

    destinationCountry: {
      type: String,
      required: true,
    },

    // Schedule
    departureDate: {
      type: Date,
      required: true,
    },

    departureTime: {
      type: String,
      required: true,
    },

    arrivalDate: {
      type: Date,
      required: true,
    },

    arrivalTime: {
      type: String,
      required: true,
    },

    duration: {
      type: String, // Example: "3h 45m"
      required: true,
    },

    // Seats
    totalSeats: {
      type: Number,
      required: true,
    },

    availableSeats: {
      type: Number,
      required: true,
    },

    // Prices
    economyPrice: {
      type: Number,
      required: true,
    },

    premiumEconomyPrice: {
      type: Number,
      default: 0,
    },

    businessPrice: {
      type: Number,
      default: 0,
    },

    firstClassPrice: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "USD",
    },

    // Flight Status
    flightStatus: {
      type: String,
      enum: [
        "Scheduled",
        "Boarding",
        "Departed",
        "In Air",
        "Landed",
        "Delayed",
        "Cancelled"
      ],
      default: "Scheduled",
    },

    // Stops
    stops: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


export const Flight = mongoose.model('Flight', flightSchema)