import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/index';
import apiService from '../services/apiService';
import { showToast } from '../components/Toast';

interface BookingData {
  showId: number;
  seats: number[];
  show: {
    name: string;
    start_time: string;
  };
}

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const stored = localStorage.getItem('selectedSeats');
    if (!stored) {
      navigate('/');
      return;
    }

    setBookingData(JSON.parse(stored));
  }, [user]);

  const totalPrice = bookingData ? bookingData.seats.length * 349 : 0;
  const subtotal = bookingData ? bookingData.seats.length * 299 : 0;
  const convenienceFee = bookingData ? bookingData.seats.length * 50 : 0;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingData) return;

    try {
      setProcessing(true);
      setError('');
      showToast('🔄 Processing payment...', 'info', 0);

      // Validate payment method inputs
      if (paymentMethod === 'upi' && !upiId) {
        throw new Error('Please enter UPI ID');
      }
      if (paymentMethod === 'card' && !cardDetails.number) {
        throw new Error('Please enter card details');
      }

      if (paymentMethod === 'card' || paymentMethod === 'wallet') {
        setShowOtp(true);
        setProcessing(false);
        showToast('📱 OTP sent to your registered number', 'info');
        return;
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create booking
      const response = await apiService.post('/bookings', {
        user_id: user?.id,
        show_id: bookingData.showId,
        seats_booked: bookingData.seats.length,
        seat_numbers: bookingData.seats,
        status: 'CONFIRMED',
      });

      // Clear localStorage
      localStorage.removeItem('selectedSeats');
      showToast('✓ Payment successful! Booking confirmed.', 'success');

      // Navigate to success page
      navigate(`/booking-success/${response.data.id}`);
    } catch (err: any) {
      const errorMsg = err.message || 'Payment failed. Please try again.';
      setError(errorMsg);
      showToast(`❌ ${errorMsg}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      showToast('⚠ Please enter a valid 6-digit OTP', 'warning');
      return;
    }

    try {
      setProcessing(true);
      showToast('✓ Verifying OTP...', 'info', 0);

      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create booking
      const response = await apiService.post('/bookings', {
        user_id: user?.id,
        show_id: bookingData?.showId,
        seats_booked: bookingData?.seats.length,
        seat_numbers: bookingData?.seats,
        status: 'CONFIRMED',
      });
      
      showToast('✓ Payment verified! Booking confirmed.', 'success');

      // Clear localStorage
      localStorage.removeItem('selectedSeats');

      // Navigate to success page
      navigate(`/booking-success/${response.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!bookingData) return null;

  // OTP Modal Render
  if (showOtp) {
    return (
      <div style={styles.container}>
        <div style={styles.otpModal}>
          <div style={styles.otpHeader}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>🔐 Verify OTP</h2>
            <p style={{ color: '#666', marginTop: '8px', marginBottom: 0 }}>
              Enter the OTP sent to your {paymentMethod === 'card' ? 'registered mobile' : 'wallet app'}
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleOtpVerify(); }} style={styles.otpForm}>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              maxLength={6}
              style={styles.otpInput}
              disabled={processing}
              autoFocus
            />

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              disabled={processing || otp.length !== 6}
              style={{
                ...styles.submitButton,
                opacity: processing || otp.length !== 6 ? 0.6 : 1,
                cursor: processing || otp.length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {processing ? '⏳ Verifying...' : '✓ Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowOtp(false);
                setOtp('');
                setError('');
              }}
              style={styles.backButton}
              disabled={processing}
            >
              ← Back to Payment
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button 
        style={styles.backButton}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div style={styles.content}>
        {/* Order Summary */}
        <div style={styles.orderSummary}>
          <h2>Order Summary</h2>
          
          <div style={styles.summarySection}>
            <h4>Show Details</h4>
            <p><strong>{bookingData.show.name}</strong></p>
            <p style={{color: '#666', fontSize: '0.9rem'}}>
              {new Date(bookingData.show.start_time).toLocaleString()}
            </p>
          </div>

          <div style={styles.summarySection}>
            <h4>Seats</h4>
            <p style={{color: '#667eea', fontWeight: 'bold', fontSize: '1.1rem'}}>
              {bookingData.seats.sort((a, b) => a - b).join(', ')}
            </p>
            <p style={{color: '#666', fontSize: '0.9rem'}}>
              {bookingData.seats.length} seat{bookingData.seats.length > 1 ? 's' : ''}
            </p>
          </div>

          <div style={styles.priceBreakdown}>
            <div style={styles.priceRow}>
              <span>Subtotal ({bookingData.seats.length} × ₹299)</span>
              <span>₹{subtotal}</span>
            </div>
            <div style={styles.priceRow}>
              <span>Convenience Fee</span>
              <span>₹{convenienceFee}</span>
            </div>
            <hr style={{margin: '15px 0', borderColor: '#eee'}} />
            <div style={{...styles.priceRow, fontWeight: 'bold', fontSize: '1.2rem'}}>
              <span>Total Amount</span>
              <span style={{color: '#28a745'}}>₹{totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={styles.paymentSection}>
          <h2>Select Payment Method</h2>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handlePayment}>
            {/* Payment Options */}
            <div style={styles.paymentOptions}>
              <label style={{...styles.paymentOption, borderColor: paymentMethod === 'upi' ? '#667eea' : '#ddd'}}>
                <input
                  type="radio"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span style={{marginLeft: '10px'}}>💳 UPI</span>
              </label>

              <label style={{...styles.paymentOption, borderColor: paymentMethod === 'card' ? '#667eea' : '#ddd'}}>
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span style={{marginLeft: '10px'}}>💰 Debit/Credit Card</span>
              </label>

              <label style={{...styles.paymentOption, borderColor: paymentMethod === 'wallet' ? '#667eea' : '#ddd'}}>
                <input
                  type="radio"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span style={{marginLeft: '10px'}}>📱 Mobile Wallet</span>
              </label>

              <label style={{...styles.paymentOption, borderColor: paymentMethod === 'netbanking' ? '#667eea' : '#ddd'}}>
                <input
                  type="radio"
                  value="netbanking"
                  checked={paymentMethod === 'netbanking'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span style={{marginLeft: '10px'}}>🏦 Net Banking</span>
              </label>
            </div>

            {/* Payment Form */}
            <div style={styles.paymentForm}>
              {paymentMethod === 'upi' && (
                <div style={styles.formGroup}>
                  <label>UPI ID (e.g., yourname@upi)</label>
                  <input
                    type="text"
                    placeholder="Enter UPI ID"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={styles.input}
                  />
                </div>
              )}

              {paymentMethod === 'card' && (
                <>
                  <div style={styles.formGroup}>
                    <label>Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="JOHN DOE"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/25"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label>CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === 'wallet' && (
                <p style={{color: '#666', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
                  Click "Proceed to Pay" to complete payment via available mobile wallets
                </p>
              )}

              {paymentMethod === 'netbanking' && (
                <p style={{color: '#666', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
                  Click "Proceed to Pay" to complete payment via your bank
                </p>
              )}
            </div>

            {/* Proceed Button */}
            <button
              type="submit"
              disabled={processing}
              style={{
                ...styles.payButton,
                opacity: processing ? 0.6 : 1,
              }}
            >
              {processing ? (
                <>
                  <span style={{marginRight: '10px'}}>⏳</span>
                  Processing Payment...
                </>
              ) : (
                <>
                  <span style={{marginRight: '10px'}}>💳</span>
                  Pay ₹{totalPrice}
                </>
              )}
            </button>

            <div style={styles.securityBadge}>
              <span>🔒</span> Secure payment powered by Advanced Encryption
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  } as React.CSSProperties,
  backButton: {
    marginBottom: '20px',
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  } as React.CSSProperties,
  content: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '30px',
  } as React.CSSProperties,
  orderSummary: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    border: '1px solid #e0e0e0',
    height: 'fit-content',
    position: 'sticky' as const,
    top: '20px',
  } as React.CSSProperties,
  summarySection: {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee',
  } as React.CSSProperties,
  priceBreakdown: {
    backgroundColor: '#ffffff',
    border: '1px solid #d0d0d0',
    padding: '15px',
    borderRadius: '8px',
  } as React.CSSProperties,
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    color: '#333',
    fontWeight: '500',
  } as React.CSSProperties,
  paymentSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  paymentOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    marginBottom: '30px',
  } as React.CSSProperties,
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    border: '2px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  paymentForm: {
    marginBottom: '25px',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '20px',
  } as React.CSSProperties,
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    marginTop: '8px',
  } as React.CSSProperties,
  payButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginBottom: '15px',
  } as React.CSSProperties,
  securityBadge: {
    textAlign: 'center' as const,
    fontSize: '0.85rem',
    color: '#666',
  } as React.CSSProperties,
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
  } as React.CSSProperties,
  otpModal: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    maxWidth: '500px',
    margin: '50px auto',
  } as React.CSSProperties,
  otpHeader: {
    marginBottom: '30px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  otpForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  } as React.CSSProperties,
  otpInput: {
    width: '100%',
    padding: '16px',
    fontSize: '24px',
    textAlign: 'center' as const,
    border: '2px solid #ddd',
    borderRadius: '8px',
    letterSpacing: '8px',
    fontWeight: 'bold',
    transition: 'border-color 0.3s ease',
  } as React.CSSProperties,
  submitButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem',
    color: '#666',
  } as React.CSSProperties,
};
