# MedGuard Mobile - Enhanced Internationalization (i18n)

This document describes the comprehensive internationalization implementation for the MedGuard mobile application, built with React Native, Expo, and i18next.

## 🚀 Features

### ✅ Implemented Features

- **i18next Integration**: Full i18next v25.3.2 integration with react-i18next v15.6.1
- **Expo Localization**: Device language detection using expo-localization
- **AsyncStorage Persistence**: Language preferences saved to device storage
- **Dual Language Support**: English (en) and Afrikaans (af) with medical terminology
- **Pluralization Rules**: Proper pluralization for both languages
- **Medical Terminology**: Comprehensive medical terms in both languages
- **Language Switching**: Real-time language switching with persistence
- **Device Language Detection**: Automatic detection of device language
- **Loading States**: Proper loading states during i18n initialization
- **Error Handling**: Comprehensive error handling and fallbacks
- **Debug Support**: Development mode debugging for missing translations

## 📁 File Structure

```
medguard-mobile/
├── src/
│   ├── i18n/
│   │   ├── config.js          # Enhanced i18n configuration
│   │   ├── en.json           # English translations
│   │   └── af.json           # Afrikaans translations
│   ├── contexts/
│   │   └── LanguageContext.js # Enhanced language context
│   └── components/
│       └── LanguageSelector.js # Enhanced language selector
└── App.js                     # Updated main app with i18n
```

## 🔧 Configuration

### i18n Configuration (`src/i18n/config.js`)

The enhanced configuration includes:

```javascript
// Key features:
- Device language detection with expo-localization
- AsyncStorage persistence for language preferences
- Proper pluralization rules for English and Afrikaans
- Development mode debugging
- Missing key handling
- Comprehensive error handling
- Language validation and fallbacks
```

### Pluralization Rules

Both English and Afrikaans use similar pluralization patterns:

```javascript
// English pluralization
{
  numbers: [1, 2],
  plurals: (n) => {
    if (n === 1) return 0;  // singular
    return 1;               // plural
  }
}

// Usage examples:
t('home.medicationCount', { count: 1 })  // "1 medication"
t('home.medicationCount', { count: 5 })  // "5 medications"
```

## 📚 Translation Structure

### English (`src/i18n/en.json`)

Comprehensive translation file with:

- **Common UI Elements**: Buttons, labels, messages
- **Navigation**: Screen titles and navigation elements
- **Medical Terminology**: Prescriptions, medications, instructions
- **Pluralization Examples**: Count-based translations
- **Error Messages**: User-friendly error handling
- **Success Messages**: Confirmation and success feedback

### Afrikaans (`src/i18n/af.json`)

Complete Afrikaans translation with:

- **Medical Terms**: Proper Afrikaans medical terminology
- **Cultural Adaptation**: Contextually appropriate translations
- **Pluralization**: Afrikaans-specific plural forms
- **Formal/Informal Balance**: Appropriate tone for medical context

## 🎯 Usage Examples

### Basic Translation

```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <Text>{t('common.save')}</Text>
  );
};
```

### Pluralization

```javascript
const { t } = useTranslation();

// Medication count
<Text>{t('home.medicationCount', { count: 1 })}</Text>  // "1 medication"
<Text>{t('home.medicationCount', { count: 5 })}</Text>  // "5 medications"

// Dose count
<Text>{t('home.doseCount', { count: 1 })}</Text>        // "1 dose"
<Text>{t('home.doseCount', { count: 3 })}</Text>        // "3 doses"
```

### Interpolation

```javascript
const { t } = useTranslation();

// With variables
<Text>{t('notifications.reminderMessage', { medication: 'Aspirin' })}</Text>
// "Time to take Aspirin"

// With multiple variables
<Text>{t('alerts.markAsTakenMessage', { 
  medication: 'Insulin', 
  time: 'morning' 
})}</Text>
// "Mark Insulin as taken for morning?"
```

## 🔄 Language Context

### Enhanced LanguageContext Features

```javascript
const {
  currentLanguage,           // Current language code
  changeLanguage,           // Change language function
  toggleLanguage,           // Toggle between languages
  isLoading,               // Loading state
  isInitialized,           // Initialization state
  getLanguages,            // Get available languages
  isLanguageSupported,     // Check language support
  getLanguageDisplayName,  // Get language display name
  resetToDeviceLanguage,   // Reset to device language
} = useLanguage();
```

### Language Switching

```javascript
const { changeLanguage, toggleLanguage } = useLanguage();

// Change to specific language
await changeLanguage('af');

// Toggle between languages
await toggleLanguage();

// Reset to device language
await resetToDeviceLanguage();
```

## 🏥 Medical Terminology

### Comprehensive Medical Terms

The translation files include extensive medical terminology:

**English:**
- Prescription, Over the Counter, Supplement
- Antibiotic, Painkiller, Blood Pressure
- Diabetes, Heart, Cholesterol, Asthma
- Side Effects, Contraindications, Interactions
- Dosage Instructions, Take with food, Avoid alcohol

