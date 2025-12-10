import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useBooking } from '../hooks/index';
import { Booking } from '../types/index';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, cancelBooking } = useBooking();
  
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Filter bookings for current user
  useEffect(() => {
    if (user) {
      const filtered = bookings.filter(b => b.user_id === user.id);
      setUserBookings(filtered);
      setLoading(false);
    }
  }, [bookings, user]);

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking? Seats will be refunded.')) {
      return;
    }

    setCanceling(bookingId);
    setError(null);

    try {
      await cancelBooking(bookingId);
      setSuccess('Booking cancelled successfully');
      
      // Remove from list
      setUserBookings(prev => prev.filter(b => b.id !== bookingId));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking');
      console.error('Cancellation error:', err);
    } finally {
      setCanceling(null);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}>Loading your bookings...</div>
      </div>
    );
  }

  const confirmedCount = userBookings.filter(b => b.status === 'CONFIRMED').length;
  const pendingCount = userBookings.filter(b => b.status === 'PENDING').length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Bookings</h1>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/')}
        >
          ← Back to Shows
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{confirmedCount}</div>
          <div style={styles.statLabel}>Confirmed</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{pendingCount}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{userBookings.length}</div>
          <div style={styles.statLabel}>Total Bookings</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ ...styles.alert, backgroundColor: '#fee', color: '#c33' }}>
          ❌ {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{ ...styles.alert, backgroundColor: '#efe', color: '#2e7d32' }}>
          ✅ {success}
        </div>
      )}

      {/* Bookings List */}
      {userBookings.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <h2>No bookings yet</h2>
          <p>You haven't made any bookings. Browse shows and book tickets to get started!</p>
          <button 
            style={styles.primaryButton}
            onClick={() => navigate('/')}
          >
            Browse Shows
          </button>
        </div>
      ) : (
        <div style={styles.bookingsList}>
          {userBookings.map(booking => (
            <div key={booking.id} style={styles.bookingCard}>
              {/* Status Badge */}
              <div 
                style={{
                  ...styles.statusBadge,
                  backgroundColor: booking.status === 'CONFIRMED' ? '#4CAF50' : '#ff9800',
                  color: 'white'
                }}
              >
                {booking.status === 'CONFIRMED' && '✓'} {booking.status}
              </div>

              {/* Booking Details */}
              <div style={styles.bookingContent}>
                <div style={styles.bookingHeader}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Booking #{booking.id}</h3>
                  <span style={styles.bookingDate}>
                    {new Date(booking.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div style={styles.bookingGrid}>
                  <div style={styles.bookingField}>
                    <span style={styles.label}>Seats Booked</span>
                    <span style={styles.value}>{booking.seats_booked}</span>
                  </div>
                  <div style={styles.bookingField}>
                    <span style={styles.label}>Show ID</span>
                    <span style={styles.value}>{booking.show_id}</span>
                  </div>
                  <div style={styles.bookingField}>
                    <span style={styles.label}>Total Price</span>
                    <span style={styles.value}>₹{booking.seats_booked * 150}</span>
                  </div>
                  <div style={styles.bookingField}>
                    <span style={styles.label}>Status</span>
                    <span style={{
                      ...styles.value,
                      color: booking.status === 'CONFIRMED' ? '#4CAF50' : '#ff9800',
                      fontWeight: 'bold'
                    }}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Status-specific Info */}
                {booking.status === 'PENDING' && (
                  <div style={styles.warningBox}>
                    <strong>⏱️ Note:</strong> This booking is pending and will expire in 2 minutes if not confirmed.
                  </div>
                )}

                {booking.status === 'CONFIRMED' && (
                  <div style={styles.successBox}>
                    <strong>✓ Confirmed</strong> - Your booking is confirmed. Show your booking ID at the venue.
                  </div>
                )}

                {booking.status === 'CANCELLED' && (
                  <div style={styles.cancelledBox}>
                    <strong>✗ Cancelled</strong> - Seats have been refunded.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={styles.bookingActions}>
                {booking.status === 'CONFIRMED' && (
                  <button
                    style={styles.cancelButton}
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={canceling === booking.id}
                  >
                    {canceling === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
                {booking.status === 'PENDING' && (
                  <span style={styles.pendingButton}>Pending</span>
                )}
                {booking.status === 'CANCELLED' && (
                  <span style={styles.cancelledButton}>Cancelled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div style={styles.infoSection}>
        <h3>❓ Booking Information</h3>
        <ul>
          <li><strong>Confirmed Bookings:</strong> Your seats are reserved and guaranteed.</li>
          <li><strong>Pending Bookings:</strong> Must be confirmed within 2 minutes or seats are released.</li>
          <li><strong>Cancellation:</strong> You can cancel confirmed bookings anytime. Refunds are automatic.</li>
          <li><strong>Seat Price:</strong> Each seat costs ₹150.</li>
          <li><strong>Show ID:</strong> Use this to view details about your booked show.</li>
        </ul>
      </div>

      {/* Download Section */}
      {confirmedCount > 0 && (
        <div style={styles.downloadSection}>
          <h3>🎟️ Your Tickets</h3>
          <p>Confirmed bookings: {confirmedCount}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Show your booking ID and tickets at the venue for entry.
          </p>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  title: {
    margin: 0,
    fontSize: '32px',
    color: '#333'
  },
  backButton: {
    padding: '10px 16px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease'
  },
  spinner: {
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '18px',
    color: '#666'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: '5px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666'
  },
  alert: {
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  bookingsList: {
    display: 'grid',
    gap: '15px',
    marginBottom: '30px'
  },
  bookingCard: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '20px',
    alignItems: 'start',
    position: 'relative'
  },
  statusBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  bookingContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px'
  },
  bookingDate: {
    fontSize: '13px',
    color: '#999'
  },
  bookingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '15px'
  },
  bookingField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '12px',
    color: '#999',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  value: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '500'
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#856404'
  },
  successBox: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#155724'
  },
  cancelledBox: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#721c24'
  },
  bookingActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  pendingButton: {
    padding: '8px 16px',
    backgroundColor: '#ff9800',
    color: 'white',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'inline-block'
  },
  cancelledButton: {
    padding: '8px 16px',
    backgroundColor: '#ddd',
    color: '#666',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'inline-block'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '30px'
  },
  emptyIcon: {
    fontSize: '60px',
    marginBottom: '20px'
  },
  primaryButton: {
    marginTop: '20px',
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  infoSection: {
    backgroundColor: '#f0f8ff',
    border: '1px solid #b3d9ff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  downloadSection: {
    backgroundColor: '#e8f5e9',
    border: '1px solid #81c784',
    borderRadius: '8px',
    padding: '20px'
  }
};
