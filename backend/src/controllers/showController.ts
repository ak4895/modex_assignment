import { Request, Response } from 'express';
import { ShowService } from '../services/showService';
import { ApiResponse, CreateShowRequest } from '../types/index';

export class ShowController {
  /**
   * Create a new show/trip/slot
   * POST /api/shows
   */
  static async createShow(req: Request, res: Response): Promise<void> {
    try {
      const { name, start_time, total_seats, show_type } = req.body;

      if (!name || !start_time || !total_seats) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, start_time, total_seats',
        } as ApiResponse<null>);
        return;
      }

      if (total_seats <= 0) {
        res.status(400).json({
          success: false,
          error: 'total_seats must be greater than 0',
        } as ApiResponse<null>);
        return;
      }

      const showData: CreateShowRequest = {
        name,
        start_time,
        total_seats,
        show_type: show_type || 'show',
      };

      const show = await ShowService.createShow(showData);

      res.status(201).json({
        success: true,
        data: show,
        message: 'Show created successfully',
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create show',
      } as ApiResponse<null>);
    }
  }

  /**
   * Get all shows
   * GET /api/shows
   */
  static async getAllShows(req: Request, res: Response): Promise<void> {
    try {
      const shows = await ShowService.getAllShows();

      res.json({
        success: true,
        data: shows,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }

  /**
   * Get show by ID
   * GET /api/shows/:id
   */
  static async getShowById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const show = await ShowService.getShowById(parseInt(id));

      res.json({
        success: true,
        data: show,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message || 'Show not found',
      } as ApiResponse<null>);
    }
  }

  /**
   * Get shows by type
   * GET /api/shows/type/:type
   */
  static async getShowsByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const shows = await ShowService.getShowsByType(type);

      res.json({
        success: true,
        data: shows,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }

  /**
   * Update show
   * PUT /api/shows/:id
   */
  static async updateShow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const show = await ShowService.updateShow(parseInt(id), updates);

      res.json({
        success: true,
        data: show,
        message: 'Show updated successfully',
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }

  /**
   * Delete show
   * DELETE /api/shows/:id
   */
  static async deleteShow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await ShowService.deleteShow(parseInt(id));

      res.json({
        success: true,
        message: 'Show deleted successfully',
      } as ApiResponse<null>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }

  /**
   * Get show statistics
   * GET /api/shows/:id/stats
   */
  static async getShowStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stats = await ShowService.getShowStats(parseInt(id));

      res.json({
        success: true,
        data: stats,
      } as ApiResponse<any>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      } as ApiResponse<null>);
    }
  }
}
