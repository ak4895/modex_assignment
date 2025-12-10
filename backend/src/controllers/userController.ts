import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse } from '../types/index';

export class UserController {
  /**
   * Get or create a user
   * POST /api/users
   */
  static async getOrCreateUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, email',
        } as ApiResponse<null>);
        return;
      }

      const user = await UserService.getOrCreateUser(name, email);

      res.status(201).json({
        success: true,
        data: user,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create user',
      } as ApiResponse<null>);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(parseInt(id));

      res.json({
        success: true,
        data: user,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message || 'User not found',
      } as ApiResponse<null>);
    }
  }

  /**
   * Get all users
   * GET /api/users
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserService.getAllUsers();

      res.json({
        success: true,
        data: users,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const user = await UserService.updateUser(parseInt(id), name, email);

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully',
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }
}
