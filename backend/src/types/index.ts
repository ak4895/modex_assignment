export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export interface Show {
  id: number;
  name: string;
  start_time: Date;
  total_seats: number;
  available_seats: number;
  show_type: string;
  created_at: Date;
  updated_at: Date;
}

export interface Booking {
  id: number;
  user_id: number;
  show_id: number;
  seats_booked: number;
  status: BookingStatus;
  created_at: Date;
  updated_at: Date;
}

export interface BookingSeat {
  id: number;
  booking_id: number;
  seat_number: number;
  show_id: number;
  created_at: Date;
}

export interface BookingRequest {
  user_id: number;
  show_id: number;
  seats_booked: number;
}

export interface CreateShowRequest {
  name: string;
  start_time: string;
  total_seats: number;
  show_type?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
