import mongoose, { model } from "mongoose";


const airlineSchema = new mongoose.Schema(
  {
    airlineName: {
      type: String,
      required: true,
      trim: true,
    },

    iataCode: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 2,
      maxlength: 2,
      unique: true,
    },

    icaoCode: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      unique: true,
    },

    country: {
      type: String,
      required: true,
    },

    headquarters: {
      type: String,
    },

    logo: {
      type: String, // Logo URL
    },

    website: {
      type: String,
    },

    contactEmail: {
      type: String,
      lowercase: true,
    },

    contactPhone: {
      type: String,
    },

    supportNumber: {
      type: String,
    },

    cabinClasses: [
      {
        type: String,
        enum: [
          "Economy",
          "Premium Economy",
          "Business",
          "First Class",
        ],
      },
    ],

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export const Airline = mongoose.model("Airline", airlineSchema);