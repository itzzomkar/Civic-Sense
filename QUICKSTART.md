# Urban Guardians - Quick Start Guide 🏙️

## Start the Full Application (Recommended) 🚀

You have several options to start both the backend server and frontend client together:

### Option 1: NPM Script (Simplest)
```bash
npm start
```
or
```bash
npm run urban-guardians
```

### Option 2: PowerShell Script (Windows)
```powershell
.\start-urban-guardians.ps1
```

### Option 3: Batch File (Windows)
```cmd
start-urban-guardians.bat
```
or double-click the `start-urban-guardians.bat` file

## What Gets Started 📡

When you run any of the above commands, you'll get:

- **🚀 Backend Server**: `http://localhost:5000`
  - REST API endpoints
  - Socket.io WebSocket server
  - MongoDB connection
  - File upload handling

- **💻 Frontend Client**: `http://localhost:8080`  
  - React app with Vite dev server
  - Real-time WebSocket connections
  - Hot module replacement

## Individual Component Startup 🔧

If you need to start components separately:

```bash
# Start only the server
npm run server:dev

# Start only the frontend  
npm run dev

# Start with the alternative backend
npm run dev:all
```

## Available URLs 🌐

Once started, you can access:

- **Frontend**: http://localhost:8080
- **API Health Check**: http://localhost:5000/api/health
- **API Documentation**: http://localhost:5000/api

## Stopping the Application ⏹️

- Press `Ctrl+C` in the terminal to stop both services
- The `--kill-others-on-fail` flag ensures if one service fails, both are stopped

## Troubleshooting 🔍

If you encounter issues:

1. **Port conflicts**: Make sure ports 5000 and 8080 are available
2. **Dependencies**: Run `npm install` if packages are missing
3. **MongoDB**: Ensure MongoDB is running or check your connection string
4. **WebSocket errors**: Verify the server is running on port 5000

## First Time Setup 🛠️

```bash
# Install dependencies
npm install

# Seed demo data (optional)
npm run seed

# Start the application
npm start
```

---

**Happy coding! 🎉**