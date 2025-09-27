# Camera and Voice Features Setup Guide

## Important: HTTPS Required for Camera and Microphone Access

Modern browsers require HTTPS (or localhost) to access camera and microphone for security reasons.

## How to Enable Camera and Voice Features:

### Option 1: Use HTTPS in Development (Recommended)

Run the development server with HTTPS:

```bash
# Install local-ssl-proxy globally (one time)
npm install -g local-ssl-proxy

# In terminal 1: Run your dev server
npm run dev

# In terminal 2: Create HTTPS proxy (assuming your app runs on port 8080)
local-ssl-proxy --source 3000 --target 8080

# Now access your app at: https://localhost:3000
```

### Option 2: Use Vite's Built-in HTTPS

1. Update your `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    https: true,
    host: true
  },
  // ... rest of config
})
```

2. Then run:
```bash
npm run dev
```

3. Access at `https://localhost:5173` (accept the security warning)

### Option 3: Deploy to a Service with HTTPS

Deploy to services like:
- Vercel (automatic HTTPS)
- Netlify (automatic HTTPS)
- GitHub Pages (with HTTPS)

## Feature Breakdown:

### 📸 **Camera (Take Photo)**
- Opens live camera preview
- Shows video stream in modal
- Click capture button to take photo
- Works on mobile and desktop
- Requires HTTPS/localhost

### 📁 **Upload Files**
- Opens file picker
- Select multiple images
- Works everywhere (no HTTPS needed)
- Different from camera capture

### 🎤 **Voice Recording**
- Converts speech to text
- Real-time transcription
- Requires HTTPS/localhost
- Works in Chrome, Edge, Safari

### 📍 **GPS Location**
- Gets precise coordinates
- Reverse geocoding for address
- Works with HTTPS/localhost
- Shows Google Maps link

## Browser Support:

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Camera | ✅ | ✅ | ✅ | ✅ |
| Voice | ✅ | ❌ | ✅ | ✅ |
| Location | ✅ | ✅ | ✅ | ✅ |
| Upload | ✅ | ✅ | ✅ | ✅ |

## Testing the Features:

1. **Camera Test:**
   - Click "Take Photo"
   - Allow camera permission
   - See live preview
   - Click capture button

2. **Voice Test:**
   - Click microphone icon
   - Allow microphone permission
   - Speak clearly
   - See text appear in description

3. **Location Test:**
   - Click GPS icon
   - Allow location permission
   - See coordinates and address
   - Click Google Maps link

4. **Upload Test:**
   - Click "Upload Files"
   - Select images
   - See previews
   - Remove with X button

## Troubleshooting:

### "Not Secure" Error for Camera/Voice:
- You're not using HTTPS
- Solution: Use one of the HTTPS options above

### Permission Denied:
- Browser blocked access
- Click the lock icon in address bar
- Allow camera/microphone/location
- Refresh page

### No Camera/Microphone Found:
- Check device has camera/mic
- Check other apps aren't using them
- Restart browser

### Voice Not Working:
- Use Chrome, Edge, or Safari
- Ensure HTTPS/localhost
- Check microphone permissions
- Speak clearly and loudly

## Security Notes:

- All permissions are requested per-session
- No data is stored without user action
- Images are converted to base64 locally
- GPS coordinates are optional
- Users can deny any permission

## Production Deployment:

When deploying to production:
1. Ensure HTTPS is enabled
2. Add to your web server headers:
```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

3. Test all features after deployment

## Quick Test URLs:

After setting up HTTPS:
- Camera: https://localhost:3000 → Report Issue → Take Photo
- Voice: https://localhost:3000 → Report Issue → Microphone icon
- Location: https://localhost:3000 → Report Issue → GPS icon