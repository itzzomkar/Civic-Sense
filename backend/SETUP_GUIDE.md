# 🚀 Urban Guardians - Complete Setup Guide

## Overview
Your Urban Guardians application now has a **complete real backend** with MongoDB database, JWT authentication, and comprehensive APIs. No more mock data!

## 📋 Prerequisites

### Required Software:
1. **Node.js** (v16+) - [Download here](https://nodejs.org/)
2. **MongoDB** - Choose one option:
   - **Local MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
   - **MongoDB Atlas** (Cloud) - [Free tier](https://www.mongodb.com/atlas)
3. **Git** (for cloning)

---

## 🎯 Quick Start (5 minutes)

### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Start the backend server
npm run dev
```

**Server will run at:** `http://localhost:5000`

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd ../  # Back to root directory

# Start frontend
npm run dev
```

**Frontend will run at:** `http://localhost:8080`

---

## 🗄️ Database Setup Options

### Option A: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account and cluster
3. Get connection string
4. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urban-guardians
   ```

### Option B: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:
   - **Windows**: MongoDB will start automatically
   - **macOS**: `brew services start mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

3. Backend will connect to: `mongodb://localhost:27017/urban-guardians`

---

## 🌱 Seed Database with Real Data

```bash
cd backend
npm run seed
```

This creates:
- **Admin**: `admin@urbanguardians.com` / `admin123`
- **Citizens**: `john@example.com` / `password123`
- **Officials**: `pwd.officer@municipality.gov` / `officer123`
- **6 realistic civic reports** with images and data

---

## 🧪 Test Your Setup

### 1. Check Backend Health
Visit: `http://localhost:5000/health`

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "development"
}
```

### 2. Test Authentication
**Login Endpoint:** `POST http://localhost:5000/api/auth/login`

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### 3. Frontend Integration
1. Visit: `http://localhost:8080`
2. Click "Sign Up" - should work with real backend!
3. Login with sample accounts
4. Create reports, view community feed

---

## 🔗 Available API Endpoints

### 🔐 Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user  
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### 📝 Reports  
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get specific report
- `POST /api/reports/:id/upvote` - Upvote report

### 👥 Users (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### 📊 Analytics (Admin/Official)
- `GET /api/analytics/dashboard` - Dashboard stats

---

## 🛡️ Security Features

✅ **JWT Authentication** - Secure token-based auth  
✅ **Password Hashing** - bcrypt with salt rounds  
✅ **Rate Limiting** - Prevent API abuse  
✅ **Data Validation** - Joi schema validation  
✅ **CORS Protection** - Cross-origin security  
✅ **XSS Protection** - Input sanitization  

---

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed (Windows)
taskkill /PID <PID_NUMBER> /F
```

### MongoDB Connection Issues

**Error: `MongoNetworkError`**
- Install MongoDB locally OR use MongoDB Atlas
- Check connection string in `.env`
- Ensure MongoDB service is running

**Error: `Authentication failed`**
- Verify MongoDB Atlas credentials
- Check IP whitelist in Atlas
- Update connection string with correct password

### Frontend API Errors

**Error: `Network Error`**
- Ensure backend is running on port 5000
- Check CORS configuration
- Verify API base URL in frontend

---

## 📱 Sample User Accounts

```javascript
// Admin Account
{
  "email": "admin@urbanguardians.com",
  "password": "admin123",
  "role": "admin"
}

// Citizen Account  
{
  "email": "john@example.com",
  "password": "password123", 
  "role": "citizen"
}

// Municipal Official
{
  "email": "pwd.officer@municipality.gov",
  "password": "officer123",
  "role": "official",
  "department": "Public Works"
}
```

---

## 🎉 You're Ready!

### Your Urban Guardians app now has:

- ✅ **Real MongoDB database** with sample data
- ✅ **JWT authentication** for secure login
- ✅ **Complete API endpoints** for all features
- ✅ **Role-based permissions** (citizen/official/admin)
- ✅ **Geospatial queries** for location-based reports
- ✅ **File upload support** ready for integration
- ✅ **Real-time features** with Socket.IO
- ✅ **Admin dashboard** with analytics
- ✅ **PWA capabilities** for mobile installation

### Next Steps:
1. **Customize** the sample data for your needs
2. **Add more features** like comments, chat, notifications
3. **Deploy** to production with environment variables
4. **Present** your working civic engagement platform! 

---

## 🚀 Production Deployment

### Environment Variables:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/urban-guardians
JWT_SECRET=your-super-secure-secret-key-here
NODE_ENV=production
PORT=5000
```

### Deploy Options:
- **Backend**: Heroku, Railway, DigitalOcean
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Database**: MongoDB Atlas (cloud)

---

## 💡 Pro Tips

1. **Use MongoDB Compass** to visually browse your data
2. **Install Postman** to test API endpoints easily
3. **Enable MongoDB logging** to debug queries
4. **Set up environment-specific configs** for dev/prod
5. **Monitor performance** with database indexes

---

## 🆘 Need Help?

Your Urban Guardians application is fully functional with real backend APIs! 

- Check the `/backend/README.md` for detailed API documentation
- Visit `http://localhost:5000/health` to verify backend status
- Test authentication with the provided sample accounts
- Explore the seeded reports and user data

**Happy coding! 🎉**