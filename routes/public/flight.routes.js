import { Router } from "express";
import {
  searchFlights,
  getFlightSuggestions,
  getPublicFlight,
} from "../../controllers/publicFlight.controller.js";

const router = Router();

router.get("/", searchFlights);
router.get("/suggestions", getFlightSuggestions);
router.get("/:id", getPublicFlight);

export default router;
