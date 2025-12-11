import { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import { showToast } from '../components/Toast';

export const usePaymentStatus = (bookingId: number | null) => {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const pollPaymentStatus = async () => {
      try {
        const response = await apiService.get(`/bookings/${bookingId}`);
        const status = response.data.status;
        setPaymentStatus(status);

        // Show toast based on status
        if (status === 'CONFIRMED') {
          showToast('✓ Payment confirmed!', 'success');
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    };

    // Poll every 2 seconds for payment status
    const interval = setInterval(pollPaymentStatus, 2000);
    pollPaymentStatus(); // Initial check

    return () => clearInterval(interval);
  }, [bookingId]);

  return { paymentStatus, isRefunding, setIsRefunding };
};
