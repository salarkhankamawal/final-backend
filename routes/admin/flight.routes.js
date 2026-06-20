import { Router } from "express";
import {
  searchFlights,
  getPublicFlight,
} from "../../controllers/publicFlight.controller.js";

const router = Router();

router.get("/search", searchFlights);
router.get("/offers/:id", getPublicFlight);

export default router;
