import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import routes
import bookingRoutes from './routes/bookingRoutes';
import showRoutes from './routes/showRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';

// Import database
import { getConnection } from './db/index';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ticket Booking System API',
      version: '1.0.0',
      description: 'A concurrent-safe ticket booking system API for shows, bus trips, and doctor appointments',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Show: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            start_time: { type: 'string', format: 'date-time' },
            total_seats: { type: 'integer' },
            available_seats: { type: 'integer' },
            show_type: { type: 'string', enum: ['show', 'bus', 'doctor'] },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            show_id: { type: 'integer' },
            seats_booked: { type: 'integer' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED'] },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Ticket Booking System API',
    version: '1.0.0',
    docs: '/api-docs',
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`\n✓ Server running on http://localhost:${port}`);
  console.log(`✓ API docs available at http://localhost:${port}/api-docs`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.DATABASE_URL) {
    const dbHost = process.env.DATABASE_URL.split('@')[1]?.split(':')[0] || 'unknown';
    console.log(`✓ Database: ${dbHost}\n`);
  } else {
    console.log(`❌ DATABASE_URL not configured\n`);
  }
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
  } else {
    console.error('Server error:', err);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  const pool = getConnection();
  pool.end(() => {
    console.log('Database connections closed');
    process.exit(0);
  });
});

export default app;
