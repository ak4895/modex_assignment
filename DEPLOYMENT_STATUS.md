# Deployment Status & Next Steps

## ✅ Completed
1. **Database Setup**: Migrated Render PostgreSQL (all tables created: users, shows, bookings, booking_seats)
2. **Backend Configuration**: Updated to use `DATABASE_URL` with SSL for Render
3. **Local `.env`**: Created with production database connection

## 🚀 Backend Deployment (Render)

### Option A: Deploy via Render Dashboard
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create New → Web Service
3. Connect GitHub repo: `ak4895/modex_assignment`
4. Settings:
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Environment Variables**:
     - `DATABASE_URL`: `postgresql://modex_assignment_user:PFHa6iTfadecZBylfynUPdWk7WwEugXQ@dpg-d4st5p7pm1nc73d04iv0-a.virginia-postgres.render.com/modex_assignment`
     - `NODE_ENV`: `production`
     - `BOOKING_EXPIRY_MINUTES`: `2`
5. Deploy → Wait for build → Copy backend URL (e.g., `https://your-app.onrender.com`)

### Option B: Deploy via Render CLI
```bash
# Install Render CLI
npm install -g @render-tools/cli

# Login
render login

# Deploy from backend directory
cd backend
render deploy
```

### Verify Backend
Once deployed, test:
- Health: `https://your-backend.onrender.com/health`
- Swagger: `https://your-backend.onrender.com/api-docs`
- Create show: POST `https://your-backend.onrender.com/api/shows`

## 🎨 Frontend Deployment (Vercel)

### Steps:
1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Import `ak4895/modex_assignment` repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**:
     - `VITE_API_URL`: `https://your-backend.onrender.com/api` (replace with actual backend URL from step above)
4. Deploy → Copy frontend URL

### Verify Frontend
- Open frontend URL
- Test login → home → admin (create show) → booking → my bookings
- Check DevTools Network tab: API calls should hit your backend (200s)

## 📋 Final Checklist
- [ ] Backend deployed and health check passes
- [ ] Swagger docs accessible
- [ ] Frontend deployed
- [ ] Frontend can call backend APIs (check Network tab)
- [ ] Test full user flow: login → create show → book seats → cancel
- [ ] Test concurrency: open 2 tabs, book same seats (one should fail)
- [ ] Record video walkthrough
- [ ] Update README with live URLs
- [ ] Submit: GitHub repo + frontend URL + backend URL + video link

## 🎥 Video Recording Tips
Follow the script structure:
1. Show deployment dashboards (Render/Vercel)
2. Demo environment variables
3. Test health/Swagger endpoints
4. Explain architecture (TECHNICAL_DESIGN concepts)
5. Walk through all features live
6. Demonstrate concurrency protection
7. Highlight innovations and thought process

## 🔗 Current URLs
- **Database**: Connected (Render PostgreSQL)
- **Backend**: *Deploy now to get URL*
- **Frontend**: *Deploy after backend URL is ready*
- **GitHub**: https://github.com/ak4895/modex_assignment
