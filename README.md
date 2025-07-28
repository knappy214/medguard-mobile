# MedGuard SA - Mobile Medication Tracking App

A comprehensive React Native medication tracking application built with Expo, designed to help users manage their medication schedules, track stock levels, and receive timely reminders.

## Features

### Core Functionality
- **Home Screen**: Today's medication schedule with quick dose marking
- **Medication List**: Complete medication inventory with stock level tracking
- **Add Medication**: Comprehensive form for adding new medications
- **Settings**: App configuration, language selection, and data management
- **Medication Details**: Detailed view and editing of individual medications

### Key Features
- **Push Notifications**: Medication reminders, low stock alerts, and refill reminders
- **Bilingual Support**: English and Afrikaans language support
- **Offline Capability**: Full offline functionality for viewing schedules
- **Stock Management**: Track medication quantities and receive low stock alerts
- **Schedule Generation**: Automatic schedule creation based on frequency and times
- **Data Export/Import**: Backup and restore functionality
- **Accessibility**: Senior-friendly design with large touch targets

## Technology Stack

- **Framework**: React Native with Expo SDK 53
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **State Management**: React Context API
- **Storage**: AsyncStorage for local data persistence
- **Notifications**: Expo Notifications for push and local notifications
- **Internationalization**: i18next with react-i18next
- **Icons**: Expo Vector Icons (Ionicons)
- **UI**: Custom components with React Native StyleSheet

## Project Structure

```
medguard-mobile/
├── App.js                          # Main app entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies and scripts
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── MedicationCard.js      # Medication display card
│   │   ├── ScheduleCard.js        # Schedule display card
│   │   ├── LanguageSelector.js    # Language switching component
│   │   └── StockUpdateModal.js    # Stock update modal
│   ├── contexts/                   # React Context providers
│   │   ├── LanguageContext.js     # Language state management
│   │   ├── MedicationContext.js   # Medication data management
│   │   └── NotificationContext.js # Notification settings
│   ├── screens/                    # App screens
│   │   ├── HomeScreen.js          # Today's schedule
│   │   ├── MedicationListScreen.js # Medication inventory
│   │   ├── AddMedicationScreen.js # Add new medication
│   │   ├── SettingsScreen.js      # App settings
│   │   └── MedicationDetailScreen.js # Medication details
│   ├── services/                   # Business logic services
│   │   ├── storageService.js      # Local storage management
│   │   └── notificationService.js # Notification handling
│   ├── utils/                      # Utility functions
│   │   ├── scheduleUtils.js       # Schedule generation logic
│   │   └── validationUtils.js     # Form validation
│   ├── i18n/                       # Internationalization
│   │   ├── config.js              # i18next configuration
│   │   ├── en.json                # English translations
│   │   └── af.json                # Afrikaans translations
│   └── types/                      # Type definitions
│       └── index.js               # Data type constants
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device (for testing)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medguard-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press 'a' for Android emulator or 'i' for iOS simulator

### Environment Setup

The app uses Expo's managed workflow, so most configuration is handled automatically. However, you may need to:

1. **Configure Push Notifications** (Optional)
   - Set up an Expo account
   - Configure your project ID in `app.json`
   - Set up push notification certificates for production

2. **Build for Production**
   ```bash
   npx expo build:android  # For Android APK
   npx expo build:ios      # For iOS (requires Apple Developer account)
   ```

## Usage

### Adding Medications
1. Navigate to the Medications tab
2. Tap the "+" button to add a new medication
3. Fill in the medication details:
   - Name, dosage, and unit
   - Frequency and times
   - Instructions (optional)
   - Stock level and quantity
4. Save the medication

### Managing Schedules
- View today's schedule on the Home screen
- Mark doses as taken, missed, or skipped
- View upcoming and past schedules
- Receive push notifications for reminders

### Stock Management
- Track medication quantities
- Receive low stock alerts
- Update stock levels through the medication list
- Set refill reminders

### Settings
- Switch between English and Afrikaans
- Configure notification preferences
- Export/import data for backup
- Adjust accessibility settings

## Data Structure

### Medication Object
```javascript
{
  id: string,
  name: string,
  type: 'tablet' | 'liquid' | 'injection' | 'inhaler' | 'other',
  dosage: number,
  unit: string,
  frequency: 'once_daily' | 'twice_daily' | 'three_times_daily' | 'four_times_daily' | 'custom',
  times: string[],
  instructions: string,
  stockLevel: 'low' | 'medium' | 'high',
  stockQuantity: number,
  refillReminder: boolean,
  createdAt: string,
  updatedAt: string
}
```

### Schedule Object
```javascript
{
  id: string,
  medicationId: string,
  scheduledTime: string,
  status: 'upcoming' | 'taken' | 'missed' | 'skipped',
  takenAt: string,
  notes: string
}
```

## API Integration

The app is designed to work offline by default, storing all data locally. For future backend integration:

1. **API Endpoints** (to be implemented):
   - `GET /api/medications` - Fetch medications
   - `POST /api/medications` - Create medication
   - `PUT /api/medications/:id` - Update medication
   - `DELETE /api/medications/:id` - Delete medication
   - `GET /api/schedules` - Fetch schedules
   - `POST /api/schedules/:id/mark-taken` - Mark dose as taken

2. **Sync Strategy**:
   - Implement background sync when online
   - Conflict resolution for offline changes
   - Incremental sync for large datasets

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing Checklist
- [ ] Add new medication
- [ ] Edit existing medication
- [ ] Mark doses as taken/missed/skipped
- [ ] Update stock levels
- [ ] Switch languages
- [ ] Export/import data
- [ ] Push notifications
- [ ] Offline functionality

## Deployment

### Development
```bash
npx expo start
```

### Production Build
```bash
npx expo build:android --release
npx expo build:ios --release
```

### App Store Deployment
1. Build the app using EAS Build
2. Submit to App Store Connect (iOS) or Google Play Console (Android)
3. Configure push notification certificates
4. Set up production environment variables

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### Version 1.0.0
- Initial release
- Core medication tracking functionality
- Push notifications
- Bilingual support (English/Afrikaans)
- Offline capability
- Stock management
- Data export/import

## Roadmap

### Version 1.1.0
- [ ] Cloud sync functionality
- [ ] Family member management
- [ ] Medication interaction warnings
- [ ] Advanced reporting and analytics

### Version 1.2.0
- [ ] Integration with healthcare providers
- [ ] Prescription scanning
- [ ] Medication adherence reports
- [ ] Emergency contact integration

### Version 2.0.0
- [ ] AI-powered medication reminders
- [ ] Voice commands
- [ ] Wearable device integration
- [ ] Telemedicine integration 