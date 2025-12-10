import React, { useContext } from 'react';
import { AuthContext, ShowContext, BookingContext } from '../context/AppContext';
import apiService from '../services/apiService';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useShows = () => {
  const context = useContext(ShowContext);
  if (!context) {
    throw new Error('useShows must be used within ShowProvider');
  }
  return context;
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};

// Custom hook for polling available seats; accepts null to disable polling until showId is ready
export const usePollingSeats = (showId: number | null, interval: number = 5000) => {
  const [availableSeats, setAvailableSeats] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!showId) {
      setAvailableSeats([]);
      return undefined;
    }

    const fetchSeats = async () => {
      setLoading(true);
      try {
        const response = await apiService.getAvailableSeats(showId);
        if (response.success && response.data) {
          setAvailableSeats(response.data.available_seats);
        }
      } catch (error) {
        console.error('Failed to fetch seats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
    const pollInterval = setInterval(fetchSeats, interval);

    return () => clearInterval(pollInterval);
  }, [showId, interval]);

  return { availableSeats, loading };
};
