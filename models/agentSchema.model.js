import mongoose, { model } from "mongoose";



const agentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    fullName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "manager", "agent"],
      default: "agent",
    },

    permissions: [
      {
        type: String,
      },
    ],

    profileImage: {
      type: String,
      default: "",
    },

    agencyName: {
      type: String,
      required: true,
    },

    agencyCode: {
      type: String,
      unique: true,
    },

    address: {
      type: String,
    },

    city: {
      type: String,
    },

    country: {
      type: String,
      default: "Afghanistan",
    },

    commissionRate: {
      type: Number,
      default: 0,
    },

    salary: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

// Auto-generate fullName
agentSchema.pre("save", function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`;
  next();
});

export const Agent = mongoose.model("Agent", agentSchema);