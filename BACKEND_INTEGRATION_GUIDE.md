# Backend Integration Guide

## Current Setup
- **Frontend**: Using localStorage mock API (`src/services/api.ts`)
- **Backend**: Fully functional REST API on port 5000

## When You're Ready to Switch to Real Backend

### Step 1: Update Environment Variables
Create a `.env` file in your frontend root:
```env
VITE_API_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### Step 2: Create Backend API Service
Replace `src/services/api.ts` with the TypeScript version that connects to your real backend.
The service is already created at `src/services/api.js` - just convert it to TypeScript when ready.

### Step 3: Update Authentication Flow
The backend uses JWT tokens instead of localStorage sessions:
- Tokens are stored in localStorage as 'token'
- Include token in Authorization header for all requests
- Token expiry is handled automatically

### Step 4: Database Migration
If you want to preserve existing localStorage data:
1. Export data from localStorage
2. Use the backend's import endpoints to seed the database
3. Clear localStorage after successful migration

## Backend API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/top-contributors` - Get leaderboard

### Reports
- `GET /api/reports` - Get all reports (with filters)
- `POST /api/reports` - Create new report (supports image upload)
- `GET /api/reports/:id` - Get single report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/:id/upvote` - Upvote report
- `POST /api/reports/:id/comments` - Add comment

### Analytics
- `GET /api/analytics/overall` - Platform statistics
- `GET /api/analytics/categories` - Category breakdown
- `GET /api/analytics/locations` - Location statistics
- `GET /api/analytics/priorities` - Priority distribution
- `GET /api/analytics/engagement` - User engagement metrics

### Admin (Requires admin role)
- `GET /api/admin/dashboard` - Admin dashboard data
- `PUT /api/admin/reports/:id/status` - Update report status
- `POST /api/admin/reports/bulk-update` - Bulk operations
- `POST /api/admin/users/:id/manage` - Manage user accounts

## Testing the Integration

### Quick Test
1. Start the backend server:
   ```bash
   cd server
   npm start
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. Create a test user:
   ```bash
   curl -X POST http://localhost:5000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

### Full Test Suite
Run the complete test suite:
```bash
cd server
./test-complete.ps1
```

## Deployment Checklist

### Backend
- [ ] Set production environment variables
- [ ] Configure MongoDB Atlas or production database
- [ ] Set up file storage (AWS S3 for images)
- [ ] Enable HTTPS
- [ ] Configure CORS for your frontend domain
- [ ] Set up logging and monitoring
- [ ] Deploy to cloud service (Heroku, AWS, etc.)

### Frontend
- [ ] Update API URL to production backend
- [ ] Build for production: `npm run build`
- [ ] Deploy to hosting service (Netlify, Vercel, etc.)
- [ ] Configure environment variables on hosting platform

## Common Issues and Solutions

### CORS Errors
- Ensure backend CORS is configured for your frontend URL
- Check that credentials are included in requests

### Authentication Issues
- Verify JWT_SECRET is set in backend .env
- Check token expiry settings
- Ensure token is included in request headers

### File Upload Issues
- Check file size limits (currently 5MB for images)
- Ensure uploads directory exists and has write permissions
- Verify multer configuration

## Support

For any issues during integration:
1. Check backend logs for errors
2. Use browser DevTools Network tab to inspect API calls
3. Run the test suite to verify backend functionality
4. Check MongoDB connection and data

---

## Current Status
✅ **Backend**: Fully functional, all tests passing
✅ **Frontend**: Working with localStorage mock
🔄 **Integration**: Ready when you are!