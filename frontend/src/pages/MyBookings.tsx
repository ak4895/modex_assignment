import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/index';
import { Booking } from '../types/index';
import apiService from '../services/apiService';
import { showToast } from '../components/Toast';

interface BookingWithShow extends Booking {
  show_name?: string;
  show_time?: string;
  seats?: number[];
  qr_code?: string;
}

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [userBookings, setUserBookings] = useState<BookingWithShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch user bookings with show details on mount
  useEffect(() => {
    if (user) {
      fetchUserBookings();
    }
  }, [user]);

  // Disabled auto-refresh to avoid database timeouts
  // Refresh happens only on initial load and manual actions
  useEffect(() => {
    // Polling disabled - comment out to enable
    // const refreshInterval = setInterval(() => {
    //   fetchUserBookings();
    // }, 60000); // 60 seconds if re-enabled

    // return () => clearInterval(refreshInterval);
  }, [user]);

  const fetchUserBookings = async () => {
    try {
      const response = await apiService.getUserBookings(user?.id || 0);
      const bookingsData = response.data || [];
      
      // Fetch show details for each booking
      const bookingsWithDetails = await Promise.all(
        bookingsData.map(async (booking: Booking) => {
          try {
            const showResponse = await apiService.getShowById(booking.show_id);
            const detailedResponse = await apiService.getBooking(booking.id);
            return {
              ...booking,
              show_name: showResponse.data?.name || 'Unknown Show',
              show_time: showResponse.data?.start_time || '',
              seats: detailedResponse.data?.seats || [],
              qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BOOKING_${booking.id}_SHOW_${booking.show_id}`,
            };
          } catch (err) {
            return booking;
          }
        })
      );

      setUserBookings(bookingsWithDetails);
    } catch (err: any) {
      setError('Failed to load bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: number) => {
    const refundAmount = userBookings.find(b => b.id === bookingId)?.seats_booked || 0;
    const refund = refundAmount * 349;
    
    if (!confirm(`Are you sure you want to cancel this booking?\n\nRefund Amount: ₹${refund}`)) {
      return;
    }

    setCanceling(bookingId);
    setError(null);

    try {
      await apiService.delete(`/bookings/${bookingId}`);
      showToast(`✓ Booking cancelled! Refund of ₹${refund} will be processed within 5-7 business days.`, 'success');
      
      // Update booking status to cancelled
      setUserBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
      ));

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to cancel booking';
      setError(errorMsg);
      showToast(`❌ ${errorMsg}`, 'error');
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
  const cancelledCount = userBookings.filter(b => b.status === 'CANCELLED').length;


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
          <h1 style={styles.title}>📋 My Bookings</h1>
          <span style={styles.liveIndicator}>🔴 Live • Updates every 3s</span>
        </div>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/')}
        >
          ← Back to Shows
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsContainer}>
        <div style={{...styles.statCard, borderLeft: '4px solid #4CAF50'}}>
          <div style={styles.statNumber}>{confirmedCount}</div>
          <div style={styles.statLabel}>Confirmed</div>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #ff9800'}}>
          <div style={styles.statNumber}>{pendingCount}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #dc3545'}}>
          <div style={styles.statNumber}>{cancelledCount}</div>
          <div style={styles.statLabel}>Cancelled</div>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #667eea'}}>
          <div style={styles.statNumber}>{userBookings.length}</div>
          <div style={styles.statLabel}>Total</div>
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
          <div style={styles.emptyIcon}>🎬</div>
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
                  backgroundColor: 
                    booking.status === 'CONFIRMED' ? '#4CAF50' : 
                    booking.status === 'CANCELLED' ? '#dc3545' :
                    '#ff9800',
                  color: 'white'
                }}
              >
                {booking.status === 'CONFIRMED' && '✓ CONFIRMED'}
                {booking.status === 'PENDING' && '⏱️ PENDING'}
                {booking.status === 'CANCELLED' && '✗ CANCELLED'}
              </div>

              {/* Booking Details */}
              <div style={styles.bookingContent}>
                <div style={styles.bookingHeader}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                    🎟️ {booking.show_name || `Booking #${booking.id}`}
                  </h3>
                  <span style={styles.bookingDate}>
                    {booking.show_time ? new Date(booking.show_time).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div style={styles.bookingGrid}>
                  <div style={styles.bookingField}>
                    <span style={styles.label}>Booking ID</span>
                    <span style={styles.value}>#{booking.id}</span>
                  </div>
                  <div style={styles.bookingField}>
                    <span style={styles.label}>Seats</span>
                    <span style={styles.value}>{booking.seats?.length || booking.seats_booked}</span>
                  </div>
                  <div style={styles.bookingField}>
                    <span style={styles.label}>Show Time</span>
                    <span style={styles.value}>
                      {booking.show_time ? new Date(booking.show_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.bookingField}>
                    <span style={styles.label}>Amount</span>
                    <span style={{...styles.value, color: '#28a745', fontWeight: 'bold'}}>₹{booking.seats_booked * 349}</span>
                  </div>
                </div>

                {booking.seats && booking.seats.length > 0 && (
                  <div style={styles.seatsList}>
                    <strong>Seats:</strong> {booking.seats.join(', ')}
                  </div>
                )}

                {/* Expandable Ticket Section */}
                {booking.status === 'CONFIRMED' && (
                  <div>
                    <button
                      onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                      style={styles.expandButton}
                    >
                      {expandedBooking === booking.id ? '▼ Hide Ticket' : '▶ View Ticket'}
                    </button>

                    {expandedBooking === booking.id && booking.qr_code && (
                      <div style={styles.ticketPreview}>
                        <div style={styles.ticketInfo}>
                          <p><strong>Booking ID:</strong> #{booking.id}</p>
                          <p><strong>Movie:</strong> {booking.show_name}</p>
                          <p><strong>Date:</strong> {booking.show_time ? new Date(booking.show_time).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <img src={booking.qr_code} alt="QR Code" style={styles.qrCodeSmall} />
                      </div>
                    )}
                  </div>
                )}

                {/* Status Messages */}
                {booking.status === 'PENDING' && (
                  <div style={styles.warningBox}>
                    ⏱️ <strong>Pending:</strong> This booking will expire in 2 minutes if not confirmed.
                  </div>
                )}

                {booking.status === 'CANCELLED' && (
                  <div style={styles.cancelledBox}>
                    ✗ <strong>Cancelled:</strong> Refund of ₹{booking.seats_booked * 349} will be processed within 5-7 business days.
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
  liveIndicator: {
    fontSize: '14px',
    color: '#dc3545',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    animation: 'pulse 1.5s infinite'
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
  },
  expandButton: {
    marginTop: '12px',
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  },
  ticketPreview: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    border: '2px solid #667eea',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  ticketInfo: {
    flex: 1,
  },
  qrCodeSmall: {
    width: '120px',
    height: '120px',
    border: '2px solid #667eea',
    borderRadius: '6px',
    padding: '3px',
  },
  seatsList: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f0f0f0',
    borderRadius: '6px',
    fontSize: '0.9rem',
  }
};
