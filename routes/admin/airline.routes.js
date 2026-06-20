import { Router } from "express";
import {
  getAirlines,
  getAirline,
  createAirline,
  updateAirline,
  deleteAirline,
} from "../controllers/airline.controller.js";

const router = Router();

router.route("/").get(getAirlines).post(createAirline);
router.route("/:id").get(getAirline).put(updateAirline).delete(deleteAirline);

export default router;
