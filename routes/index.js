import { Router } from "express";
import authRoutes from "./auth.routes.js";
import flightRoutes from "./admin/flight.routes.js";
import bookingRoutes from "./admin/booking.routes.js";
import customerRoutes from "./admin/customer.routes.js";
import ticketRoutes from "./admin/ticket.routes.js";
import publicFlightRoutes from "./public/flight.routes.js";
import publicTicketRoutes from "./public/ticket.routes.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Travel Agency API is running" });
});

router.use("/auth", authRoutes);

router.use("/flights", publicFlightRoutes);
router.use("/tickets", publicTicketRoutes);

router.use("/admin/flights", protect, flightRoutes);
router.use("/admin/bookings", protect, bookingRoutes);
router.use("/admin/customers", protect, customerRoutes);
router.use("/admin/tickets", protect, ticketRoutes);

export default router;
