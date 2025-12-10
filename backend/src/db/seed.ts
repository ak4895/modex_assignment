import { getConnection } from './index';

async function seed() {
  const pool = getConnection();
  
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await pool.query('DELETE FROM booking_seats');
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM shows');
    await pool.query('DELETE FROM users');

    // Reset sequences
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE shows_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');

    console.log('Cleared existing data');

    // Create users
    const users = [
      { email: 'admin@test.com', name: 'Admin User' },
      { email: 'user1@test.com', name: 'John Doe' },
      { email: 'user2@test.com', name: 'Jane Smith' },
      { email: 'user3@test.com', name: 'Mike Johnson' }
    ];

    console.log('Creating users...');
    for (const user of users) {
      await pool.query(
        'INSERT INTO users (email, name) VALUES ($1, $2)',
        [user.email, user.name]
      );
    }
    console.log(`Created ${users.length} users`);

    // Create shows
    const shows = [
      {
        name: 'Avengers: Endgame',
        start_time: new Date('2025-12-15T18:00:00'),
        total_seats: 100,
        available_seats: 85
      },
      {
        name: 'The Dark Knight',
        start_time: new Date('2025-12-16T20:00:00'),
        total_seats: 120,
        available_seats: 110
      },
      {
        name: 'Inception',
        start_time: new Date('2025-12-17T19:30:00'),
        total_seats: 80,
        available_seats: 60
      },
      {
        name: 'Interstellar',
        start_time: new Date('2025-12-18T21:00:00'),
        total_seats: 150,
        available_seats: 130
      },
      {
        name: 'The Matrix',
        start_time: new Date('2025-12-19T17:00:00'),
        total_seats: 100,
        available_seats: 90
      },
      {
        name: 'Pulp Fiction',
        start_time: new Date('2025-12-20T22:00:00'),
        total_seats: 90,
        available_seats: 85
      }
    ];

    console.log('Creating shows...');
    const showIds: number[] = [];
    for (const show of shows) {
      const result = await pool.query(
        'INSERT INTO shows (name, start_time, total_seats, available_seats, show_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [show.name, show.start_time, show.total_seats, show.available_seats, 'show']
      );
      showIds.push(result.rows[0].id);
    }
    console.log(`Created ${shows.length} shows`);

    // Create some bookings
    console.log('Creating bookings...');
    
    // User 2 booked 5 seats for Avengers
    const booking1 = await pool.query(
      'INSERT INTO bookings (user_id, show_id, seats_booked, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [2, showIds[0], 5, 'CONFIRMED']
    );
    for (let i = 1; i <= 5; i++) {
      await pool.query(
        'INSERT INTO booking_seats (booking_id, seat_number, show_id) VALUES ($1, $2, $3)',
        [booking1.rows[0].id, i, showIds[0]]
      );
    }

    // User 3 booked 10 seats for The Dark Knight
    const booking2 = await pool.query(
      'INSERT INTO bookings (user_id, show_id, seats_booked, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [3, showIds[1], 10, 'CONFIRMED']
    );
    for (let i = 1; i <= 10; i++) {
      await pool.query(
        'INSERT INTO booking_seats (booking_id, seat_number, show_id) VALUES ($1, $2, $3)',
        [booking2.rows[0].id, i, showIds[1]]
      );
    }

    // User 2 booked 20 seats for Inception
    const booking3 = await pool.query(
      'INSERT INTO bookings (user_id, show_id, seats_booked, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [2, showIds[2], 20, 'CONFIRMED']
    );
    for (let i = 1; i <= 20; i++) {
      await pool.query(
        'INSERT INTO booking_seats (booking_id, seat_number, show_id) VALUES ($1, $2, $3)',
        [booking3.rows[0].id, i, showIds[2]]
      );
    }

    // User 4 booked 20 seats for Interstellar
    const booking4 = await pool.query(
      'INSERT INTO bookings (user_id, show_id, seats_booked, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [4, showIds[3], 20, 'CONFIRMED']
    );
    for (let i = 1; i <= 20; i++) {
      await pool.query(
        'INSERT INTO booking_seats (booking_id, seat_number, show_id) VALUES ($1, $2, $3)',
        [booking4.rows[0].id, i, showIds[3]]
      );
    }

    // User 3 booked 10 seats for The Matrix
    const booking5 = await pool.query(
      'INSERT INTO bookings (user_id, show_id, seats_booked, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [3, showIds[4], 10, 'CONFIRMED']
    );
    for (let i = 1; i <= 10; i++) {
      await pool.query(
        'INSERT INTO booking_seats (booking_id, seat_number, show_id) VALUES ($1, $2, $3)',
        [booking5.rows[0].id, i, showIds[4]]
      );
    }

    // User 2 booked 5 seats for Pulp Fiction
    const booking6 = await pool.query(
      'INSERT INTO bookings (user_id, show_id, seats_booked, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [2, showIds[5], 5, 'CONFIRMED']
    );
    for (let i = 1; i <= 5; i++) {
      await pool.query(
        'INSERT INTO booking_seats (booking_id, seat_number, show_id) VALUES ($1, $2, $3)',
        [booking6.rows[0].id, i, showIds[5]]
      );
    }

    console.log('Created 6 bookings with seat assignments');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest Users:');
    console.log('User 1: user1@test.com (John Doe)');
    console.log('User 2: user2@test.com (Jane Smith)');
    console.log('User 3: user3@test.com (Mike Johnson)');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch(console.error);
