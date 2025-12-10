# Ticket Booking System - Frontend

A modern React TypeScript frontend for a concurrent-safe ticket booking system. Book shows, manage reservations, and handle seat selection with real-time updates.

## Features

### User Features
- User authentication and profile management
- Browse available shows/trips/slots
- Interactive seat selection grid
- Book seats with real-time availability updates
- View booking history and status
- Cancel bookings with automatic refunds
- Responsive mobile-friendly design

### Admin Features  
- Create new shows/trips/slots
- Set seat capacity and pricing
- View all bookings and statistics
- Manage show information
- Monitor booking status

### Technical Features
- React hooks and Context API for state management
- TypeScript for type safety
- React Router for client-side navigation
- Axios for API integration
- Real-time seat polling
- Error boundaries and error handling
- Loading states and skeleton screens
- Responsive CSS styling

## Tech Stack

- **React** 18.2+
- **TypeScript** 5.3+
- **React Router DOM** 6.20+
- **Axios** 1.6+
- **Vite** 5.0+ (bundler)

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend README)

## Installation

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd modex_assignment/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=TicketBook
```

For production:
```env
VITE_API_URL=https://your-deployed-backend.com/api
VITE_APP_NAME=TicketBook
```

## Running the App

### Development Mode
```bash
npm run dev
```

Access at `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx
│   ├── ShowCard.tsx
│   ├── SeatGrid.tsx
│   └── ...
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── HomePage.tsx
│   ├── BookingPage.tsx
│   ├── AdminPage.tsx
│   └── ...
├── context/            # Context API state
│   └── AppContext.tsx
├── hooks/              # Custom React hooks
│   └── index.ts
├── services/           # API services
│   └── apiService.ts
├── types/              # TypeScript interfaces
│   └── index.ts
├── styles/             # CSS files
│   └── global.css
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## Key Components

### AppContext (Context API)

Three main contexts for state management:

#### AuthContext
```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  login: (name, email) => Promise<void>,
  logout: () => void
}
```

#### ShowContext
```typescript
{
  shows: Show[],
  loading: boolean,
  error: string | null,
  fetchShows: () => Promise<void>,
  fetchShowById: (id) => Promise<Show | null>
}
```

#### BookingContext
```typescript
{
  bookings: Booking[],
  currentBooking: Booking | null,
  loading: boolean,
  error: string | null,
  bookSeats: (showId, seatsToBook) => Promise<Booking | null>,
  getUserBookings: (userId) => Promise<void>,
  cancelBooking: (bookingId) => Promise<void>
}
```

### Custom Hooks

#### useAuth
```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

#### useShows
```typescript
const { shows, loading, error, fetchShows, fetchShowById } = useShows();
```

#### useBooking
```typescript
const { bookings, currentBooking, loading, bookSeats, cancelBooking } = useBooking();
```

#### usePollingSeats
```typescript
const { availableSeats, loading } = usePollingSeats(showId, 5000);
```

## API Integration

The frontend communicates with the backend API endpoints:

### Shows
```
GET /api/shows              - Get all shows
GET /api/shows/:id          - Get show by ID
GET /api/shows/type/:type   - Get shows by type
GET /api/shows/:id/available-seats - Get available seats
```

### Bookings
```
POST /api/bookings          - Book seats
GET /api/bookings/:id       - Get booking details
GET /api/bookings/user/:userId - Get user's bookings
DELETE /api/bookings/:id    - Cancel booking
```

### Users
```
POST /api/users             - Create/get user
GET /api/users/:id          - Get user by ID
PUT /api/users/:id          - Update user
```

## Deployment

### Vercel Deployment (Recommended)

1. **Push code to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
   - Go to vercel.com
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://your-backend.com/api
     ```

4. **Deploy**
   - Click "Deploy"
   - Vercel automatically builds and deploys

### Netlify Deployment

1. **Build the project**
```bash
npm run build
```

2. **Connect to Netlify**
   - Create account at netlify.com
   - Connect GitHub repository
   - Specify build command: `npm run build`
   - Specify publish directory: `dist`

3. **Environment Variables**
   - In Netlify dashboard: Site settings → Build & deploy → Environment
   - Add: `VITE_API_URL=https://your-backend.com/api`

4. **Deploy**
   - Automatic deployment on git push

## Performance Optimization

### Implemented
- Code splitting with React Router lazy loading
- Memoization with React.memo for components
- useCallback for event handlers
- useMemo for expensive computations
- Efficient Context API usage

### Caching
- Browser localStorage for user data
- Axios response caching for shows list
- Seat availability polling (configurable interval)

## Error Handling

### Network Errors
```typescript
try {
  await bookSeats(showId, 3);
} catch (error) {
  console.error('Booking failed:', error);
  // Show user-friendly error message
}
```

### Validation
- Form validation before API calls
- Email format validation
- Seats count validation (> 0)

### Error Boundaries
- Catch unhandled errors
- Display fallback UI
- Log errors to console

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Responsive Design

- Mobile-first approach
- Breakpoints: 768px (tablet), 1024px (desktop)
- Flexible layouts with CSS Flexbox/Grid
- Touch-friendly buttons and inputs

## Testing

Run tests:
```bash
npm run test
```

Run with coverage:
```bash
npm run test:coverage
```

## Troubleshooting

### Issue: API calls failing
**Solution**: Check VITE_API_URL in .env matches your backend URL

### Issue: Blank page on load
**Solution**: Check browser console for errors, ensure dependencies installed

### Issue: Real-time updates not working
**Solution**: Verify backend is running, check polling interval in usePollingSeats

### Issue: Login not working
**Solution**: Ensure backend user endpoint is accessible, check CORS settings

## Live Features

- Login with any name/email (no password required for demo)
- View available shows fetched from backend
- Real-time seat availability (refreshes every 5 seconds)
- Book seats with instant confirmation
- View booking history
- Cancel bookings

## Innovation & Unique Features

1. **Real-time Seat Polling**: Continuously updates available seats
2. **Optimistic UI Updates**: Smooth user experience with loading states
3. **Context API Efficiency**: Minimized re-renders with proper context splitting
4. **Error Recovery**: Graceful error handling with retry mechanisms
5. **Type Safety**: Full TypeScript coverage for better developer experience

## Future Enhancements

- WebSocket integration for live seat updates
- Payment gateway integration
- Seat selection history
- Wishlist/favorites
- Social sharing
- Push notifications
- Dark mode
- Multi-language support

## License

ISC

## Support

For issues, check the GitHub repository or contact support.

---

**Built with ❤️ for seamless ticket booking experiences**
