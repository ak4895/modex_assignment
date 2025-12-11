import React, { useState, useEffect } from 'react';
import { useShows } from '../hooks/index';
import apiService from '../services/apiService';
import { showToast } from '../components/Toast';
import { Show } from '../types/index';

interface SeatInfo {
  show: any;
  bookedSeats: any[];
  lockedSeats: any[];
  maintenanceSeats: number[];
  availableSeats: number;
  occupancyRate: string;
}

interface OccupancyData {
  id: number;
  name: string;
  total_seats: number;
  available_seats: number;
  booked_seats: number;
  occupancy_percent: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  total_seats_sold: number;
  revenue: number;
}

export const AdminPage: React.FC = () => {
  const { shows, fetchShows } = useShows();
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    total_seats: '',
    show_type: 'movie',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Seat management state
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [seatInfo, setSeatInfo] = useState<SeatInfo | null>(null);
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);
  const [loadingSeatInfo, setLoadingSeatInfo] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  useEffect(() => {
    if (activeTab === 'manage' && selectedShow) {
      fetchSeatInfo(selectedShow.id);
    }
  }, [activeTab, selectedShow]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.start_time || !formData.total_seats) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/shows`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            start_time: new Date(formData.start_time).toISOString(),
            total_seats: parseInt(formData.total_seats),
            show_type: formData.show_type,
          }),
        }
      );

      if (response.ok) {
        showToast('✓ Show created successfully!', 'success');
        setFormData({
          name: '',
          start_time: '',
          total_seats: '',
          show_type: 'movie',
        });
        await fetchShows();
      } else {
        const data = await response.json();
        showToast(`❌ ${data.error || 'Failed to create show'}`, 'error');
      }
    } catch (err: any) {
      showToast(`❌ ${err.message || 'Error creating show'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeatInfo = async (showId: number) => {
    try {
      setLoadingSeatInfo(true);
      const [seatRes, occupancyRes] = await Promise.all([
        apiService.getShowSeats(showId),
        apiService.getShowOccupancy(showId),
      ]);
      setSeatInfo(seatRes as any);
      setOccupancyData(occupancyRes as any);
      setSelectedSeats([]);
    } catch (err) {
      showToast('❌ Failed to fetch seat information', 'error');
    } finally {
      setLoadingSeatInfo(false);
    }
  };

  const toggleSeat = (seatNumber: number) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const handleForceCancel = async (bookingId: number) => {
    const reason = prompt('Enter reason for force cancellation:');
    if (!reason) return;

    try {
      const response = await apiService.forceCancelBooking(bookingId, reason);
      showToast(`✓ ${response.message || 'Booking cancelled successfully'}`, 'success');
      if (selectedShow) {
        fetchSeatInfo(selectedShow.id);
      }
    } catch (err: any) {
      showToast('❌ Failed to force cancel booking', 'error');
    }
  };

  const handleReleaseSeats = async () => {
    if (!selectedShow || selectedSeats.length === 0) {
      showToast('⚠ Please select seats to release', 'warning');
      return;
    }

    try {
      const response = await apiService.releaseSeats(selectedShow.id, selectedSeats, 'Released by admin');
      showToast(`✓ ${response.message || 'Seats released successfully'}`, 'success');
      setSelectedSeats([]);
      if (selectedShow) {
        fetchSeatInfo(selectedShow.id);
      }
    } catch (err: any) {
      showToast('❌ Failed to release seats', 'error');
    }
  };

  const handleBlockSeats = async () => {
    if (!selectedShow || selectedSeats.length === 0) {
      showToast('⚠ Please select seats to block', 'warning');
      return;
    }

    try {
      const response = await apiService.blockSeats(selectedShow.id, selectedSeats);
      showToast(`✓ ${response.message || 'Seats blocked successfully'}`, 'success');
      setSelectedSeats([]);
      if (selectedShow) {
        fetchSeatInfo(selectedShow.id);
      }
    } catch (err: any) {
      showToast('❌ Failed to block seats', 'error');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🛠️ Admin Dashboard</h1>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            ...{ backgroundColor: activeTab === 'create' ? '#007bff' : '#f0f0f0', color: activeTab === 'create' ? 'white' : '#333' },
          }}
          onClick={() => setActiveTab('create')}
        >
          ✏️ Create Show
        </button>
        <button
          style={{
            ...styles.tab,
            ...{ backgroundColor: activeTab === 'manage' ? '#007bff' : '#f0f0f0', color: activeTab === 'manage' ? 'white' : '#333' },
          }}
          onClick={() => setActiveTab('manage')}
        >
          🪑 Manage Seats
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'create' ? (
          /* Create Show Section */
          <div style={styles.formSection}>
            <h2>Create New Show</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              {error && <div style={styles.error}>{error}</div>}
              {message && <div style={styles.success}>{message}</div>}

              <div style={styles.formGroup}>
                <label>Show Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter show name"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Total Seats</label>
                <input
                  type="number"
                  name="total_seats"
                  value={formData.total_seats}
                  onChange={handleInputChange}
                  placeholder="Enter total seats"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Show Type</label>
                <select
                  name="show_type"
                  value={formData.show_type}
                  onChange={handleInputChange}
                  style={styles.input}
                >
                  <option value="movie">Movie</option>
                  <option value="concert">Concert</option>
                  <option value="sports">Sports</option>
                  <option value="theater">Theater</option>
                </select>
              </div>

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Creating...' : 'Create Show'}
              </button>
            </form>
          </div>
        ) : (
          /* Seat Management Section */
          <div style={{...styles.formSection, maxWidth: '100%'}}>
            <h2>Manage Seats & Occupancy</h2>

            <div style={styles.showSelector}>
              <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block'}}>Select Show:</label>
              <select
                value={selectedShow?.id || ''}
                onChange={(e) => {
                  const show = shows.find((s) => s.id === parseInt(e.target.value));
                  setSelectedShow(show || null);
                }}
                style={styles.input}
              >
                <option value="">-- Select a show --</option>
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.name} - {new Date(show.start_time).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedShow && occupancyData && (
              <>
                {/* Occupancy Info */}
                <div style={styles.occupancyCard}>
                  <h3>📊 Occupancy Details</h3>
                  <div style={styles.occupancyGrid}>
                    <div style={styles.occupancyItem}>
                      <span>Total Seats:</span>
                      <strong>{occupancyData.total_seats}</strong>
                    </div>
                    <div style={styles.occupancyItem}>
                      <span>Booked Seats:</span>
                      <strong>{occupancyData.booked_seats}</strong>
                    </div>
                    <div style={styles.occupancyItem}>
                      <span>Available Seats:</span>
                      <strong>{occupancyData.available_seats}</strong>
                    </div>
                    <div style={styles.occupancyItem}>
                      <span>Occupancy Rate:</span>
                      <strong style={{
                        color: occupancyData.occupancy_percent > 75 ? '#f44336' : occupancyData.occupancy_percent > 50 ? '#ff9800' : '#4CAF50'
                      }}>
                        {occupancyData.occupancy_percent}%
                      </strong>
                    </div>
                    <div style={styles.occupancyItem}>
                      <span>Revenue:</span>
                      <strong>₹{occupancyData.revenue?.toLocaleString() || 0}</strong>
                    </div>
                    <div style={styles.occupancyItem}>
                      <span>Confirmed Bookings:</span>
                      <strong>{occupancyData.confirmed_bookings}</strong>
                    </div>
                  </div>
                </div>

                {loadingSeatInfo ? (
                  <div style={styles.loading}>Loading seat information...</div>
                ) : seatInfo ? (
                  <>
                    {/* Booked Seats */}
                    {seatInfo.bookedSeats.length > 0 && (
                      <div style={styles.seatsSection}>
                        <h3>✓ Confirmed Bookings ({seatInfo.bookedSeats.length})</h3>
                        <div style={styles.seatsList}>
                          {seatInfo.bookedSeats.slice(0, 5).map((seat) => (
                            <div key={seat.booking_id} style={styles.seatItem}>
                              <span>Seat {seat.seat_number} - User: {seat.email}</span>
                              <button
                                onClick={() => handleForceCancel(seat.booking_id)}
                                style={styles.forceCancelButton}
                              >
                                Force Cancel
                              </button>
                            </div>
                          ))}
                          {seatInfo.bookedSeats.length > 5 && (
                            <p style={{textAlign: 'center', color: '#999'}}>+{seatInfo.bookedSeats.length - 5} more bookings</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Locked Seats */}
                    {seatInfo.lockedSeats.length > 0 && (
                      <div style={styles.seatsSection}>
                        <h3>🔒 Locked (Pending) Seats ({seatInfo.lockedSeats.length})</h3>
                        <div style={styles.seatsList}>
                          {seatInfo.lockedSeats.map((seat) => (
                            <div key={seat.booking_id} style={{...styles.seatItem, backgroundColor: '#fff3cd'}}>
                              <span>Seat {seat.seat_number} - User: {seat.email}</span>
                              <button
                                onClick={() => toggleSeat(seat.seat_number)}
                                style={{
                                  ...styles.releaseButton,
                                  backgroundColor: selectedSeats.includes(seat.seat_number) ? '#ff9800' : '#2196F3'
                                }}
                              >
                                {selectedSeats.includes(seat.seat_number) ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          ))}
                        </div>
                        {selectedSeats.length > 0 && (
                          <button
                            onClick={handleReleaseSeats}
                            style={styles.primaryButton}
                          >
                            Release {selectedSeats.length} Seat(s)
                          </button>
                        )}
                      </div>
                    )}

                    {/* Block Seats Section */}
                    <div style={styles.seatsSection}>
                      <h3>🚫 Block Seats for Maintenance</h3>
                      <div style={styles.blockSection}>
                        <div style={styles.seatGrid}>
                          {Array.from({ length: seatInfo.show.total_seats }, (_, i) => i + 1).map((seatNum) => {
                            const isBooked = seatInfo.bookedSeats.some((s) => s.seat_number === seatNum);
                            const isLocked = seatInfo.lockedSeats.some((s) => s.seat_number === seatNum);
                            const isBlocked = seatInfo.maintenanceSeats.includes(seatNum);
                            const isSelected = selectedSeats.includes(seatNum);

                            return (
                              <button
                                key={seatNum}
                                onClick={() => !isBooked && !isLocked && toggleSeat(seatNum)}
                                disabled={isBooked || isLocked}
                                style={{
                                  ...styles.seatButton,
                                  backgroundColor: isBooked
                                    ? '#f44336'
                                    : isLocked
                                    ? '#ff9800'
                                    : isBlocked
                                    ? '#9C27B0'
                                    : isSelected
                                    ? '#4CAF50'
                                    : '#e0e0e0',
                                  cursor: isBooked || isLocked ? 'not-allowed' : 'pointer',
                                  opacity: isBooked || isLocked ? 0.6 : 1,
                                }}
                              >
                                {seatNum}
                              </button>
                            );
                          })}
                        </div>
                        {selectedSeats.length > 0 && (
                          <button
                            onClick={handleBlockSeats}
                            style={{...styles.primaryButton, marginTop: '20px'}}
                          >
                            Block {selectedSeats.length} Seat(s) for Maintenance
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={styles.legend}>
                      <h4>Legend:</h4>
                      <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                        <div><span style={{...styles.legendBox, backgroundColor: '#f44336'}}></span> Booked</div>
                        <div><span style={{...styles.legendBox, backgroundColor: '#ff9800'}}></span> Locked (Pending)</div>
                        <div><span style={{...styles.legendBox, backgroundColor: '#9C27B0'}}></span> Maintenance</div>
                        <div><span style={{...styles.legendBox, backgroundColor: '#4CAF50'}}></span> Selected</div>
                        <div><span style={{...styles.legendBox, backgroundColor: '#e0e0e0'}}></span> Available</div>
                      </div>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '30px 20px',
    fontFamily: 'Arial, sans-serif',
  } as React.CSSProperties,
  title: {
    textAlign: 'center' as const,
    marginBottom: '30px',
    color: '#333',
    fontSize: '32px',
  } as React.CSSProperties,
  tabContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '2px solid #ddd',
  } as React.CSSProperties,
  tab: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  content: {
    marginTop: '30px',
  } as React.CSSProperties,
  formSection: {
    padding: '30px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  } as React.CSSProperties,
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  } as React.CSSProperties,
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
  } as React.CSSProperties,
  button: {
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  } as React.CSSProperties,
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  } as React.CSSProperties,
  showSelector: {
    marginBottom: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  } as React.CSSProperties,
  occupancyCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  occupancyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  } as React.CSSProperties,
  occupancyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    borderLeft: '4px solid #2196F3',
  } as React.CSSProperties,
  seatsSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  seatsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginTop: '15px',
    maxHeight: '250px',
    overflowY: 'auto' as const,
  } as React.CSSProperties,
  seatItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    borderLeft: '4px solid #28a745',
  } as React.CSSProperties,
  forceCancelButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  releaseButton: {
    padding: '6px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  blockSection: {
    marginTop: '15px',
  } as React.CSSProperties,
  seatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: '8px',
    marginTop: '15px',
  } as React.CSSProperties,
  seatButton: {
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '16px',
    color: '#666',
  } as React.CSSProperties,
  legend: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '4px',
    marginTop: '20px',
  } as React.CSSProperties,
  legendBox: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    borderRadius: '3px',
    marginRight: '8px',
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,
};
