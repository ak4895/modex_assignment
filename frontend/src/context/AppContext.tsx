import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, Show, Booking } from '../types/index';
import apiService from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (name: string, email: string) => Promise<void>;
  logout: () => void;
}

interface ShowContextType {
  shows: Show[];
  loading: boolean;
  error: string | null;
  fetchShows: () => Promise<void>;
  fetchShowById: (id: number) => Promise<Show | null>;
}

interface BookingContextType {
  bookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  error: string | null;
  bookSeats: (showId: number, seatsToBook: number) => Promise<Booking | null>;
  getUserBookings: (userId: number) => Promise<void>;
  cancelBooking: (bookingId: number) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const ShowContext = createContext<ShowContextType | undefined>(undefined);
export const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = useCallback(async (name: string, email: string) => {
    try {
      const response = await apiService.createOrGetUser(name, email);
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const isAdmin = user?.email === 'admin@test.com';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const ShowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getAllShows();
      if (response.success && response.data) {
        setShows(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shows');
      console.error('Fetch shows error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchShowById = useCallback(async (id: number): Promise<Show | null> => {
    try {
      const response = await apiService.getShowById(id);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Fetch show by ID error:', err);
      return null;
    }
  }, []);

  // Fetch shows on mount
  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  return (
    <ShowContext.Provider value={{ shows, loading, error, fetchShows, fetchShowById }}>
      {children}
    </ShowContext.Provider>
  );
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookSeats = useCallback(async (showId: number, seatsToBook: number): Promise<Booking | null> => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not authenticated');
        return null;
      }

      const user = JSON.parse(userStr);
      const response = await apiService.bookSeats({
        user_id: user.id,
        show_id: showId,
        seats_booked: seatsToBook,
      });

      if (response.success && response.data) {
        setCurrentBooking(response.data);
        return response.data;
      }
      setError(response.error || 'Failed to book seats');
      return null;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Booking failed');
      console.error('Book seats error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserBookings = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      const response = await apiService.getUserBookings(userId);
      if (response.success && response.data) {
        setBookings(response.data);
      }
    } catch (err) {
      console.error('Fetch user bookings error:', err);
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId: number) => {
    setLoading(true);
    try {
      await apiService.cancelBooking(bookingId);
      setBookings(bookings.filter(b => b.id !== bookingId));
    } catch (err) {
      console.error('Cancel booking error:', err);
      setError('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  }, [bookings]);

  return (
    <BookingContext.Provider value={{ bookings, currentBooking, loading, error, bookSeats, getUserBookings, cancelBooking }}>
      {children}
    </BookingContext.Provider>
  );
};
