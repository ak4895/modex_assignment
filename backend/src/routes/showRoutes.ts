import { Router, Request, Response } from 'express';
import { ShowController } from '../controllers/showController';
import { BookingController } from '../controllers/bookingController';

const router = Router();

/**
 * POST /api/shows - Create a new show
 * Body: { name, start_time, total_seats, show_type? }
 */
router.post('/', ShowController.createShow);

/**
 * GET /api/shows - Get all shows
 */
router.get('/', ShowController.getAllShows);

/**
 * GET /api/shows/type/:type - Get shows by type
 */
router.get('/type/:type', ShowController.getShowsByType);

/**
 * GET /api/shows/:id/stats - Get show statistics
 */
router.get('/:id/stats', ShowController.getShowStats);

/**
 * GET /api/shows/:id/available-seats - Get available seats
 */
router.get('/:showId/available-seats', (req: Request, res: Response) => {
  return BookingController.getAvailableSeats(req, res);
});

/**
 * GET /api/shows/:id - Get show by ID
 */
router.get('/:id', ShowController.getShowById);

/**
 * PUT /api/shows/:id - Update show
 * Body: { name?, start_time?, show_type? }
 */
router.put('/:id', ShowController.updateShow);

/**
 * DELETE /api/shows/:id - Delete show
 */
router.delete('/:id', ShowController.deleteShow);

export default router;
