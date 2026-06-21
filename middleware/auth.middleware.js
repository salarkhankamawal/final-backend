import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { Agent } from "../models/agentSchema.model.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Not authorized — no token provided"));
    console.log("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const agent = await Agent.findById(decoded.id).select("-password");

    if (!agent || agent.status !== "active") {
      return next(new ApiError(401, "Not authorized — agent inactive or not found"));
    }

    req.agent = agent;
    next();
  } catch {
    next(new ApiError(401, "Not authorized — invalid token"));
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.agent.role)) {
    return next(new ApiError(403, "You do not have permission for this action"));
  }
  next();
};
