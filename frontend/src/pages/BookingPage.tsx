import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useShows, useBooking, usePollingSeats } from '../hooks/index';
import { Show } from '../types/index';

export const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shows } = useShows();
  const { bookSeats, currentBooking } = useBooking();
  
  const [show, setShow] = useState<Show | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableSeats, setAvailableSeats] = useState<number[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch show details
  useEffect(() => {
    const foundShow = shows.find(s => s.id === parseInt(id || '0'));
    if (foundShow) {
      setShow(foundShow);
      setLoading(false);
    } else if (shows.length > 0 && id) {
      // Show not found
      setError('Show not found');
      setLoading(false);
    }
  }, [shows, id]);

  // Use polling hook to get real-time seat availability
  const { availableSeats: polledSeats } = usePollingSeats(show?.id ?? null);
  
  useEffect(() => {
    if (polledSeats && polledSeats.length > 0) {
      setAvailableSeats(polledSeats);
    } else if (show) {
      // Fallback: generate seat array based on total_seats
      const seats: number[] = [];
      for (let i = 1; i <= show.total_seats; i++) {
        seats.push(i);
      }
      setAvailableSeats(seats);
    }
  }, [polledSeats, show]);

  // Handle seat selection
  const handleSeatClick = (seatNumber: number) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        // Deselect seat
        return prev.filter(s => s !== seatNumber);
      } else {
        // Select seat (max 10 at a time for UX)
        if (prev.length < 10) {
          return [...prev, seatNumber];
        } else {
          setError('Maximum 10 seats allowed per booking');
          return prev;
        }
      }
    });
    setError(null);
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    if (!show || !user) {
      setError('Invalid show or user');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await bookSeats(show.id, selectedSeats.length);

      setSuccess(`Successfully booked ${selectedSeats.length} seat(s)!`);
      setSelectedSeats([]);

      // Redirect to bookings after 2 seconds
      setTimeout(() => {
        navigate('/my-bookings');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Booking failed. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}>Loading...</div>
      </div>
    );
  }

  if (!show || error === 'Show not found') {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.alert, backgroundColor: '#fee' }}>
          ❌ Show not found
        </div>
        <button 
          style={styles.button}
          onClick={() => navigate('/')}
        >
          Back to Shows
        </button>
      </div>
    );
  }

  const bookedSeats = Array.from(
    { length: show.total_seats },
    (_, i) => i + 1
  ).filter(seat => !availableSeats.includes(seat));

  const totalColumns = Math.ceil(Math.sqrt(show.total_seats));
  const seatGridColumns = totalColumns;

  return (
    <div style={styles.container}>
      <button 
        style={styles.backButton}
        onClick={() => navigate('/')}
      >
        ← Back to Shows
      </button>

      {/* Show Info */}
      <div style={styles.showInfo}>
        <h1 style={styles.showTitle}>{show.name}</h1>
        <div style={styles.showDetails}>
          <p><strong>Date:</strong> {new Date(show.start_time).toLocaleString()}</p>
          <p><strong>Seats Available:</strong> {availableSeats.length} / {show.total_seats}</p>
          <p><strong>Type:</strong> {show.show_type.charAt(0).toUpperCase() + show.show_type.slice(1)}</p>
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.seatLegend, backgroundColor: '#ddd' }}></div>
          <span>Available</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.seatLegend, backgroundColor: '#999' }}></div>
          <span>Booked</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.seatLegend, backgroundColor: '#4CAF50' }}></div>
          <span>Selected</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div style={styles.seatGridContainer}>
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${seatGridColumns}, 40px)`,
            gap: '8px',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {Array.from({ length: show.total_seats }, (_, i) => i + 1).map(seatNumber => {
            const isBooked = bookedSeats.includes(seatNumber);
            const isSelected = selectedSeats.includes(seatNumber);

            return (
              <button
                key={seatNumber}
                onClick={() => !isBooked && handleSeatClick(seatNumber)}
                disabled={isBooked}
                style={{
                  ...styles.seat,
                  backgroundColor: isSelected 
                    ? '#4CAF50' 
                    : isBooked 
                    ? '#999' 
                    : '#ddd',
                  color: isSelected ? 'white' : '#333',
                  cursor: isBooked ? 'not-allowed' : 'pointer',
                  opacity: isBooked ? 0.6 : 1,
                  border: isSelected ? '2px solid #2e7d32' : '1px solid #999',
                  fontWeight: isSelected ? 'bold' : 'normal'
                }}
                title={isBooked ? 'Seat booked' : `Seat ${seatNumber}`}
              >
                {seatNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div style={styles.selectedSeatsBox}>
          <h3 style={{ margin: '0 0 10px 0' }}>Selected Seats ({selectedSeats.length})</h3>
          <p style={{ margin: '5px 0' }}>
            {selectedSeats.sort((a, b) => a - b).join(', ')}
          </p>
          <p style={{ margin: '10px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>
            Total: ₹{selectedSeats.length * 150} (₹150 per seat)
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ ...styles.alert, backgroundColor: '#fee', color: '#c33' }}>
          ❌ {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{ ...styles.alert, backgroundColor: '#efe', color: '#333' }}>
          ✅ {success}
        </div>
      )}

      {/* Booking Status */}
      {currentBooking && (
        <div style={styles.bookingStatusBox}>
          <h3 style={{ margin: '0 0 10px 0' }}>Booking Status</h3>
          <p><strong>Status:</strong> {currentBooking.status}</p>
          <p><strong>Seats Booked:</strong> {currentBooking.seats_booked}</p>
          <p><strong>Booked At:</strong> {new Date(currentBooking.created_at).toLocaleString()}</p>
          {currentBooking.status === 'PENDING' && (
            <p style={{ fontSize: '12px', color: '#ff6b00', marginTop: '10px' }}>
              ⏱️ Booking expires in 2 minutes if not confirmed
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={styles.actionButtons}>
        <button
          style={{ ...styles.button, opacity: selectedSeats.length === 0 ? 0.6 : 1 }}
          onClick={handleBooking}
          disabled={selectedSeats.length === 0 || submitting}
        >
          {submitting ? 'Processing...' : `Book ${selectedSeats.length} Seat(s)`}
        </button>
        <button
          style={{ ...styles.button, backgroundColor: '#666' }}
          onClick={() => {
            setSelectedSeats([]);
            setError(null);
          }}
          disabled={submitting}
        >
          Clear Selection
        </button>
      </div>

      {/* Availability Info */}
      <div style={styles.infoBox}>
        <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ Important Info</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
          <li>Select seats by clicking on them</li>
          <li>You can select up to 10 seats per booking</li>
          <li>Each seat costs ₹150</li>
          <li>Bookings are confirmed immediately</li>
          <li>Pending bookings expire after 2 minutes</li>
          <li>Seat availability updates automatically every 5 seconds</li>
        </ul>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  backButton: {
    marginBottom: '20px',
    padding: '10px 16px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
  },
  showInfo: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  showTitle: {
    margin: '0 0 10px 0',
    fontSize: '28px',
    color: '#333'
  },
  showDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    fontSize: '14px',
    color: '#666'
  },
  legend: {
    display: 'flex',
    gap: '30px',
    justifyContent: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  seatLegend: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '1px solid #999'
  },
  seatGridContainer: {
    backgroundColor: '#fff',
    border: '2px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    overflowX: 'auto'
  },
  seat: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  selectedSeatsBox: {
    backgroundColor: '#e8f5e9',
    border: '2px solid #4CAF50',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    color: '#2e7d32'
  },
  alert: {
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: '500'
  },
  bookingStatusBox: {
    backgroundColor: '#e3f2fd',
    border: '2px solid #2196F3',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    color: '#1565c0',
    fontSize: '14px'
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  button: {
    flex: 1,
    padding: '12px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    padding: '15px',
    fontSize: '13px',
    color: '#856404'
  }
};
