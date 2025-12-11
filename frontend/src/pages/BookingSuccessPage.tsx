import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { showToast } from '../components/Toast';

interface Booking {
  id: number;
  show_id: number;
  user_id: number;
  seats_booked: number;
  status: string;
  created_at: string;
  seats?: number[];
}

interface ShowInfo {
  id: number;
  name: string;
  start_time: string;
  total_seats: number;
  available_seats: number;
}

export const BookingSuccessPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [showInfo, setShowInfo] = useState<ShowInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await apiService.get(`/bookings/${bookingId}`);
      const bookingData = response.data;
      setBooking(bookingData);
      
      // Fetch show info
      if (bookingData.show_id) {
        const showResponse = await apiService.get(`/shows/${bookingData.show_id}`);
        setShowInfo(showResponse.data);
      }

      // Generate dummy QR code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BOOKING_${bookingData.id}_SHOW_${bookingData.show_id}_SEATS_${bookingData.seats_booked}`;
      setQrCode(qrUrl);
      showToast('✓ Booking confirmed! Your e-ticket is ready.', 'success');
    } catch (err) {
      console.error('Error fetching booking:', err);
      showToast('Failed to load booking details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = () => {
    if (!booking || !showInfo) return;
    
    // Create a simple text-based ticket
    const ticketContent = `
╔════════════════════════════════════════════════════╗
║         🎬 CINEMA TICKET - BOOKING CONFIRMATION      ║
╠════════════════════════════════════════════════════╣
║                                                     ║
║  BOOKING ID: #${booking.id}                        
║  STATUS: ${booking.status}                                 
║                                                     ║
║  MOVIE: ${showInfo.name}                          
║  DATE: ${new Date(showInfo.start_time).toLocaleDateString()}   
║  TIME: ${new Date(showInfo.start_time).toLocaleTimeString()}        
║                                                     ║
║  SEATS: ${booking.seats?.join(', ') || 'N/A'}           
║  TOTAL SEATS: ${booking.seats_booked}                           
║  AMOUNT PAID: ₹${booking.seats_booked * 349}                   
║                                                     ║
║  Important: Please arrive 15 minutes before show   ║
║                                                     ║
╚════════════════════════════════════════════════════╝
    `;

    // Create blob and download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(ticketContent));
    element.setAttribute('download', `ticket_${booking.id}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('✓ Ticket downloaded successfully!', 'success');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.successBox}>
        <div style={styles.successIcon}>✓</div>
        <h1>Booking Confirmed!</h1>
        <p style={styles.subtitle}>Your tickets have been successfully booked</p>

        {booking && showInfo && (
          <div style={styles.bookingDetails}>
            <div style={styles.detailSection}>
              <h3>Booking Details</h3>
              <div style={styles.detailItem}>
                <span className="label">Booking ID:</span>
                <span className="value" style={{color: '#667eea', fontWeight: 'bold'}}>
                  #{booking.id}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span className="label">Show:</span>
                <span className="value">{showInfo.name}</span>
              </div>
              <div style={styles.detailItem}>
                <span className="label">Date & Time:</span>
                <span className="value">
                  {new Date(showInfo.start_time).toLocaleString()}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span className="label">No. of Seats:</span>
                <span className="value">{booking.seats_booked}</span>
              </div>
              <div style={styles.detailItem}>
                <span className="label">Total Amount:</span>
                <span className="value" style={{color: '#28a745', fontWeight: 'bold'}}>
                  ₹{booking.seats_booked * 349}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span className="label">Status:</span>
                <span className="value" style={{color: '#28a745'}}>
                  {booking.status}
                </span>
              </div>
            </div>

            <div style={styles.nextSteps}>
              <h3>What's Next?</h3>
              <ul>
                <li>✓ Check your email for the confirmation</li>
                <li>✓ Your e-tickets are ready to use</li>
                <li>✓ Show your booking ID at the cinema</li>
                <li>✓ Arrive 15 minutes before the show</li>
              </ul>
            </div>

            {/* Ticket Display Section */}
            <div style={styles.ticketSection}>
              <h3>📋 Your E-Ticket</h3>
              <div style={styles.ticketBox}>
                <div style={styles.ticketHeader}>🎬 CINEMA E-TICKET</div>
                
                <div style={styles.ticketContent}>
                  <div style={styles.ticketRow}>
                    <span>Booking ID:</span>
                    <strong>#{booking.id}</strong>
                  </div>
                  <div style={styles.ticketRow}>
                    <span>Movie:</span>
                    <strong>{showInfo.name}</strong>
                  </div>
                  <div style={styles.ticketRow}>
                    <span>Date:</span>
                    <strong>{new Date(showInfo.start_time).toLocaleDateString()}</strong>
                  </div>
                  <div style={styles.ticketRow}>
                    <span>Time:</span>
                    <strong>{new Date(showInfo.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  </div>
                  <div style={styles.ticketRow}>
                    <span>Seats:</span>
                    <strong>{booking.seats?.join(', ') || 'N/A'}</strong>
                  </div>
                  <div style={styles.ticketDivider}></div>
                  <div style={styles.qrSection}>
                    {qrCode && <img src={qrCode} alt="QR Code" style={styles.qrCode} />}
                    <p style={{fontSize: '0.8rem', color: '#666', marginTop: '10px'}}>
                      Show this QR code at the cinema
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={handleDownloadTicket}
                  style={styles.downloadButton}
                >
                  ⬇️ Download Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.buttonGroup}>
          <button
            onClick={() => navigate('/my-bookings')}
            style={styles.primaryButton}
          >
            📋 View My Bookings
          </button>
          <button
            onClick={() => navigate('/')}
            style={styles.secondaryButton}
          >
            🎬 Book More Tickets
          </button>
        </div>

        <div style={styles.actionButtons}>
          <button 
            style={styles.actionButton}
            onClick={() => alert('📥 E-tickets downloaded!\nCheck your downloads folder.')}
          >
            📥 Download E-Ticket
          </button>
          <button 
            style={styles.actionButton}
            onClick={() => alert('✉️ Confirmation email sent!\nCheck your inbox.')}
          >
            ✉️ Resend Confirmation
          </button>
        </div>

        <div style={styles.shareSection}>
          <p>Share your excitement!</p>
          <div style={styles.shareButtons}>
            <button style={styles.shareButton}>💬 WhatsApp</button>
            <button style={styles.shareButton}>📧 Email</button>
            <button style={styles.shareButton}>🔗 Copy Link</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px 20px',
  } as React.CSSProperties,
  loading: {
    textAlign: 'center' as const,
    padding: '100px 20px',
  } as React.CSSProperties,
  successBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    padding: '40px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  successIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 20px',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  subtitle: {
    color: '#666',
    marginBottom: '30px',
  } as React.CSSProperties,
  bookingDetails: {
    textAlign: 'left' as const,
    marginBottom: '30px',
  } as React.CSSProperties,
  detailSection: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  } as React.CSSProperties,
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eee',
  } as React.CSSProperties,
  nextSteps: {
    backgroundColor: '#f0f8ff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  } as React.CSSProperties,
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '20px',
  } as React.CSSProperties,
  primaryButton: {
    padding: '14px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  } as React.CSSProperties,
  secondaryButton: {
    padding: '14px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  } as React.CSSProperties,
  shareSection: {
    borderTop: '1px solid #eee',
    paddingTop: '20px',
  } as React.CSSProperties,
  shareButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginTop: '10px',
  } as React.CSSProperties,
  shareButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  } as React.CSSProperties,
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  } as React.CSSProperties,
  actionButton: {
    padding: '12px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  ticketSection: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '2px solid #eee',
  } as React.CSSProperties,
  ticketBox: {
    backgroundColor: '#f9f9f9',
    border: '2px solid #667eea',
    borderRadius: '12px',
    overflow: 'hidden',
    marginTop: '15px',
  } as React.CSSProperties,
  ticketHeader: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '15px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    fontSize: '1.1rem',
  } as React.CSSProperties,
  ticketContent: {
    padding: '20px',
  } as React.CSSProperties,
  ticketRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '0.95rem',
  } as React.CSSProperties,
  ticketDivider: {
    borderTop: '2px dashed #667eea',
    margin: '15px 0',
  } as React.CSSProperties,
  qrSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #e0e0e0',
  } as React.CSSProperties,
  qrCode: {
    width: '150px',
    height: '150px',
    border: '2px solid #667eea',
    padding: '5px',
    borderRadius: '8px',
  } as React.CSSProperties,
  downloadButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '0 0 12px 12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.3s ease',
  } as React.CSSProperties,
};
