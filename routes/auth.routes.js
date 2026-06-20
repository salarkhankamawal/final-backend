import { Router } from "express";
import { registerAgent, loginAgent, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", registerAgent);
router.post("/login", loginAgent);
router.get("/me", protect, getMe);

export default router;
