# MedGuard SA Mobile App

A comprehensive React Native mobile application for medication management and healthcare monitoring, built with Expo SDK 53, UI Kitten v5.3.0, and TypeScript.

## 🏗️ Project Structure

```
medguard-mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and external services
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # App constants
│   └── theme/              # UI Kitten theme configuration
├── assets/                 # Images, fonts, and static assets
├── app.json               # Expo configuration
├── babel.config.js        # Babel configuration
├── tsconfig.json          # TypeScript configuration
├── .eslintrc.js           # ESLint configuration
├── .prettierrc.js         # Prettier configuration
└── package.json           # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   cd medguard-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   npm run dev
   ```

4. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on physical device

## 🛠️ Development

### Available Scripts

```bash
# Development
npm start              # Start Expo development server
npm run dev           # Start with dev client
npm run android       # Run on Android
npm run ios           # Run on iOS
npm run web           # Run on web

# Code Quality
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format code with Prettier
npm run type-check    # TypeScript type checking

# Testing
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode

# Building
npm run build:android # Build Android APK
npm run build:ios     # Build iOS app

# Utilities
npm run clean         # Clear cache and restart
```

### Development Environment

The app is configured with:

- **TypeScript** for type safety
- **ESLint** + **Prettier** for code quality
- **UI Kitten v5.3.0** with Eva Design System
- **React Navigation v6** for navigation
- **Expo SecureStore** for encrypted storage
- **Expo Notifications** for push notifications
- **AsyncStorage** for offline data persistence

### Key Features

#### 🔐 Authentication & Security
- Secure biometric authentication (Face ID/Touch ID)
- Encrypted credential storage with Expo SecureStore
- JWT token management
- Secure API communication

#### 💊 Medication Management
- Add, edit, and delete medications
- Prescription scanning and OCR
- Drug interaction checking
- Medication history tracking
- Dosage and frequency management

#### ⏰ Smart Reminders
- Customizable medication reminders
- Multiple reminder times per day
- Day-of-week scheduling
- Push notification integration
- Haptic feedback

#### 🏥 Pharmacy Integration
- Find nearby pharmacies
- Pharmacy details and services
- Prescription upload
- Contact integration

#### 🌍 Internationalization
- English (en-ZA) and Afrikaans (af-ZA) support
- Automatic locale detection
- RTL language support ready
- Localized date/time formatting

#### 📊 Healthcare Analytics
- Medication adherence tracking
- Health metrics visualization
- Progress reports
- Data export capabilities

#### 🔔 Notifications
- Medication reminders
- Urgent health alerts
- System notifications
- Quiet hours support
- Customizable notification settings

## 🎨 UI/UX Design

### Design System
- **UI Kitten v5.3.0** with Eva Design System
- **MedGuard SA Brand Colors**:
  - Primary: #2563EB (Blue)
  - Secondary: #10B981 (Green)
  - Warning: #F59E0B (Orange)
  - Danger: #EF4444 (Red)
  - Success: #10B981 (Green)

### Accessibility
- WCAG 2.1 AA compliance
- High contrast mode support
- Screen reader compatibility
- Voice control support
- Large text support

### Responsive Design
- Adaptive layouts for different screen sizes
- Tablet optimization
- Landscape/portrait orientation support

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
API_URL=https://api.medguard-sa.com
WAGTAIL_API_URL=https://api.medguard-sa.com/api/v2

# Expo Configuration
EXPO_PROJECT_ID=66b89b4f-56df-4fd2-a12f-135b3bac185a

# Development
NODE_ENV=development
```

### App Configuration

The `app.json` file contains comprehensive healthcare-specific settings:

- **Permissions**: Camera, microphone, calendar, location, biometrics
- **Plugins**: SecureStore, notifications, calendar, local authentication
- **Platform-specific**: iOS and Android configurations
- **Healthcare features**: Medication reminders, emergency access

## 📱 Platform Support

### iOS
- iOS 13.0+
- iPhone and iPad support
- Face ID/Touch ID integration
- HealthKit integration ready

### Android
- Android 6.0+ (API level 23)
- Biometric authentication
- Background task support
- Adaptive icons

### Web
- Progressive Web App (PWA) support
- Responsive design
- Offline functionality

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Testing Strategy
- Jest for unit testing
- React Native Testing Library
- Detox for E2E testing
- Accessibility testing with axe-core

## 📦 Building & Deployment

### Development Build
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for development
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Production Build
```bash
# Build for production
eas build --profile production --platform android
eas build --profile production --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

## 🔒 Security & Privacy

### Data Protection
- End-to-end encryption for sensitive data
- HIPAA compliance measures
- Secure API communication
- Local data encryption

### Privacy Features
- Biometric authentication
- Secure storage
- Data anonymization options
- Privacy settings management

## 🌐 Internationalization

### Supported Languages
- **English (en-ZA)**: Primary language
- **Afrikaans (af-ZA)**: Secondary language

### Localization Features
- Automatic language detection
- Manual language switching
- Localized date/time formats
- Currency formatting (ZAR)
- RTL support ready

## 📊 Analytics & Monitoring

### Performance Monitoring
- Expo Performance Monitor
- Crash reporting
- User analytics
- Performance metrics

### Health Metrics
- Medication adherence tracking
- Health outcome monitoring
- Usage analytics
- Error tracking

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement changes
3. Add tests
4. Run linting and formatting
5. Submit pull request

### Code Standards
- TypeScript for all new code
- ESLint + Prettier for formatting
- Conventional commits
- Comprehensive testing

## 📚 Documentation

### API Documentation
- REST API integration
- GraphQL support ready
- WebSocket for real-time updates
- Offline-first architecture

### Component Documentation
- Storybook integration
- Component examples
- Props documentation
- Usage guidelines

## 🆘 Support

### Troubleshooting

#### Common Issues
1. **Metro bundler issues**: Run `npm run clean`
2. **TypeScript errors**: Run `npm run type-check`
3. **Linting issues**: Run `npm run lint:fix`
4. **Build failures**: Check EAS build logs

#### Getting Help
- Check Expo documentation
- Review React Native docs
- UI Kitten documentation
- Project issues on GitHub

### Contact
- **Development Team**: dev@medguard-sa.com
- **Support**: support@medguard-sa.com
- **Security**: security@medguard-sa.com

## 📄 License

This project is proprietary software for MedGuard SA. All rights reserved.

---

**MedGuard SA Mobile Team**  
*Building the future of healthcare management*
