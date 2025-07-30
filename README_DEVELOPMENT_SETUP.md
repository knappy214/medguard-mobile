# MedGuard Mobile - Development Setup Guide

## Current Issue Resolution

The error you encountered is **NOT** related to the Wagtail backend port mismatch. Here's what's actually happening:

### Problem Analysis
1. **Expo Development Server**: Runs on port 8081 (default Metro bundler port)
2. **Django Backend**: Correctly configured on port 8000
3. **Mobile App**: Correctly configured to connect to `http://localhost:8000/api`

### The Real Issue
The "hanging" occurs when:
- Port 8081 is already in use by another process
- Network connectivity issues between the mobile app and Expo dev server
- Expo development server not starting properly

## Quick Fix Steps

### 1. Clear Port Conflicts
```bash
# Check what's using port 8081
netstat -ano | findstr :8081

# Kill any processes using the port (if needed)
taskkill /PID <PID> /F
```

### 2. Start Expo Development Server
```bash
cd medguard-mobile
npx expo start --clear
```

### 3. Start Django Backend
```bash
cd medguard_backend
python manage.py runserver
```

### 4. Verify Connections
```bash
# Test Django backend
curl -I http://localhost:8000/api/medications/

# Test Expo dev server
curl -I http://localhost:8081
```

## Configuration Verification

### Mobile App API Configuration
✅ **Correctly configured** in `src/services/authService.js`:
```javascript
API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'
```

### Django Backend Configuration
✅ **Correctly configured** in `medguard_backend/settings/environment.py`:
```python
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000')
```

## Troubleshooting

### If Expo Still Hangs:
1. **Use different port**: `npx expo start --port 8082`
2. **Use tunnel mode**: `npx expo start --tunnel`
3. **Use localhost only**: `npx expo start --localhost`

### If Backend Connection Fails:
1. **Check Django is running**: `python manage.py runserver`
2. **Check CORS settings**: Ensure `localhost:8081` is in `CORS_ALLOWED_ORIGINS`
3. **Check firewall**: Ensure ports 8000 and 8081 are not blocked

### Network Issues:
1. **Use tunnel mode** for remote devices: `npx expo start --tunnel`
2. **Check IP address**: Ensure mobile device can reach development machine
3. **Use localhost only** for local development: `npx expo start --localhost`

## Development Workflow

1. **Start Django backend first**
2. **Start Expo development server**
3. **Open Expo Go app on mobile device**
4. **Scan QR code or enter URL manually**

## Environment Variables (Optional)

Create `.env` file in `medguard-mobile/`:
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_ENVIRONMENT=development
```

## Port Summary

| Service | Port | Purpose |
|---------|------|---------|
| Django Backend | 8000 | API endpoints |
| Expo Dev Server | 8081 | Metro bundler |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/Celery |

## Common Commands

```bash
# Start development servers
cd medguard_backend && python manage.py runserver &
cd medguard-mobile && npx expo start

# Clear caches
npx expo start --clear
python manage.py collectstatic --clear

# Check processes
netstat -ano | findstr :8081
netstat -ano | findstr :8000
``` 