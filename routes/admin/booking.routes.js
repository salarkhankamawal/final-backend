import { Router } from "express";
import {
  getBookings,
  getBooking,
  createBookingHandler,
  confirmBookingHandler,
  cancelBookingHandler,
  rescheduleBookingHandler,
} from "../../controllers/booking.controller.js";

const router = Router();

router.route("/").get(getBookings).post(createBookingHandler);
router.route("/:id").get(getBooking);
router.patch("/:id/confirm", confirmBookingHandler);
router.patch("/:id/cancel", cancelBookingHandler);
router.patch("/:id/reschedule", rescheduleBookingHandler);

export default router;
