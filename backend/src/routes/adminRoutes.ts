import { Router } from 'express';
import { query, param, body, validationResult } from 'express-validator';
import pool from '../db/index';

const router = Router();

/**
 * GET /api/admin/shows/:showId/seats - Get all seat information for a show
 * Includes: booked seats, locked seats, maintenance, availability
 */
router.get('/shows/:showId/seats', async (req, res) => {
  try {
    const { showId } = req.params;

    // Get show details
    const showResult = await pool.query(
      'SELECT id, name, total_seats, available_seats FROM shows WHERE id = $1',
      [showId]
    );

    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const show = showResult.rows[0];

    // Get all booked seats
    const bookedSeatsResult = await pool.query(
      `SELECT DISTINCT bs.seat_number, b.id as booking_id, u.email, b.status, b.created_at
       FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       WHERE bs.show_id = $1 AND b.status = 'CONFIRMED'
       ORDER BY bs.seat_number`,
      [showId]
    );

    // Get locked seats (in progress bookings)
    const lockedSeatsResult = await pool.query(
      `SELECT DISTINCT bs.seat_number, b.id as booking_id, u.email, b.status, b.created_at
       FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       WHERE bs.show_id = $1 AND b.status = 'PENDING'
       ORDER BY bs.seat_number`,
      [showId]
    );

    // Get seat maintenance status (if table exists)
    const maintenanceResult = await pool.query(
      `SELECT seat_number FROM seat_maintenance WHERE show_id = $1`,
      [showId]
    ).catch(() => ({ rows: [] }));

    const bookedSeats = bookedSeatsResult.rows;
    const lockedSeats = lockedSeatsResult.rows;
    const maintenanceSeats = maintenanceResult.rows.map((r: any) => r.seat_number);

    res.json({
      show,
      bookedSeats,
      lockedSeats,
      maintenanceSeats,
      availableSeats: show.available_seats,
      occupancyRate: ((show.total_seats - show.available_seats) / show.total_seats * 100).toFixed(2),
    });
  } catch (error) {
    console.error('Error fetching seat details:', error);
    res.status(500).json({ error: 'Failed to fetch seat details' });
  }
});

/**
 * POST /api/admin/bookings/:bookingId/force-cancel - Admin force cancel a booking
 * Body: { reason }
 */
router.post('/bookings/:bookingId/force-cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get booking details
      const bookingResult = await client.query(
        'SELECT * FROM bookings WHERE id = $1',
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookingResult.rows[0];

      // Update booking status to CANCELLED
      await client.query(
        'UPDATE bookings SET status = $1 WHERE id = $2',
        ['CANCELLED', bookingId]
      );

      // Release seats back to availability
      await client.query(
        'UPDATE shows SET available_seats = available_seats + $1 WHERE id = $2',
        [booking.seats_booked, booking.show_id]
      );

      // Remove booking seats
      await client.query(
        'DELETE FROM booking_seats WHERE booking_id = $1',
        [bookingId]
      );

      // Log admin action
      await client.query(
        `INSERT INTO admin_actions (admin_id, action_type, booking_id, show_id, reason)
         VALUES (1, 'FORCE_CANCEL', $1, $2, $3)`,
        [bookingId, booking.show_id, reason || 'No reason provided']
      ).catch(() => null); // Ignore if table doesn't exist

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Booking #${bookingId} cancelled. ${booking.seats_booked} seats released.`,
        seatsReleased: booking.seats_booked,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error force cancelling booking:', error);
    res.status(500).json({ error: 'Failed to force cancel booking' });
  }
});

/**
 * POST /api/admin/seats/release - Release seats that are stuck/locked
 * Body: { showId, seatNumbers, reason }
 */
