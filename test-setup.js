#!/usr/bin/env node

/**
 * Test script to verify MedGuard mobile app setup
 * Run with: node test-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 MedGuard Mobile App Setup Verification\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'app.json',
  'App.js',
  'src/types/index.js',
  'src/i18n/config.js',
  'src/i18n/en.json',
  'src/i18n/af.json',
  'src/contexts/LanguageContext.js',
  'src/contexts/MedicationContext.js',
  'src/contexts/NotificationContext.js',
  'src/utils/scheduleUtils.js',
  'src/utils/validationUtils.js',
  'src/services/storageService.js',
  'src/services/notificationService.js',
  'src/screens/HomeScreen.js',
  'src/screens/MedicationListScreen.js',
  'src/screens/AddMedicationScreen.js',
  'src/screens/SettingsScreen.js',
  'src/screens/MedicationDetailScreen.js',
  'src/components/MedicationCard.js',
  'src/components/ScheduleCard.js',
  'src/components/LanguageSelector.js',
  'src/components/StockUpdateModal.js',
  'README.md'
];

console.log('📁 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

// Check package.json dependencies
console.log('\n📦 Checking package.json dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'expo',
    'react-native',
    'react',
    '@react-navigation/native',
    '@react-navigation/bottom-tabs',
    '@react-navigation/native-stack',
    'expo-notifications',
    'expo-device',
    'expo-constants',
    'expo-localization',
    'i18next',
    'react-i18next',
    '@react-native-async-storage/async-storage',
    'react-native-safe-area-context',
    'react-native-screens',
    '@expo/vector-icons'
  ];

  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length === 0) {
    console.log('✅ All required dependencies found');
  } else {
    console.log('❌ Missing dependencies:');
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check app.json configuration
console.log('\n⚙️ Checking app.json configuration...');
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  
  if (appJson.expo.name === 'MedGuard SA') {
    console.log('✅ App name configured correctly');
  } else {
    console.log('❌ App name should be "MedGuard SA"');
  }

  if (appJson.expo.plugins && appJson.expo.plugins.includes('expo-notifications')) {
    console.log('✅ Notifications plugin configured');
  } else {
    console.log('❌ Notifications plugin missing');
  }

  if (appJson.expo.plugins && appJson.expo.plugins.includes('expo-localization')) {
    console.log('✅ Localization plugin configured');
  } else {
    console.log('❌ Localization plugin missing');
  }
} catch (error) {
  console.log('❌ Error reading app.json:', error.message);
}

// Check directory structure
console.log('\n📂 Checking directory structure...');
const requiredDirs = [
  'src',
  'src/components',
  'src/contexts',
  'src/screens',
  'src/services',
  'src/utils',
  'src/i18n',
  'src/types'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ - MISSING`);
  }
});

// Summary
console.log('\n📊 Summary:');
if (missingFiles.length === 0) {
  console.log('✅ All required files are present');
} else {
  console.log(`❌ ${missingFiles.length} files are missing`);
  console.log('Missing files:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n🚀 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npx expo start');
console.log('3. Scan QR code with Expo Go app');
console.log('4. Test the app functionality');

console.log('\n📚 For more information, see README.md'); 