# Urban Guardians Backend API

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
Copy the environment variables:
```bash
cp .env.example .env
```

Update `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/urban-guardians
JWT_SECRET=your-super-secret-jwt-key-for-urban-guardians-2024
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
```

### 3. Database Setup

#### Option A: Local MongoDB
1. Install and start MongoDB locally
2. The app will connect to `mongodb://localhost:27017/urban-guardians`

#### Option B: MongoDB Atlas (Cloud)
1. Create a free MongoDB Atlas account
2. Create a cluster and database
3. Update `MONGODB_URI` in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urban-guardians
   ```

### 4. Seed the Database
```bash
npm run seed
```

This creates sample data including:
- **Admin user**: `admin@urbanguardians.com` / `admin123`
- **Test citizen**: `john@example.com` / `password123`
- **Test official**: `pwd.officer@municipality.gov` / `officer123`
- Sample civic reports with real data

### 5. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start at: **http://localhost:5000**

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/check-email` - Check if email exists

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/:id/upvote` - Upvote report
- `GET /api/reports/nearby` - Get nearby reports

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user (admin/self)
- `DELETE /api/users/:id` - Deactivate user (admin only)

### Admin
- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/users` - Manage users
- `PUT /api/admin/reports/:id/status` - Update report status
- `GET /api/admin/analytics` - Get system analytics

## 🛡️ Security Features

- JWT authentication with secure tokens
- Password hashing with bcryptjs
- Rate limiting on API endpoints
- Data sanitization against NoSQL injection
- XSS protection
- CORS configuration
- Input validation with Joi
- Error handling middleware

## 📊 Database Schema

### User Model
- Personal information and authentication
- Role-based permissions (citizen, official, admin)
- Location and preferences
- Civic points and statistics

### Report Model
- Comprehensive issue reporting
- Geolocation support
- Status tracking with history
- Image attachments
- Upvoting/downvoting system
- Resolution tracking

## 🔥 Advanced Features

- **Real-time updates** with Socket.IO
- **File upload** support with Cloudinary
- **Geospatial queries** for location-based reports
- **Email notifications** for status updates
- **Analytics and reporting** with MongoDB aggregations
- **Admin dashboard** with comprehensive controls

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Seed database with sample data
npm run seed

# Run tests
npm test
```

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/urban-guardians` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

## 🚀 Production Deployment

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use MongoDB Atlas for cloud database
3. **Security**: Update JWT_SECRET with strong random key
4. **CORS**: Configure allowed origins for frontend
5. **Rate Limiting**: Adjust limits for production traffic
6. **Logging**: Enable production logging
7. **SSL**: Use HTTPS in production

## 📞 API Testing

Use the provided sample accounts:

```json
{
  "admin": {
    "email": "admin@urbanguardians.com",
    "password": "admin123",
    "role": "admin"
  },
  "citizen": {
    "email": "john@example.com", 
    "password": "password123",
    "role": "citizen"
  },
  "official": {
    "email": "pwd.officer@municipality.gov",
    "password": "officer123", 
    "role": "official"
  }
}
```

## 🆘 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally
- Check connection string format
- Verify database permissions

### Authentication Errors
- Check JWT_SECRET is set
- Verify token format in requests
- Ensure user account is active

### Server Startup Issues
- Check if port 5000 is available
- Verify all environment variables
- Check for dependency installation

## 📚 API Documentation

Visit `/health` endpoint to verify server status.

Full API documentation available at: [API Docs](http://localhost:5000/health)

---

## 🎯 Ready for Production!

Your Urban Guardians backend is now fully functional with:
- ✅ Real MongoDB database
- ✅ JWT authentication
- ✅ Comprehensive API endpoints
- ✅ Sample data for testing
- ✅ Security middleware
- ✅ Error handling
- ✅ Real-time features

Start the frontend at `http://localhost:8080` and backend at `http://localhost:5000` to see your complete application! 🎉