import { Router } from "express";
import {
  getCustomers,
  getCustomerByPhone,
  getCustomer,
  updateCustomer,
  getCustomerTicketHistory,
} from "../../controllers/customer.controller.js";

const router = Router();

router.get("/", getCustomers);
router.get("/phone/:phone", getCustomerByPhone);
router.get("/:id/tickets", getCustomerTicketHistory);
router.route("/:id").get(getCustomer).put(updateCustomer);

export default router;
