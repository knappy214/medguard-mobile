# Expo Notifications Setup Guide

## Current Issues Resolved

### ✅ **Immediate Fixes Applied**

1. **Added expo-dev-client** - Required for development builds
2. **Created EAS configuration** - `eas.json` for build profiles
3. **Added Project ID** - Configured in `app.json`
4. **Fixed push token registration** - Added proper error handling
5. **Added Expo Go compatibility** - Graceful fallback for local notifications

### ✅ **What Works Now**

- **Local notifications** work in Expo Go (SDK 53)
- **Push notifications** work in development builds
- **Error handling** prevents crashes
- **Graceful degradation** when features aren't available

## Development Build Setup

### **Option 1: Cloud Build (Recommended)**

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Create development build:**
   ```bash
   # For Android
   eas build --platform android --profile development
   
   # For iOS
   eas build --platform ios --profile development
   ```

4. **Install the build:**
   - Download the APK/IPA from the build link
   - Install on your device

5. **Run with development build:**
   ```bash
   npx expo start --dev-client
   ```

### **Option 2: Local Build (Requires Android Studio/Xcode)**

1. **Install Android Studio** (for Android builds)
2. **Set ANDROID_HOME environment variable**
3. **Run local build:**
   ```bash
   npx expo run:android
   # or
   npx expo run:ios
   ```

## Testing Notifications

### **In Expo Go (Limited)**
- ✅ Local notifications work
- ❌ Push notifications don't work (SDK 53 limitation)
- ✅ Notification permissions work

### **In Development Build (Full)**
- ✅ Local notifications work
- ✅ Push notifications work
- ✅ All notification features available

## Current Configuration

### **app.json Updates**
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "bbad6b34-f144-4cec-8556-bd5f6bb3d47c"
      }
    },
    "plugins": [
      "expo-localization",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#2563EB"
        }
      ]
    ]
  }
}
```

### **eas.json Configuration**
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## Troubleshooting

### **Metro Connection Issues**
1. **Check network connectivity**
2. **Ensure same network** for device and computer
3. **Try different ports:**
   ```bash
   npx expo start --port 8082
   ```

### **Notification Permission Issues**
1. **Check device settings**
2. **Clear app data**
3. **Reinstall app**

### **Build Issues**
1. **Clear cache:**
   ```bash
   npx expo start --clear
   ```
2. **Reset Metro:**
   ```bash
   npx expo start --reset-cache
   ```

## Next Steps

1. **Test current setup** with Expo Go (local notifications only)
2. **Create development build** for full notification support
3. **Test push notifications** in development build
4. **Deploy to production** when ready

## Files Modified

- ✅ `App.js` - Added Expo Go compatibility and error handling
- ✅ `app.json` - Added project ID and EAS configuration
- ✅ `eas.json` - Created build profiles
- ✅ `package.json` - Added expo-dev-client dependency

## Support

- **Expo Documentation:** https://docs.expo.dev/develop/development-builds/
- **Notifications Guide:** https://docs.expo.dev/push-notifications/overview/
- **EAS Build:** https://docs.expo.dev/build/introduction/ 