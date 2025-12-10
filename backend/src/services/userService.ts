import { query } from '../db/index';
import { User } from '../types/index';

export class UserService {
  /**
   * Create or get a user (for demo purposes, auto-create if doesn't exist)
   */
  static async getOrCreateUser(name: string, email: string): Promise<User> {
    // Try to get existing user
    let result = await query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new user
    result = await query(
      `INSERT INTO users (name, email, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING *`,
      [name, email]
    );

    return result.rows[0];
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: number): Promise<User> {
    const result = await query(
      `SELECT * FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Get all users
   */
  static async getAllUsers(): Promise<User[]> {
    const result = await query(`SELECT * FROM users ORDER BY created_at DESC`);
    return result.rows;
  }

  /**
   * Update user details
   */
  static async updateUser(userId: number, name?: string, email?: string): Promise<User> {
    let updates = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }

    if (email) {
      updates.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.getUserById(userId);
    }

    params.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0];
  }
}
