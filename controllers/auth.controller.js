import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Agent } from "../models/agentSchema.model.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

export const registerAgent = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password, agencyName, role } = req.body;

  if (!firstName || !lastName || !email || !phone || !password || !agencyName) {
    throw new ApiError(400, "Please provide all required fields");
  }

  const existing = await Agent.findOne({ email });
  if (existing) throw new ApiError(409, "An agent with this email already exists");

  const agent = await Agent.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    agencyName,
    role: role || "agent",
  });

  const token = signToken(agent._id);

  res.status(201).json({
    success: true,
    data: {
      agent: {
        id: agent._id,
        fullName: agent.fullName,
        email: agent.email,
        role: agent.role,
        agencyName: agent.agencyName,
      },
      token,
    },
  });
});

export const loginAgent = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const agent = await Agent.findOne({ email });
  if (!agent || !(await agent.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (agent.status !== "active") {
    throw new ApiError(403, "Your account is not active");
  }

  agent.lastLogin = new Date();
  await agent.save();

  res.json({
    success: true,
    data: {
      agent: {
        id: agent._id,
        fullName: agent.fullName,
        email: agent.email,
        role: agent.role,
        agencyName: agent.agencyName,
      },
      token: signToken(agent._id),
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.agent });
});
