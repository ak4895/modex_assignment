import { query } from './index';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting Supabase database seeding...');

    // Clear existing data (in reverse order of foreign keys)
    console.log('Clearing existing data...');
    await query('DELETE FROM booking_seats');
    await query('DELETE FROM seat_locks');
    await query('DELETE FROM seat_maintenance');
    await query('DELETE FROM bookings');
    await query('DELETE FROM shows');
    await query('DELETE FROM users');

    // Seed users
    console.log('Seeding users...');
    const usersData = [
      { name: 'Aayush Sharma', email: 'aayush@example.com' },
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
      { name: 'Robert Wilson', email: 'robert@example.com' },
      { name: 'Sarah Johnson', email: 'sarah@example.com' },
    ];

    let userIds: number[] = [];
    for (const user of usersData) {
      const result = await query(
        `INSERT INTO users (name, email, created_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP) 
         RETURNING id`,
        [user.name, user.email]
      );
      userIds.push(result.rows[0].id);
      console.log(`  ✓ Created user: ${user.name}`);
    }

    // Seed shows
    console.log('Seeding shows...');
    const showsData = [
      { name: 'Avatar: Fire and Ash - IMAX', start_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), total_seats: 120 },
      { name: 'Mufasa: The Lion King', start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), total_seats: 150 },
      { name: 'Sonic 3', start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), total_seats: 100 },
      { name: 'Wicked', start_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), total_seats: 200 },
      { name: 'Kraven the Hunter', start_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), total_seats: 80 },
      { name: 'Nosferatu', start_time: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), total_seats: 90 },
      { name: 'Varun Dhawan Live Concert', start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), total_seats: 500 },
      { name: 'Delhi to Mumbai Express', start_time: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), total_seats: 60 },
      { name: 'Dr. Smith Consultation', start_time: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), total_seats: 30 },
      { name: 'New Year Party 2025', start_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), total_seats: 300 },
    ];

    let showIds: number[] = [];
    for (const show of showsData) {
      const result = await query(
        `INSERT INTO shows (name, start_time, total_seats, available_seats, show_type, created_at, updated_at) 
         VALUES ($1, $2, $3, $3, 'show', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id`,
        [show.name, show.start_time, show.total_seats]
      );
      showIds.push(result.rows[0].id);
      console.log(`  ✓ Created show: ${show.name}`);
    }

    // Seed sample bookings with seats
    console.log('Seeding bookings...');
    const bookingData = [
      { userId: userIds[0], showId: showIds[0], seats: [1, 2, 3, 4] },
      { userId: userIds[1], showId: showIds[0], seats: [15, 16, 17, 18] },
      { userId: userIds[2], showId: showIds[1], seats: [5, 6, 7] },
      { userId: userIds[3], showId: showIds[2], seats: [10, 11] },
      { userId: userIds[4], showId: showIds[3], seats: [20, 21, 22, 23, 24] },
    ];

    for (const booking of bookingData) {
      // Create booking
      const bookingResult = await query(
        `INSERT INTO bookings (user_id, show_id, seats_booked, status, created_at, updated_at) 
         VALUES ($1, $2, $3, 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id`,
        [booking.userId, booking.showId, booking.seats.length]
      );
      const bookingId = bookingResult.rows[0].id;

      // Add seat details
      for (const seat of booking.seats) {
        await query(
          `INSERT INTO booking_seats (booking_id, seat_number, show_id, created_at) 
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [bookingId, seat, booking.showId]
        );
      }

      // Update show available seats
      await query(
        `UPDATE shows SET available_seats = available_seats - $1 WHERE id = $2`,
        [booking.seats.length, booking.showId]
      );

      console.log(`  ✓ Created booking for user ${booking.userId} at show ${booking.showId}`);
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
