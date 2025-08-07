import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Layout,
  Text,
  Input,
  Button,
  Card,
  useTheme,
} from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const theme = useTheme();
  const { login } = useAuth();
  const { t } = useLocalization();

  const handleLogin = async () => {
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        console.log('Login successful');
      } else {
        console.log('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.layout}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Text category="h1" style={styles.title}>
              {t('auth.welcome')}
            </Text>
            <Text category="s1" style={styles.subtitle}>
              {t('auth.loginSubtitle')}
            </Text>
            
            <Input
              label={t('common.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Input
              label={t('common.password')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
            />
            
            <Button
              onPress={handleLogin}
              disabled={isLoading || !email || !password}
              style={styles.button}
            >
              {isLoading ? t('common.loading') : t('auth.loginButton')}
            </Button>
            
            <Text category="c1" style={styles.helpText}>
              {t('auth.alreadyHaveAccount')}
            </Text>
          </Card>
        </View>
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layout: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  helpText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default LoginScreen;
