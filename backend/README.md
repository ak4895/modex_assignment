# Ticket Booking System - Backend

A production-ready concurrent-safe ticket booking system built with Node.js, Express, and PostgreSQL. Designed to handle high-concurrency booking scenarios for shows, bus trips, and doctor appointments.

## Key Features

### Core Functionality
- **Show/Slot Management**: Create and manage shows, bus trips, or doctor appointment slots
- **User Management**: User registration and profile management
- **Concurrent Booking**: Thread-safe booking with transaction-based locking
- **Booking Status Tracking**: PENDING, CONFIRMED, FAILED, EXPIRED states
- **Seat Allocation**: Real-time seat availability and allocation

### Concurrency & Reliability
- **SERIALIZABLE Transactions**: Uses PostgreSQL's SERIALIZABLE isolation level for maximum consistency
- **Pessimistic Locking**: SELECT FOR UPDATE prevents race conditions
- **Automatic Expiry**: PENDING bookings expire after 2 minutes with automatic refunding
- **ACID Compliance**: All operations are atomic and consistent

### Production Ready
- **Comprehensive Validation**: Input validation and error handling
- **API Documentation**: Swagger/OpenAPI documentation
- **Health Checks**: Built-in health monitoring endpoints
- **Connection Pooling**: Efficient database connection management
- **Security Headers**: Helmet.js for security hardening
- **CORS Support**: Cross-origin resource sharing enabled

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL 12+
- **Language**: TypeScript 5.3+
- **Package Manager**: npm
- **Documentation**: Swagger/OpenAPI 3.0

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ (local or cloud)
- Git

## Installation

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd modex_assignment/backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticket_booking
DB_USER=postgres
DB_PASSWORD=postgres

# Booking Configuration
BOOKING_EXPIRY_MINUTES=2
```

### 4. Create Database (if not exists)
```bash
createdb ticket_booking
```

### 5. Run Database Migration
```bash
npm run migrate
```

This will create all necessary tables and indexes:
- `users` - User accounts
- `shows` - Shows/trips/slots
- `bookings` - Booking records
- `booking_seats` - Individual seat allocations
- Indexes for performance optimization

## Running the Server

### Development Mode
```bash
npm run dev
```

Server starts on `http://localhost:3001`

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

### Base URL
```
http://localhost:3001/api
```

### Shows Endpoints

#### Create Show
```
POST /shows
Content-Type: application/json

{
  "name": "Movie XYZ",
  "start_time": "2024-12-15T18:30:00Z",
  "total_seats": 100,
  "show_type": "movie"  // Optional: movie, bus, doctor
}
```

#### Get All Shows
```
GET /shows
```

#### Get Show by ID
```
GET /shows/:id
```

#### Get Shows by Type
```
GET /shows/type/:type
```

#### Get Available Seats
```
GET /shows/:showId/available-seats
```

#### Get Show Statistics
```
GET /shows/:id/stats
```

#### Update Show
```
PUT /shows/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "start_time": "2024-12-15T19:00:00Z"
}
```

#### Delete Show
```
DELETE /shows/:id
```

### Users Endpoints

#### Create/Get User
```
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### Get All Users
```
GET /users
```

#### Get User by ID
```
GET /users/:id
```

#### Update User
```
PUT /users/:id
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

### Bookings Endpoints

#### Book Seats
```
POST /bookings
Content-Type: application/json

{
  "user_id": 1,
  "show_id": 1,
  "seats_booked": 3
}
```

**Response on success:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "show_id": 1,
    "seats_booked": 3,
    "status": "CONFIRMED",
    "created_at": "2024-12-11T10:30:00Z",
    "updated_at": "2024-12-11T10:30:00Z"
  },
  "message": "Booking confirmed successfully"
}
```

#### Get Booking Details
```
GET /bookings/:id
```

#### Get User's Bookings
```
GET /bookings/user/:userId
```

#### Get Show's Bookings
```
GET /bookings/show/:showId
```

#### Cancel Booking
```
DELETE /bookings/:id
```

#### Expire Old Bookings
```
POST /bookings/expire-old
```

## Concurrency Handling Strategy

### Race Condition Prevention

The system uses a multi-layered approach to prevent race conditions and overbooking:

#### 1. **SERIALIZABLE Transactions**
```sql
BEGIN ISOLATION LEVEL SERIALIZABLE
  -- Lock show row
  SELECT ... FROM shows WHERE id = $1 FOR UPDATE
  
  -- Check availability
  IF available_seats < requested_seats THEN ROLLBACK
  
  -- Create booking atomically
  INSERT INTO bookings ...
  UPDATE shows SET available_seats = available_seats - $1
  INSERT INTO booking_seats ...
  
