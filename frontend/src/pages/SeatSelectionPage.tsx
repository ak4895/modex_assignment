import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/index';
import apiService from '../services/apiService';

interface Seat {
  seatNumber: number;
  rowLetter: string;
  columnNumber: number;
  status: 'available' | 'booked' | 'selected';
}

interface ShowDetails {
  id: number;
  name: string;
  start_time: string;
  available_seats: number;
  total_seats: number;
}

export const SeatSelectionPage: React.FC = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow] = useState<ShowDetails | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoverSeat, setHoverSeat] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchShowDetails();
  }, [showId, user]);

  // Disabled auto-refresh to avoid database timeouts
  // Refresh happens only on initial load and manual refresh
  // Users can refresh manually by clicking a button if needed
  useEffect(() => {
    // Polling disabled - comment out to enable
    // const refreshInterval = setInterval(() => {
    //   fetchShowDetails();
    // }, 60000); // 60 seconds if re-enabled

    // return () => clearInterval(refreshInterval);
  }, [showId]);

  const fetchShowDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch show details
      const showResponse = await apiService.getShowById(parseInt(showId!));
      if (!showResponse.success || !showResponse.data) {
        throw new Error(showResponse.error || 'Failed to fetch show details');
      }
      setShow(showResponse.data);
      
      // Fetch all bookings for this show
      const bookingsResponse = await apiService.getShowBookings(parseInt(showId!));
      if (!bookingsResponse.success) {
        throw new Error(bookingsResponse.error || 'Failed to fetch bookings');
      }
      
      const allBookings = bookingsResponse.data || [];
      const bookedSeatNumbers = new Set<number>();
      
      // Extract seat numbers from confirmed bookings
      for (const booking of allBookings) {
        if (booking.status === 'CONFIRMED' && booking.seats) {
          // If seats is an array of seat objects with seat_number property
          if (Array.isArray(booking.seats)) {
            booking.seats.forEach((seat: any) => {
              const seatNum = typeof seat === 'number' ? seat : seat.seat_number;
              if (seatNum) bookedSeatNumbers.add(seatNum);
            });
          }
        }
      }
      
      // Initialize seats grid
      const seatArray: Seat[] = [];
      const seatsPerRow = 10;
      const totalRows = Math.ceil(showResponse.data!.total_seats / seatsPerRow);
      
      for (let row = 0; row < totalRows; row++) {
        const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
        for (let col = 1; col <= seatsPerRow; col++) {
          const seatNum = row * seatsPerRow + col;
          if (seatNum <= showResponse.data!.total_seats) {
            seatArray.push({
              seatNumber: seatNum,
              rowLetter,
              columnNumber: col,
              status: bookedSeatNumbers.has(seatNum) ? 'booked' : 'available',
            });
          }
        }
      }
      setSeats(seatArray);
      setError('');
    } catch (err: any) {
      console.error('Error fetching show details:', err);
      setError(err.message || 'Failed to load seat availability');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatNumber: number) => {
    const seat = seats.find(s => s.seatNumber === seatNumber);
    if (!seat || seat.status === 'booked') return;

    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }
    
    localStorage.setItem('selectedSeats', JSON.stringify({
      showId,
      seats: selectedSeats.sort((a, b) => a - b),
      show,
    }));
    
    navigate('/payment');
  };

  const getSeatColor = (seatNum: number): string => {
    const isSelected = selectedSeats.includes(seatNum);
    const seat = seats.find(s => s.seatNumber === seatNum);
    
    if (isSelected) return '#ffc107'; // Yellow - selected
    if (seat?.status === 'booked') return '#e0e0e0'; // Gray - booked
    return '#28a745'; // Green - available
  };

  const formatSeatName = (seatNum: number): string => {
    const seat = seats.find(s => s.seatNumber === seatNum);
    if (seat) {
      return `${seat.rowLetter}${seat.columnNumber}`;
    }
    return seatNum.toString();
  };

  const occupancyRate = show ? ((show.total_seats - show.available_seats) / show.total_seats) * 100 : 0;
  const occupancyStatus = occupancyRate > 70 ? 'Almost Full 🔴' : occupancyRate > 40 ? 'Filling Up 🟡' : 'Available 🟢';

  if (!user) return null;

  return (
    <div style={styles.container}>
      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading seat layout...</p>
        </div>
      ) : show ? (
        <>
          {/* Show Details Header */}
          <div style={styles.header}>
            <button 
              style={styles.backButton}
              onClick={() => navigate('/')}
            >
              ← Back
            </button>
            <div style={styles.headerContent}>
              <h1>{show.name}</h1>
              <p style={styles.showTime}>
                📅 {new Date(show.start_time).toLocaleDateString()} | ⏰ {new Date(show.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
              <p style={{...styles.showInfo, color: occupancyRate > 70 ? '#dc3545' : occupancyRate > 40 ? '#ffc107' : '#28a745'}}>
                {occupancyStatus} ({show.available_seats}/{show.total_seats} seats available)
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div style={styles.content}>
            {/* Seat Grid */}
            <div style={styles.seatSection}>
              {/* Legend */}
              <div style={styles.legend}>
                <div style={{...styles.legendItem}}>
                  <div style={{...styles.legendSeat, backgroundColor: '#28a745'}}></div>
                  <span>Available ({show.available_seats})</span>
                </div>
                <div style={{...styles.legendItem}}>
                  <div style={{...styles.legendSeat, backgroundColor: '#ffc107'}}></div>
                  <span>Selected ({selectedSeats.length})</span>
                </div>
                <div style={{...styles.legendItem}}>
                  <div style={{...styles.legendSeat, backgroundColor: '#e0e0e0'}}></div>
                  <span>Booked ({show.total_seats - show.available_seats})</span>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div style={styles.occupancyBar}>
                <div style={{...styles.occupancyFill, width: `${occupancyRate}%`}}></div>
              </div>

              <div style={styles.screen}>🎬 SCREEN 🎬</div>

              {/* Seat Grid */}
              <div style={styles.seatGrid}>
                {Array.from({ length: Math.ceil(show.total_seats / 10) }).map((_, rowIdx) => (
                  <div key={rowIdx} style={styles.seatRow}>
                    <div style={styles.rowLabel}>
                      {String.fromCharCode(65 + rowIdx)}
                    </div>
                    {Array.from({ length: 10 }).map((_, colIdx) => {
                      const seatNumber = rowIdx * 10 + colIdx + 1;
                      if (seatNumber > show.total_seats) return null;

                      const seat = seats.find(s => s.seatNumber === seatNumber);
                      if (!seat) return null;

                      const isSelected = selectedSeats.includes(seatNumber);
                      const isHovered = hoverSeat === seatNumber;
                      const color = getSeatColor(seatNumber);
                      const isDisabled = seat.status === 'booked';

                      return (
                        <button
                          key={seatNumber}
                          style={{
                            ...styles.seat,
                            backgroundColor: color,
                            opacity: isDisabled ? 0.5 : 1,
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            border: isSelected ? '3px solid #333' : '2px solid #ccc',
                            transform: isHovered && !isDisabled ? 'scale(1.15)' : 'scale(1)',
                            boxShadow: isSelected ? '0 0 10px rgba(255, 193, 7, 0.8)' : 'none',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                          }}
                          onClick={() => toggleSeat(seatNumber)}
                          onMouseEnter={() => setHoverSeat(seatNumber)}
                          onMouseLeave={() => setHoverSeat(null)}
                          disabled={isDisabled}
                          title={`Seat ${String.fromCharCode(65 + rowIdx)}${colIdx + 1}`}
                        >
                          {String.fromCharCode(65 + rowIdx)}{colIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Accessibility Info */}
              <div style={styles.accessibilityInfo}>
                <p>♿ Accessible seats available in rows A-B</p>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div style={styles.sidebar}>
              <div style={styles.summaryBox}>
                <h3 style={{marginTop: 0}}>💳 Order Summary</h3>
                
                <div style={styles.divider}></div>
                
                <div style={styles.summaryItem}>
                  <span>Selected Seats:</span>
                  <strong style={{color: '#667eea', fontSize: '1rem'}}>
                    {selectedSeats.length > 0 ? selectedSeats.sort((a, b) => a - b).map(s => formatSeatName(s)).join(', ') : 'None'}
                  </strong>
                </div>

                <div style={styles.summaryItem}>
                  <span>No. of Seats:</span>
                  <strong>{selectedSeats.length}</strong>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.priceBreakdown}>
                  <div style={styles.priceRow}>
                    <span>Price/Seat:</span>
                    <span>₹299</span>
                  </div>
                  <div style={styles.priceRow}>
                    <span>Subtotal:</span>
                    <span>₹{selectedSeats.length * 299}</span>
                  </div>
                  <div style={styles.priceRow}>
                    <span>Convenience:</span>
                    <span>₹{selectedSeats.length * 50}</span>
                  </div>
                  <div style={styles.divider}></div>
                  <div style={{...styles.priceRow, fontWeight: 'bold', fontSize: '1.1rem', color: '#28a745'}}>
                    <span>Total:</span>
                    <span>₹{selectedSeats.length * 349}</span>
                  </div>
                </div>

                <button
                  style={{
                    ...styles.proceedButton,
                    opacity: selectedSeats.length > 0 ? 1 : 0.5,
                  }}
                  onClick={handleProceedToPayment}
                  disabled={selectedSeats.length === 0}
                >
                  {selectedSeats.length > 0 ? `Proceed to Payment (₹${selectedSeats.length * 349})` : 'Select Seats'}
                </button>

                <p style={styles.disclaimer}>
                  ✓ Secure & Fast Checkout
                </p>

                <div style={styles.offers}>
                  <p style={{fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px'}}>🎁 Special Offers:</p>
                  <p style={{fontSize: '0.8rem', margin: '0'}}>Buy 1 get 1 @ 50% off</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #eee',
  } as React.CSSProperties,
  headerContent: {
    flex: 1,
  } as React.CSSProperties,
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    marginTop: '5px',
  } as React.CSSProperties,
  showTime: {
    color: '#666',
    marginTop: '5px',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  showInfo: {
    marginTop: '8px',
    fontSize: '0.95rem',
    fontWeight: '500',
  } as React.CSSProperties,
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '30px',
  } as React.CSSProperties,
  seatSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  } as React.CSSProperties,
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '50px',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #f0f0f0',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.95rem',
  } as React.CSSProperties,
  legendSeat: {
    width: '24px',
    height: '24px',
    borderRadius: '3px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  occupancyBar: {
    height: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '25px',
  } as React.CSSProperties,
  occupancyFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #28a745 0%, #ffc107 70%, #dc3545 100%)',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  screen: {
    textAlign: 'center' as const,
    fontSize: '1.3rem',
    fontWeight: 'bold',
    marginBottom: '40px',
    color: '#999',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  } as React.CSSProperties,
  seatGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    marginBottom: '20px',
  } as React.CSSProperties,
  seatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center',
  } as React.CSSProperties,
  rowLabel: {
    width: '30px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    color: '#333',
    fontSize: '0.95rem',
  } as React.CSSProperties,
  seat: {
    width: '38px',
    height: '38px',
    border: '2px solid',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  accessibilityInfo: {
    backgroundColor: '#e3f2fd',
    padding: '12px 15px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    color: '#1565c0',
    marginTop: '20px',
  } as React.CSSProperties,
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
  } as React.CSSProperties,
  summaryBox: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    position: 'sticky' as const,
    top: '20px',
  } as React.CSSProperties,
  divider: {
    height: '1px',
    backgroundColor: '#f0f0f0',
    margin: '12px 0',
  } as React.CSSProperties,
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '0.95rem',
  } as React.CSSProperties,
  priceBreakdown: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginY: '20px',
  } as React.CSSProperties,
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  proceedButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  disclaimer: {
    fontSize: '0.75rem',
    color: '#999',
    textAlign: 'center' as const,
    marginTop: '12px',
  } as React.CSSProperties,
  offers: {
    backgroundColor: '#fff3cd',
    padding: '12px',
    borderRadius: '6px',
    marginTop: '15px',
    borderLeft: '4px solid #ffc107',
  } as React.CSSProperties,
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  } as React.CSSProperties,
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  } as React.CSSProperties,
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
};
