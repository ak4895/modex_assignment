import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';

const router = Router();

/**
 * POST /api/bookings - Book seats
 * Body: { user_id, show_id, seats_booked }
 */
router.post('/', BookingController.bookSeats);

/**
 * GET /api/bookings/:id - Get booking details
 */
router.get('/:id', BookingController.getBooking);

/**
 * DELETE /api/bookings/:id - Cancel booking
 */
router.delete('/:id', BookingController.cancelBooking);

/**
 * GET /api/bookings/show/:showId - Get all bookings for a show
 */
router.get('/show/:showId', BookingController.getShowBookings);

/**
 * GET /api/bookings/user/:userId - Get all bookings for a user
 */
router.get('/user/:userId', BookingController.getUserBookings);

/**
 * POST /api/bookings/expire-old - Expire old pending bookings
 */
router.post('/expire-old', BookingController.expireOldBookings);

export default router;
