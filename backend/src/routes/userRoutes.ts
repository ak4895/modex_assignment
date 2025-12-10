import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

/**
 * POST /api/users - Create or get a user
 * Body: { name, email }
 */
router.post('/', UserController.getOrCreateUser);

/**
 * GET /api/users - Get all users
 */
router.get('/', UserController.getAllUsers);

/**
 * GET /api/users/:id - Get user by ID
 */
router.get('/:id', UserController.getUserById);

/**
 * PUT /api/users/:id - Update user
 * Body: { name?, email? }
 */
router.put('/:id', UserController.updateUser);

export default router;
