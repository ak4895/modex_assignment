import axios, { AxiosInstance } from 'axios';
import { Show, User, Booking, ApiResponse, BookingRequest, CreateShowRequest } from '../types/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error);
        throw error;
      }
    );
  }

  // ========== Shows Endpoints ==========
  
  async createShow(data: CreateShowRequest): Promise<ApiResponse<Show>> {
    return this.client.post('/shows', data);
  }

  async getAllShows(): Promise<ApiResponse<Show[]>> {
    return this.client.get('/shows');
  }

  async getShowById(id: number): Promise<ApiResponse<Show>> {
    return this.client.get(`/shows/${id}`);
  }

  async getShowsByType(type: string): Promise<ApiResponse<Show[]>> {
    return this.client.get(`/shows/type/${type}`);
  }

  async getShowStats(id: number): Promise<ApiResponse<any>> {
    return this.client.get(`/shows/${id}/stats`);
  }

  async getAvailableSeats(showId: number): Promise<ApiResponse<any>> {
    return this.client.get(`/shows/${showId}/available-seats`);
  }

  async updateShow(id: number, data: Partial<CreateShowRequest>): Promise<ApiResponse<Show>> {
    return this.client.put(`/shows/${id}`, data);
  }

  async deleteShow(id: number): Promise<ApiResponse<null>> {
    return this.client.delete(`/shows/${id}`);
  }

  // ========== Users Endpoints ==========

  async createOrGetUser(name: string, email: string): Promise<ApiResponse<User>> {
    return this.client.post('/users', { name, email });
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return this.client.get('/users');
  }

  async getUserById(id: number): Promise<ApiResponse<User>> {
    return this.client.get(`/users/${id}`);
  }

  async updateUser(id: number, name?: string, email?: string): Promise<ApiResponse<User>> {
    return this.client.put(`/users/${id}`, { name, email });
  }

  // ========== Bookings Endpoints ==========

  async bookSeats(data: BookingRequest): Promise<ApiResponse<Booking>> {
    return this.client.post('/bookings', data);
  }

  async getBooking(id: number): Promise<ApiResponse<Booking>> {
    return this.client.get(`/bookings/${id}`);
  }

  async getUserBookings(userId: number): Promise<ApiResponse<Booking[]>> {
    return this.client.get(`/bookings/user/${userId}`);
  }

  async getShowBookings(showId: number): Promise<ApiResponse<Booking[]>> {
    return this.client.get(`/bookings/show/${showId}`);
  }

  async cancelBooking(id: number): Promise<ApiResponse<Booking>> {
    return this.client.delete(`/bookings/${id}`);
  }

  async expireOldBookings(): Promise<ApiResponse<any>> {
    return this.client.post('/bookings/expire-old');
  }
}

export default new ApiService();
