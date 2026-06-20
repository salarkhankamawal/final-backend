import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Customer } from "../models/customerSchema.model.js";
import { Booking } from "../models/BookingSchema.model.js";
import { Ticket } from "../models/ticketSchema.model.js";

export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find().sort({ name: 1 });
  res.json({ success: true, count: customers.length, data: customers });
});

export const getCustomerByPhone = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ phone: req.params.phone });
  if (!customer) throw new ApiError(404, "Customer not found");
  res.json({ success: true, data: customer });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, "Customer not found");
  res.json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!customer) throw new ApiError(404, "Customer not found");
  res.json({ success: true, data: customer });
});

export const getCustomerTicketHistory = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, "Customer not found");

  const bookings = await Booking.find({ customer: customer._id })
    .populate({ path: "flight", populate: { path: "airline" } })
    .sort({ createdAt: -1 });

  const tickets = await Ticket.find({
    booking: { $in: bookings.map((b) => b._id) },
  })
    .populate([
      { path: "flight", populate: { path: "airline" } },
      { path: "booking" },
    ])
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { customer, bookings, tickets },
  });
});
