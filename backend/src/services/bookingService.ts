import { getClient, query } from '../db/index';
import { PoolClient } from 'pg';
import { Booking, BookingStatus } from '../types/index';

/**
 * BookingService handles concurrent booking operations with ACID transaction support
 * to prevent race conditions and ensure data consistency
 */
export class BookingService {
  /**
   * Book seats for a show with transaction-based locking
   * Uses SELECT FOR UPDATE to implement pessimistic locking
   * Ensures atomicity and prevents overbooking
   */
  static async bookSeats(userId: number, showId: number, seatsToBook: number): Promise<Booking> {
    const client = await getClient();

    try {
      // Start transaction with SERIALIZABLE isolation level for maximum consistency
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // Lock the show row to prevent concurrent modifications
      const showResult = await client.query(
        `SELECT id, available_seats, total_seats FROM shows WHERE id = $1 FOR UPDATE`,
        [showId]
      );

      if (showResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Show not found');
      }

      const show = showResult.rows[0];

      if (show.available_seats < seatsToBook) {
        await client.query('ROLLBACK');
        throw new Error(`Insufficient seats. Available: ${show.available_seats}, Requested: ${seatsToBook}`);
      }

      // Create booking record
      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, show_id, seats_booked, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, showId, seatsToBook, 'PENDING']
      );

      const booking = bookingResult.rows[0];

      // Reserve available seats in show (decrement available_seats)
      await client.query(
        `UPDATE shows SET available_seats = available_seats - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [seatsToBook, showId]
      );

      // Get booked seats to record individual seats
      const bookedSeatsResult = await client.query(
        `SELECT seat_number FROM booking_seats WHERE show_id = $1 ORDER BY seat_number`,
        [showId]
      );

      const bookedSeats = new Set(bookedSeatsResult.rows.map((row: any) => row.seat_number));
      let seatsAllocated = 0;

      // Allocate specific seat numbers
      for (let seat = 1; seat <= show.total_seats && seatsAllocated < seatsToBook; seat++) {
        if (!bookedSeats.has(seat)) {
          await client.query(
            `INSERT INTO booking_seats (booking_id, seat_number, show_id, created_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [booking.id, seat, showId]
          );
          seatsAllocated++;
        }
      }

      // Auto-confirm booking immediately (can be changed to require admin approval)
      await client.query(
        `UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        ['CONFIRMED', booking.id]
      );

      await client.query('COMMIT');

      // Fetch and return updated booking
      const finalBooking = await client.query(
        `SELECT * FROM bookings WHERE id = $1`,
        [booking.id]
      );

      return finalBooking.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get booking details with seat information
   */
  static async getBooking(bookingId: number): Promise<any> {
    const result = await (await getClient()).query(
      `SELECT b.*, s.name as show_name, u.email as user_email
       FROM bookings b
       JOIN shows s ON b.show_id = s.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      throw new Error('Booking not found');
    }

    const booking = result.rows[0];

    // Get booked seats
    const seatsResult = await (await getClient()).query(
      `SELECT seat_number FROM booking_seats WHERE booking_id = $1 ORDER BY seat_number`,
      [bookingId]
    );

    return {
      ...booking,
      seats: seatsResult.rows.map((row: any) => row.seat_number),
    };
  }

  /**
   * Get all bookings for a user
   */
  static async getUserBookings(userId: number): Promise<Booking[]> {
    const result = await (await getClient()).query(
      `SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get all bookings for a show
   */
  static async getShowBookings(showId: number): Promise<any[]> {
    // Ultra-optimized: Single query to get all confirmed bookings with seats
    // Uses JSON aggregation to avoid N+1 queries
    const result = await query(
      `SELECT 
        b.id, 
        b.user_id, 
        b.show_id, 
        b.seats_booked, 
        b.status, 
        b.created_at,
        COALESCE(json_agg(bs.seat_number) FILTER (WHERE bs.seat_number IS NOT NULL), '[]'::json) as seats
       FROM bookings b
       LEFT JOIN booking_seats bs ON b.id = bs.booking_id
       WHERE b.show_id = $1 AND b.status = 'CONFIRMED'
       GROUP BY b.id, b.user_id, b.show_id, b.seats_booked, b.status, b.created_at
       ORDER BY b.created_at DESC`,
      [showId]
    );

    // Convert JSON seats to array of numbers
    return result.rows.map(row => ({
      ...row,
      seats: Array.isArray(row.seats) ? row.seats : []
    }));
  }

  /**
   * Cancel a booking (refund seats)
   */
  static async cancelBooking(bookingId: number): Promise<Booking> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get booking details
      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Booking not found');
      }

      const booking = bookingResult.rows[0];

      if (booking.status === 'CANCELLED') {
        await client.query('ROLLBACK');
        throw new Error('Booking already cancelled');
      }

      // Update booking status
      await client.query(
        `UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        ['CANCELLED', bookingId]
      );

      // Refund seats
      await client.query(
        `UPDATE shows SET available_seats = available_seats + $1 WHERE id = $2`,
        [booking.seats_booked, booking.show_id]
      );

      // Delete booking seats
      await client.query(
        `DELETE FROM booking_seats WHERE booking_id = $1`,
        [bookingId]
      );

      await client.query('COMMIT');

      return { ...booking, status: 'CANCELLED' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark expired pending bookings as FAILED
   * Runs periodically to clean up stale bookings
   */
  static async expireOldBookings(expiryMinutes: number = 2): Promise<number> {
    const result = await (await getClient()).query(
      `UPDATE bookings
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE status = $2 AND created_at < NOW() - INTERVAL '1 minute' * $3
       RETURNING id`,
      ['EXPIRED', 'PENDING', expiryMinutes]
    );

    // Refund seats for expired bookings
    for (const row of result.rows) {
      const bookingResult = await (await getClient()).query(
        `SELECT show_id, seats_booked FROM bookings WHERE id = $1`,
        [row.id]
      );

      if (bookingResult.rows.length > 0) {
        const { show_id, seats_booked } = bookingResult.rows[0];
        await (await getClient()).query(
          `UPDATE shows SET available_seats = available_seats + $1 WHERE id = $2`,
          [seats_booked, show_id]
        );

        await (await getClient()).query(
          `DELETE FROM booking_seats WHERE booking_id = $1`,
          [row.id]
        );
      }
    }

    return result.rows.length;
  }

  /**
   * Get available seats for a show
   */
  static async getAvailableSeats(showId: number): Promise<number[]> {
    const result = await (await getClient()).query(
      `SELECT total_seats FROM shows WHERE id = $1`,
      [showId]
    );

    if (result.rows.length === 0) {
      throw new Error('Show not found');
    }

    const { total_seats } = result.rows[0];

    const bookedResult = await (await getClient()).query(
      `SELECT DISTINCT seat_number FROM booking_seats WHERE show_id = $1`,
      [showId]
    );

    const bookedSeats = new Set(bookedResult.rows.map((row: any) => row.seat_number));
    const availableSeats: number[] = [];

    for (let i = 1; i <= total_seats; i++) {
      if (!bookedSeats.has(i)) {
        availableSeats.push(i);
      }
    }

    return availableSeats;
  }
}
