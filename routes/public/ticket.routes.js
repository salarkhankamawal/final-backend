import { Router } from "express";
import { verifyTicket } from "../controllers/ticket.controller.js";

const router = Router();

router.get("/verify", verifyTicket);

export default router;