**Afrikaans:**
- Voorskrif, Sonder Voorskrif, Aanvulling
- Antibiotikum, Pynstiller, Bloeddruk
- Diabetes, Hart, Cholesterol, Asma
- Newe-effekte, Kontra-indikasies, Geneesmiddel Interaksies
- Dosis Instruksies, Neem met kos, Vermy alkohol

## 🎨 Language Selector Component

### Enhanced Features

The `LanguageSelector` component demonstrates:

- **Current Language Display**: Shows active language
- **Language Switching**: Easy language selection
- **Toggle Function**: Quick language toggle
- **Device Reset**: Reset to device language
- **Information Panel**: Shows language details
- **Pluralization Examples**: Live examples of pluralization
- **Medical Terms Display**: Shows medical terminology
- **Error Handling**: Proper error messages

### Usage

```javascript
import LanguageSelector from '../components/LanguageSelector';

// In your settings screen
<LanguageSelector />
```

## 🔧 Setup and Installation

### Dependencies

All required dependencies are already installed:

```json
{
  "i18next": "^25.3.2",
  "react-i18next": "^15.6.1",
  "expo-localization": "~16.1.6",
  "@react-native-async-storage/async-storage": "2.1.2"
}
```

### Initialization

The i18n system is automatically initialized in `App.js`:

```javascript
// App.js automatically handles:
- i18n initialization
- Device language detection
- AsyncStorage loading
- Loading states
- Error handling
```

## 🚀 Best Practices

### 1. Translation Keys

Use hierarchical key structure:

```javascript
// Good
t('medications.title')
t('medicationForm.name')
t('notifications.medicationReminder')

// Avoid
t('medication_title')
t('form_name')
```

### 2. Pluralization

Always use count-based pluralization:

```javascript
// Good
t('home.medicationCount', { count: 1 })
t('home.medicationCount', { count: 5 })

// Avoid
t('home.medicationCount.single')
t('home.medicationCount.multiple')
```

### 3. Interpolation

Use meaningful variable names:

```javascript
// Good
t('notifications.reminderMessage', { medication: 'Aspirin' })

// Avoid
t('notifications.reminderMessage', { name: 'Aspirin' })
```

### 4. Error Handling

Always provide fallbacks:

```javascript
// Good
t('common.save', 'Save')
t('errors.general', 'Something went wrong')

// Avoid
t('common.save') // No fallback
```

## 🐛 Debugging

### Development Mode

In development, missing keys are logged:

```javascript
// Missing key warnings
console.warn(`Missing translation key: ${key} for language: ${lng}`);
```

### Debug Configuration

```javascript
// Enable debug mode in development
debug: __DEV__,
```

## 📱 Device Language Detection

### Supported Languages

- **English (en)**: Default fallback
- **Afrikaans (af)**: Full support

### Detection Logic

1. Check AsyncStorage for saved preference
2. Fall back to device language detection
3. Validate against supported languages
4. Default to English if unsupported

## 🔄 Persistence

### AsyncStorage Keys

```javascript
'@medguard_language' // Language preference
```

### Persistence Flow

1. Language change → i18n update → AsyncStorage save
2. App restart → AsyncStorage load → i18n restore
3. Device language reset → AsyncStorage clear → reinitialize

## 🎯 Testing

### Manual Testing

1. **Language Switching**: Test all language switches
2. **Persistence**: Restart app, verify language persists
3. **Device Language**: Test device language detection
4. **Pluralization**: Test count-based translations
5. **Medical Terms**: Verify medical terminology accuracy

### Test Cases

```javascript
// Test pluralization
expect(t('home.medicationCount', { count: 1 })).toBe('1 medication');
expect(t('home.medicationCount', { count: 5 })).toBe('5 medications');

// Test interpolation
expect(t('notifications.reminderMessage', { medication: 'Test' }))
  .toBe('Time to take Test');

// Test language switching
await changeLanguage('af');
expect(getCurrentLanguage()).toBe('af');
```

## 🔮 Future Enhancements

### Potential Improvements

1. **Dynamic Loading**: Load translations on-demand
2. **RTL Support**: Right-to-left language support
3. **Voice Commands**: Voice-based language switching
4. **Translation Management**: Backend translation management
5. **Auto-Translation**: Automatic translation for missing keys
6. **Cultural Adaptation**: Region-specific adaptations

### Scalability

The current implementation is designed to scale:

- **Modular Structure**: Easy to add new languages
- **Pluralization Rules**: Extensible pluralization system
- **Medical Terminology**: Expandable medical terms
- **Context Support**: Ready for context-based translations

## 📄 License

This implementation follows the project's existing license and coding standards.

## 🤝 Contributing

When adding new translations:

1. Add keys to both `en.json` and `af.json`
2. Include pluralization forms where appropriate
3. Test with both languages
4. Update this documentation if needed
5. Follow the established naming conventions

---

**Note**: This enhanced internationalization system provides a robust foundation for multilingual medical applications, with particular attention to accessibility, accuracy, and user experience for elderly users. 