import { getConnection } from './index';

// Pricing rules for different show types
const pricingRules = {
  movie: {
    Premium: { rows: [1, 2, 3], price: 449 },
    Regular: { rows: [4, 5, 6, 7, 8], price: 349 },
    Economy: { rows: [9, 10], price: 249 }
  },
  concert: {
    VIP: { rows: [1, 2], price: 799 },
    Premium: { rows: [3, 4, 5], price: 599 },
    Standard: { rows: [6, 7, 8, 9, 10], price: 399 }
  },
  theater: {
    Premium: { rows: [1, 2, 3, 4, 5], price: 549 },
    Standard: { rows: [6, 7, 8, 9], price: 349 },
    Economy: { rows: [10], price: 199 }
  }
};

function getPriceForSeat(seatNumber: number, showType: string): number {
  const rules = pricingRules[showType as keyof typeof pricingRules] || pricingRules.movie;
  
  for (const [category, config] of Object.entries(rules)) {
    if ((config.rows as number[]).includes(seatNumber)) {
      return config.price;
    }
  }
  
  return 349; // Default price
}

async function seed() {
  const pool = getConnection();
  
  try {
    console.log('Starting database seeding...');

    // Clear existing data (in correct order due to foreign keys)
    await pool.query('DELETE FROM seat_maintenance');
    await pool.query('DELETE FROM seat_locks');
    await pool.query('DELETE FROM booking_seats');
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM shows');
    await pool.query('DELETE FROM users');

    // Reset sequences
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE shows_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');

    console.log('✓ Cleared existing data');

    // Create users - More diverse set with admin
    const users = [
      { email: 'admin@test.com', name: 'Admin User' },
      { email: 'john@test.com', name: 'John Doe' },
      { email: 'jane@test.com', name: 'Jane Smith' },
      { email: 'mike@test.com', name: 'Mike Johnson' },
      { email: 'sarah@test.com', name: 'Sarah Wilson' },
      { email: 'robert@test.com', name: 'Robert Brown' },
      { email: 'emma@test.com', name: 'Emma Davis' },
      { email: 'james@test.com', name: 'James Miller' },
      { email: 'olivia@test.com', name: 'Olivia Taylor' },
      { email: 'william@test.com', name: 'William Anderson' },
    ];

    console.log('Creating users...');
    for (const user of users) {
      await pool.query(
        'INSERT INTO users (email, name) VALUES ($1, $2)',
        [user.email, user.name]
      );
    }
    console.log(`✓ Created ${users.length} users`);

    // Create shows with variety - movie, concert, theater
    const today = new Date();
    const shows = [
      {
        name: 'Avatar: Fire and Ash - IMAX',
        start_time: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
        total_seats: 120,
        show_type: 'movie'
      },
      {
        name: 'Dhurandhar - Hindi',
        start_time: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        total_seats: 100,
        show_type: 'movie'
      },
      {
        name: 'Inception - 4K Remaster',
        start_time: new Date(today.getTime() + 1.5 * 24 * 60 * 60 * 1000),
        total_seats: 80,
        show_type: 'movie'
      },
      {
        name: 'The Matrix Resurrections',
        start_time: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        total_seats: 100,
        show_type: 'movie'
      },
      {
        name: 'Interstellar',
        start_time: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
        total_seats: 150,
        show_type: 'movie'
      },
      {
        name: 'Arijit Singh Concert 2025',
        start_time: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        total_seats: 5000,
        show_type: 'concert'
      },
      {
        name: 'Ed Sheeran Live Tour',
        start_time: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        total_seats: 8000,
        show_type: 'concert'
      },
      {
        name: 'Hamlet - Classic Theater',
        start_time: new Date(today.getTime() + 2.5 * 24 * 60 * 60 * 1000),
        total_seats: 200,
        show_type: 'theater'
      },
      {
        name: 'A Midsummer Night\'s Dream',
        start_time: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000),
        total_seats: 250,
        show_type: 'theater'
      },
      {
        name: 'The Phantom of the Opera',
        start_time: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        total_seats: 300,
        show_type: 'theater'
      }
    ];

    console.log('Creating shows with pricing rules...');
    const showIds: { id: number; type: string }[] = [];
    for (const show of shows) {
      const pricing = pricingRules[show.show_type as keyof typeof pricingRules];
      const result = await pool.query(
        `INSERT INTO shows (name, start_time, total_seats, available_seats, show_type, pricing_rules) 
         VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING id`,
        [show.name, show.start_time, show.total_seats, show.total_seats, show.show_type, JSON.stringify(pricing)]
      );
      showIds.push({ id: result.rows[0].id, type: show.show_type });
    }
    console.log(`✓ Created ${shows.length} shows with pricing rules`);

    // Create comprehensive bookings for testing
    console.log('Creating bookings with pricing...');
    
    const bookingConfigs = [
      // Show 1: Avatar (IMAX) - Movie
      { userIdx: 1, showIdx: 0, seatNums: [1, 2, 3, 4, 5] },  // Premium seats
      { userIdx: 2, showIdx: 0, seatNums: [15, 16, 17, 18, 19] },  // Regular seats
      { userIdx: 3, showIdx: 0, seatNums: [50, 51, 52, 53] },  // Regular seats
      { userIdx: 4, showIdx: 0, seatNums: [85, 86, 87] },  // Economy seats
      
      // Show 2: Dhurandhar - Movie
      { userIdx: 5, showIdx: 1, seatNums: [1, 2, 3, 4, 5, 6, 7, 8] },  // Premium + Regular
      { userIdx: 6, showIdx: 1, seatNums: [40, 41, 42, 43, 44] },  // Regular seats
      
      // Show 3: Inception - Movie
      { userIdx: 7, showIdx: 2, seatNums: [1, 2, 3] },  // Premium
      { userIdx: 8, showIdx: 2, seatNums: [20, 21, 22, 23, 24, 25] },  // Regular
      
      // Show 4: Matrix - Movie
      { userIdx: 9, showIdx: 3, seatNums: [10, 11, 12, 13, 14] },  // Regular
      { userIdx: 2, showIdx: 3, seatNums: [60, 61, 62, 63] },  // Regular
      
      // Show 5: Interstellar - Movie
      { userIdx: 3, showIdx: 4, seatNums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },  // Premium + Regular
      { userIdx: 1, showIdx: 4, seatNums: [50, 51, 52, 53, 54] },  // Regular
      
      // Show 6: Arijit Singh Concert
      { userIdx: 4, showIdx: 5, seatNums: [1, 2, 3, 4, 5, 100, 101, 102, 103, 104] },  // VIP + Premium
      { userIdx: 5, showIdx: 5, seatNums: [200, 201, 202, 203, 204] },  // Standard
      { userIdx: 6, showIdx: 5, seatNums: [400, 401, 402, 403, 404] },  // Standard
      
      // Show 7: Ed Sheeran Concert
      { userIdx: 7, showIdx: 6, seatNums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },  // VIP + Premium
      { userIdx: 8, showIdx: 6, seatNums: [500, 501, 502, 503, 504] },  // Standard
      
      // Show 8: Hamlet Theater
      { userIdx: 9, showIdx: 7, seatNums: [1, 2, 3, 4, 5, 6, 7, 8] },  // Premium
      { userIdx: 1, showIdx: 7, seatNums: [50, 51, 52, 53, 54, 55] },  // Standard
      
      // Show 9: Midsummer - Theater
      { userIdx: 2, showIdx: 8, seatNums: [1, 2, 3, 4, 5] },  // Premium
      { userIdx: 3, showIdx: 8, seatNums: [100, 101, 102, 103, 104] },  // Standard
      
      // Show 10: Phantom - Theater
      { userIdx: 4, showIdx: 9, seatNums: [1, 2, 3, 4, 5, 6, 7, 8] },  // Premium
      { userIdx: 5, showIdx: 9, seatNums: [80, 81, 82, 83, 84] },  // Standard
    ];

    let bookingCount = 0;
    for (const config of bookingConfigs) {
      const showId = showIds[config.showIdx].id;
      const showType = showIds[config.showIdx].type;
      
      // Calculate total price
      let totalPrice = 0;
      for (const seatNum of config.seatNums) {
        totalPrice += getPriceForSeat(seatNum, showType);
      }

      const booking = await pool.query(
        `INSERT INTO bookings (user_id, show_id, seats_booked, status, total_price) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [config.userIdx + 1, showId, config.seatNums.length, 'CONFIRMED', totalPrice]
      );
      
      // Add seat assignments with pricing
      for (const seatNum of config.seatNums) {
        const seatPrice = getPriceForSeat(seatNum, showType);
        await pool.query(
          'INSERT INTO booking_seats (booking_id, seat_number, show_id, price) VALUES ($1, $2, $3, $4)',
          [booking.rows[0].id, seatNum, showId, seatPrice]
        );
      }
      bookingCount++;
    }

    console.log(`✓ Created ${bookingCount} bookings with pricing`);

    // Add some maintenance seats (blocked for testing)
    console.log('Adding maintenance blocked seats...');
    let maintenanceCount = 0;
    for (let i = 0; i < showIds.length; i++) {
      const blockedSeats = [1, 2]; // Maintenance in rows
      for (const seat of blockedSeats) {
        try {
          await pool.query(
            `INSERT INTO seat_maintenance (show_id, seat_number, reason) VALUES ($1, $2, $3)`,
            [showIds[i].id, 1000 + seat, 'Seat damaged - under repair']
          );
          maintenanceCount++;
        } catch (e) {
          // Ignore unique constraint errors
        }
      }
    }
    console.log(`✓ Added ${maintenanceCount} maintenance blocked seats`);

    // Add some locks for testing (simulating in-progress checkouts)
    console.log('Adding test seat locks (in-progress checkouts)...');
    const lockConfigs = [
      { showIdx: 0, seatNums: [10, 11, 12], userIdx: 2 },  // Avatar
      { showIdx: 1, seatNums: [25, 26, 27, 28], userIdx: 3 },  // Dhurandhar
      { showIdx: 5, seatNums: [1000, 1001, 1002], userIdx: 6 },  // Arijit Concert
    ];

    let lockCount = 0;
    for (const config of lockConfigs) {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      for (const seatNum of config.seatNums) {
        try {
          await pool.query(
            `INSERT INTO seat_locks (show_id, seat_number, user_id, expires_at, reason) 
             VALUES ($1, $2, $3, $4, $5)`,
            [showIds[config.showIdx].id, seatNum, config.userIdx + 1, expiresAt, 'Checkout in progress']
          );
          lockCount++;
        } catch (e) {
          // Ignore unique constraint errors
        }
      }
    }
    console.log(`✓ Added ${lockCount} test seat locks`);

    // Update available seats for each show based on bookings
    console.log('Updating show availability...');
    for (let i = 0; i < showIds.length; i++) {
      const seatCountResult = await pool.query(
        `SELECT COUNT(*) as booked FROM booking_seats WHERE show_id = $1`,
        [showIds[i].id]
      ) as any;
      const booked = parseInt((seatCountResult as any).rows[0].booked) || 0;
      const showResult = await pool.query(`SELECT total_seats FROM shows WHERE id = $1`, [showIds[i].id]);
      const total = showResult.rows[0].total_seats;
      const available = total - booked;
      
      await pool.query(
        `UPDATE shows SET available_seats = $1 WHERE id = $2`,
        [Math.max(0, available), showIds[i].id]
      );
    }
    console.log('✓ Updated show availability');

    // Get statistics for display
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const showCount = await pool.query('SELECT COUNT(*) as count FROM shows');
    const bookingCountResult = await pool.query('SELECT COUNT(*) as count FROM bookings');
    const seatsBookedCount = await pool.query('SELECT COUNT(*) as count FROM booking_seats');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📊 Seed Statistics:');
    console.log(`   - Total Users: ${userCount.rows[0].count}`);
    console.log(`   - Total Shows: ${showCount.rows[0].count}`);
    console.log(`   - Total Bookings: ${bookingCountResult.rows[0].count}`);
    console.log(`   - Total Seats Booked: ${seatsBookedCount.rows[0].count}`);
    console.log('\n🎬 Shows Created:');
    console.log('   Movies:');
    console.log('   1. Avatar: Fire and Ash - IMAX (120 seats, Premium/Regular/Economy pricing)');
    console.log('   2. Dhurandhar - Hindi (100 seats)');
    console.log('   3. Inception - 4K Remaster (80 seats)');
    console.log('   4. The Matrix Resurrections (100 seats)');
    console.log('   5. Interstellar (150 seats)');
    console.log('\n   Concerts:');
    console.log('   6. Arijit Singh Concert 2025 (5000 seats, VIP/Premium/Standard pricing)');
    console.log('   7. Ed Sheeran Live Tour (8000 seats)');
    console.log('\n   Theater:');
    console.log('   8. Hamlet - Classic Theater (200 seats, Premium/Standard/Economy pricing)');
    console.log('   9. A Midsummer Night\'s Dream (250 seats)');
    console.log('   10. The Phantom of the Opera (300 seats)');
    console.log('\n💰 Pricing Structure:');
    console.log('   Movies: Premium ₹449 | Regular ₹349 | Economy ₹249');
    console.log('   Concerts: VIP ₹799 | Premium ₹599 | Standard ₹399');
    console.log('   Theater: Premium ₹549 | Standard ₹349 | Economy ₹199');
    console.log('\n👥 Test Users (can login):');
    users.forEach((user, idx) => {
      if (idx === 0) {
        console.log(`   Admin: ${user.email} (${user.name}) - Full admin access`);
      } else {
        console.log(`   User ${idx}: ${user.email} (${user.name})`);
      }
    });
    console.log('\n🔒 Test Locks:');
    console.log(`   ${lockCount} seats currently locked (5-min checkout in progress)`);
    console.log('\n🚫 Maintenance Blocked Seats:');
    console.log(`   ${maintenanceCount} seats blocked for maintenance (testing block feature)`);
    console.log('\n💡 Test Scenarios:');
    console.log('   - Check real-time seat availability (some shows have limited seats)');
    console.log('   - Test booking with dynamic pricing (different seat categories)');
    console.log('   - View locked seats (in-progress checkouts expire in 5 mins)');
    console.log('   - Admin can force-cancel any booking');
    console.log('   - Admin can release locked seats');
    console.log('   - Admin can block seats for maintenance\n');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch(console.error);
