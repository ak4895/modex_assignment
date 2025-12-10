import { getClient } from './index';

const migrate = async () => {
  const client = await getClient();

  try {
    console.log('Starting database migration...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    // Create shows table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shows (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        total_seats INT NOT NULL CHECK (total_seats > 0),
        available_seats INT NOT NULL CHECK (available_seats >= 0),
        show_type VARCHAR(50) NOT NULL DEFAULT 'show',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Shows table created');

    // Create bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        show_id INT REFERENCES shows(id) ON DELETE CASCADE,
        seats_booked INT NOT NULL CHECK (seats_booked > 0),
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_status CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED'))
      );
    `);
    console.log('✓ Bookings table created');

    // Create booking details table to track individual seats
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking_seats (
        id SERIAL PRIMARY KEY,
        booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
        seat_number INT NOT NULL,
        show_id INT REFERENCES shows(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(show_id, seat_number)
      );
    `);
    console.log('✓ Booking seats table created');

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_show_id ON bookings(show_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_booking_seats_show_id ON booking_seats(show_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shows_start_time ON shows(start_time);
    `);
    console.log('✓ Indexes created');

    console.log('✓ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

migrate();
