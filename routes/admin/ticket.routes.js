import { Router } from "express";
import { getTicket, printTicket } from "../../controllers/ticket.controller.js";

const router = Router();

router.get("/:id", getTicket);
router.get("/:id/print", printTicket);

export default router;
