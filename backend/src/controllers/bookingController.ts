import { Request, Response } from 'express';
import { BookingService } from '../services/bookingService';
import { ShowService } from '../services/showService';
import { UserService } from '../services/userService';
import { ApiResponse } from '../types/index';

export class BookingController {
  /**
   * Book seats for a show
   * POST /api/bookings
   */
  static async bookSeats(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, show_id, seats_booked } = req.body;

      if (!user_id || !show_id || !seats_booked) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: user_id, show_id, seats_booked',
        } as ApiResponse<null>);
        return;
      }

      if (seats_booked <= 0) {
        res.status(400).json({
          success: false,
          error: 'seats_booked must be greater than 0',
        } as ApiResponse<null>);
        return;
      }

      const booking = await BookingService.bookSeats(user_id, show_id, seats_booked);

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking confirmed successfully',
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to book seats',
      } as ApiResponse<null>);
    }
  }

  /**
   * Get booking details
   * GET /api/bookings/:id
   */
  static async getBooking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await BookingService.getBooking(parseInt(id));

      res.json({
        success: true,
        data: booking,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message || 'Booking not found',
      } as ApiResponse<null>);
    }
  }

  /**
   * Get user's bookings
   * GET /api/users/:userId/bookings
   */
  static async getUserBookings(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const bookings = await BookingService.getUserBookings(parseInt(userId));

      res.json({
        success: true,
        data: bookings,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }

  /**
   * Get show's bookings
   * GET /api/shows/:showId/bookings
   */
  static async getShowBookings(req: Request, res: Response): Promise<void> {
    try {
      const { showId } = req.params;
      const bookings = await BookingService.getShowBookings(parseInt(showId));

      res.json({
        success: true,
        data: bookings,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }

  /**
   * Cancel a booking
   * DELETE /api/bookings/:id
   */
  static async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await BookingService.cancelBooking(parseInt(id));

      res.json({
        success: true,
        data: booking,
        message: 'Booking cancelled successfully',
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }

  /**
   * Get available seats for a show
   * GET /api/shows/:showId/available-seats
   */
  static async getAvailableSeats(req: Request, res: Response): Promise<void> {
    try {
      const { showId } = req.params;
      const seats = await BookingService.getAvailableSeats(parseInt(showId));

      res.json({
        success: true,
        data: { available_seats: seats, count: seats.length },
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }

  /**
   * Expire old pending bookings
   * POST /api/bookings/expire-old
   */
  static async expireOldBookings(req: Request, res: Response): Promise<void> {
    try {
      const expiryMinutes = parseInt(process.env.BOOKING_EXPIRY_MINUTES || '2');
      const expiredCount = await BookingService.expireOldBookings(expiryMinutes);

      res.json({
        success: true,
        data: { expired_count: expiredCount },
        message: `${expiredCount} bookings expired`,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }
}