router.post('/seats/release', async (req, res) => {
  try {
    const { showId, seatNumbers, reason } = req.body;

    if (!showId || !seatNumbers || seatNumbers.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Find and cancel PENDING bookings with these seats
      const bookingSeatsResult = await client.query(
        `SELECT DISTINCT b.id, b.seats_booked, b.show_id
         FROM booking_seats bs
         JOIN bookings b ON bs.booking_id = b.id
         WHERE bs.show_id = $1 AND bs.seat_number = ANY($2) AND b.status = 'PENDING'`,
        [showId, seatNumbers]
      );

      const bookingsToRelease = bookingSeatsResult.rows;

      // Release each booking
      for (const booking of bookingsToRelease) {
        await client.query(
          'UPDATE bookings SET status = $1 WHERE id = $2',
          ['CANCELLED', booking.id]
        );

        await client.query(
          'DELETE FROM booking_seats WHERE booking_id = $1',
          [booking.id]
        );

        // Update available seats
        await client.query(
          'UPDATE shows SET available_seats = available_seats + $1 WHERE id = $2',
          [booking.seats_booked, showId]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Released ${bookingsToRelease.length} stuck booking(s)`,
        releasedSeats: seatNumbers.length,
        bookingsReleased: bookingsToRelease.length,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error releasing seats:', error);
    res.status(500).json({ error: 'Failed to release seats' });
  }
});

/**
 * POST /api/admin/seats/block - Block seats for maintenance
 * Body: { showId, seatNumbers }
 */
router.post('/seats/block', async (req, res) => {
  try {
    const { showId, seatNumbers } = req.body;

    if (!showId || !seatNumbers || seatNumbers.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create maintenance table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seat_maintenance (
        id SERIAL PRIMARY KEY,
        show_id INTEGER NOT NULL,
        seat_number INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(show_id, seat_number)
      )
    `);

    // Block seats
    for (const seatNumber of seatNumbers) {
      await pool.query(
        `INSERT INTO seat_maintenance (show_id, seat_number, reason)
         VALUES ($1, $2, 'Maintenance - Blocked by admin')
         ON CONFLICT DO NOTHING`,
        [showId, seatNumber]
      );
    }

    res.json({
      success: true,
      message: `${seatNumbers.length} seat(s) blocked for maintenance`,
      seatsBlocked: seatNumbers.length,
    });
  } catch (error) {
    console.error('Error blocking seats:', error);
    res.status(500).json({ error: 'Failed to block seats' });
  }
});

/**
 * POST /api/admin/seats/unblock - Unblock seats
 * Body: { showId, seatNumbers }
 */
router.post('/seats/unblock', async (req, res) => {
  try {
    const { showId, seatNumbers } = req.body;

    if (!showId || !seatNumbers || seatNumbers.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await pool.query(
      `DELETE FROM seat_maintenance WHERE show_id = $1 AND seat_number = ANY($2)`,
      [showId, seatNumbers]
    );

    res.json({
      success: true,
      message: `${seatNumbers.length} seat(s) unblocked`,
      seatsUnblocked: seatNumbers.length,
    });
  } catch (error) {
    console.error('Error unblocking seats:', error);
    res.status(500).json({ error: 'Failed to unblock seats' });
  }
});

/**
 * GET /api/admin/shows/:showId/occupancy - Get occupancy analytics
 */
router.get('/shows/:showId/occupancy', async (req, res) => {
  try {
    const { showId } = req.params;

    const result = await pool.query(
      `SELECT 
        s.id, s.name, s.total_seats, s.available_seats,
        (s.total_seats - s.available_seats) as booked_seats,
        ROUND(((s.total_seats - s.available_seats)::float / s.total_seats * 100)::numeric, 2) as occupancy_percent,
        COUNT(DISTINCT CASE WHEN b.status = 'CONFIRMED' THEN b.id END) as confirmed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'PENDING' THEN b.id END) as pending_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'CANCELLED' THEN b.id END) as cancelled_bookings,
        SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.seats_booked ELSE 0 END) as total_seats_sold,
        SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.seats_booked * 349 ELSE 0 END) as revenue
       FROM shows s
       LEFT JOIN bookings b ON s.id = b.show_id
       WHERE s.id = $1
       GROUP BY s.id, s.name, s.total_seats, s.available_seats`,
      [showId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching occupancy:', error);
    res.status(500).json({ error: 'Failed to fetch occupancy' });
  }
});

export default router;