COMMIT
```

#### 2. **Pessimistic Locking**
- Row-level locks via `SELECT FOR UPDATE`
- Prevents dirty reads and lost updates
- Ensures consistent state across concurrent requests

#### 3. **Atomic Operations**
- All booking operations in single transaction
- Either fully succeeds or fully fails
- No partial booking states

#### 4. **Conflict Resolution**
- If lock timeout occurs, transaction automatically rolls back
- API returns conflict error to client
- User can retry immediately

### Concurrency Test Scenarios

The system handles these scenarios safely:

1. **Multiple users booking same seats**: Only first gets the seats
2. **Overbooking attempts**: Excess booking requests fail with "insufficient seats"
3. **Concurrent cancellations**: Seats properly refunded with no double-refunds
4. **Session conflicts**: Different DB sessions don't interfere with each other
5. **Network delays**: Isolation level prevents consistency violations

## Architecture Decisions

### Database Design
- **Normalized schema**: Users, Shows, Bookings (with seats tracking)
- **Foreign keys**: Maintain referential integrity
- **Indexes**: Optimize queries on frequently accessed columns
- **Constraints**: Enforce business logic at DB level

### Booking Workflow
1. User initiates booking request
2. System locks the show row
3. Checks seat availability
4. Creates booking record
5. Reserves seats in booking_seats table
6. Updates available_seats counter
7. Auto-confirms booking
8. Releases lock and commits transaction

### Error Handling
- Validation at controller level
- Service layer error messages
- Database constraint enforcement
- Automatic rollback on any failure

## Booking Expiry Bonus Feature

Pending bookings automatically expire after 2 minutes:

```bash
# Manually trigger expiry check
curl -X POST http://localhost:3001/api/bookings/expire-old

# Or set up a scheduled job (cron) to run every minute:
*/1 * * * * curl -X POST http://localhost:3001/api/bookings/expire-old
```

When a booking expires:
1. Status changes to EXPIRED
2. Booked seats are returned to available_seats
3. Booking records remain for audit trail

## Monitoring & Debugging

### Health Check
```bash
curl http://localhost:3001/health
```

### API Documentation
Visit `http://localhost:3001/api-docs` for interactive Swagger UI

### Debug Logs
```bash
NODE_ENV=development npm run dev
```

## Testing Concurrency

### Using Apache Bench
```bash
# Concurrent booking requests
ab -n 100 -c 10 -p booking.json -T application/json http://localhost:3001/api/bookings
```

### Using cURL
```bash
# Single booking
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "show_id": 1, "seats_booked": 3}'
```

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=ticket_booking
DB_USER=prod_user
DB_PASSWORD=strong_password
BOOKING_EXPIRY_MINUTES=2
```

### Render Deployment
1. Push code to GitHub
2. Connect GitHub repository to Render
3. Set environment variables in Render dashboard
4. PostgreSQL database can be provisioned by Render
5. Deploy with build command: `npm install && npm run build`
6. Start command: `npm start`

### Railway Deployment
1. Create project on Railway
2. Connect GitHub repository
3. Add PostgreSQL service
4. Set environment variables
5. Deploy automatically on git push

## Production Considerations

### Scaling Strategy
1. **Horizontal Scaling**: Deploy multiple instances behind load balancer
2. **Database Replication**: Master-slave setup for read scaling
3. **Connection Pooling**: Currently set to max 20 connections (configurable)
4. **Caching**: Redis for frequently accessed shows (optional)
5. **Message Queue**: RabbitMQ for async booking confirmations (optional)

### High-Volume Handling
- Current setup handles ~100 concurrent users
- For 10,000+ concurrent: Implement queue-based booking system
- Use CDC (Change Data Capture) for event streaming
- Implement sharding by show_id for very large datasets

### Monitoring
- Application Performance Monitoring (APM)
- Database query optimization
- Connection pool monitoring
- Error rate tracking
- Response time metrics

## Troubleshooting

### Issue: Connection Pool Exhausted
```
Error: connect timeout expired
```
Solution: Increase `max` in pool configuration or reduce concurrent users

### Issue: Serialization Conflict
```
Error: could not serialize access due to concurrent update
```
Solution: Automatic retry at client side - system recovers gracefully

### Issue: Expired Bookings Not Cleaned Up
Solution: Ensure `npm run bookings/expire-old` runs periodically via cron job

## License

ISC

## Support

For issues or questions, refer to the GitHub repository issues section.

---

**Built with ❤️ for high-concurrency ticket booking scenarios**
