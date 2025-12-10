import { query } from '../db/index';
import { Show, CreateShowRequest } from '../types/index';

export class ShowService {
  /**
   * Create a new show/trip/slot
   */
  static async createShow(showData: CreateShowRequest): Promise<Show> {
    const result = await query(
      `INSERT INTO shows (name, start_time, total_seats, available_seats, show_type, created_at, updated_at)
       VALUES ($1, $2, $3, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [showData.name, showData.start_time, showData.total_seats, showData.show_type || 'show']
    );

    return result.rows[0];
  }

  /**
   * Get all shows
   */
  static async getAllShows(): Promise<Show[]> {
    const result = await query(
      `SELECT * FROM shows WHERE start_time > CURRENT_TIMESTAMP ORDER BY start_time ASC`
    );

    return result.rows;
  }

  /**
   * Get show by ID
   */
  static async getShowById(showId: number): Promise<Show> {
    const result = await query(
      `SELECT * FROM shows WHERE id = $1`,
      [showId]
    );

    if (result.rows.length === 0) {
      throw new Error('Show not found');
    }

    return result.rows[0];
  }

  /**
   * Get shows by type (movie, bus, doctor)
   */
  static async getShowsByType(showType: string): Promise<Show[]> {
    const result = await query(
      `SELECT * FROM shows WHERE show_type = $1 AND start_time > CURRENT_TIMESTAMP ORDER BY start_time ASC`,
      [showType]
    );

    return result.rows;
  }

  /**
   * Update show details
   */
  static async updateShow(showId: number, updates: Partial<CreateShowRequest>): Promise<Show> {
    const allowedFields = ['name', 'start_time', 'show_type'];
    const updateParts: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateParts.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updateParts.length === 0) {
      return this.getShowById(showId);
    }

    params.push(showId);
    updateParts.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await query(
      `UPDATE shows SET ${updateParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0];
  }

  /**
   * Delete a show (only if no confirmed bookings)
   */
  static async deleteShow(showId: number): Promise<void> {
    const bookingResult = await query(
      `SELECT COUNT(*) as count FROM bookings WHERE show_id = $1 AND status = $2`,
      [showId, 'CONFIRMED']
    );

    if (parseInt(bookingResult.rows[0].count) > 0) {
      throw new Error('Cannot delete show with confirmed bookings');
    }

    await query(`DELETE FROM shows WHERE id = $1`, [showId]);
  }

  /**
   * Get show statistics
   */
  static async getShowStats(showId: number): Promise<any> {
    const showResult = await this.getShowById(showId);

    const bookingResult = await query(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_bookings
       FROM bookings WHERE show_id = $1`,
      [showId]
    );

    return {
      show: showResult,
      stats: bookingResult.rows[0],
    };
  }
}
