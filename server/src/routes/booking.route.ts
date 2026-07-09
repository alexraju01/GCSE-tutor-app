import { getMyBookings } from "@controllers/booking.controller.js";
import { Role } from "@generated/enums.js";
import { authorize, protect } from "@middleware";
import { Router } from "express";

export const bookingRouter = Router();

// Protect all booking routes
bookingRouter.use(protect);

bookingRouter.route("/").get(getMyBookings).post(authorize(Role.Student)); // Only students can initiate a booking

bookingRouter.route("/:bookingId").delete(authorize(Role.Student)); // Only students can cancel their bookings here
