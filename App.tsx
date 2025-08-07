import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import * as eva from '@eva-design/eva';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Navigation from '@/navigation';
import { customLightTheme, customDarkTheme } from '@/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { MedicationProvider } from '@/contexts/MedicationContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const App: React.FC = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? customDarkTheme : customLightTheme;

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync({
          'EvaIcons': require('@ui-kitten/eva-icons/fonts/evaicons.ttf'),
        });

        // Pre-load any other resources
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading time
      } catch (e) {
        console.warn('Error loading app resources:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={theme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <LocalizationProvider>
          <AuthProvider>
            <NotificationProvider>
              <MedicationProvider>
                <View style={{ flex: 1 }}>
                  <Navigation />
                </View>
              </MedicationProvider>
            </NotificationProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ApplicationProvider>
    </SafeAreaProvider>
  );
};

export default App;
