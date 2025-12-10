export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface Show {
  id: number;
  name: string;
  start_time: string;
  total_seats: number;
  available_seats: number;
  show_type: string;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: number;
  user_id: number;
  show_id: number;
  seats_booked: number;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  seats?: number[];
  show_name?: string;
  user_email?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
