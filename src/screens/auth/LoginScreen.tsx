import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Layout,
  Text,
  Card,
  Button,
  Input,
  Icon,
  IconProps,
  Toggle,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import authService from '../../services/authService';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';

const EmailIcon = (props: IconProps) => <Icon {...props} name='email-outline' />;
const PasswordIcon = (props: IconProps) => <Icon {...props} name='lock-outline' />;
const EyeIcon = (props: IconProps) => <Icon {...props} name='eye-outline' />;
const EyeOffIcon = (props: IconProps) => <Icon {...props} name='eye-off-outline' />;
const FingerprintIcon = (props: IconProps) => <Icon {...props} name='finger-print-outline' />;

const LoginScreen: React.FC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(i18n.t('common.error'), i18n.t('errors.validation_error'));
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      await authService.login(email, password);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Login error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        i18n.t('common.error'),
        (error as Error)?.message || i18n.t('auth.login_error')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await authService.loginWithBiometrics();
      if (result) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      Alert.alert(
        i18n.t('common.error'),
        (error as Error)?.message || i18n.t('auth.biometric_not_available')
      );
    }
  };

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="1">
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text category="h1" style={styles.title}>
              MedGuard SA
            </Text>
            <Text category="s1" appearance="hint" style={styles.subtitle}>
              {i18n.t('auth.login_subtitle')}
            </Text>
          </View>

          <Card style={styles.loginCard}>
            <Input
              placeholder={i18n.t('auth.email')}
              value={email}
              onChangeText={setEmail}
              accessoryLeft={EmailIcon}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
            />

            <Input
              placeholder={i18n.t('auth.password')}
              value={password}
              onChangeText={setPassword}
              accessoryLeft={PasswordIcon}
              accessoryRight={() => (
                <Icon
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                />
              )}
              secureTextEntry={!passwordVisible}
              autoComplete="password"
              style={styles.input}
            />

            <View style={styles.optionsRow}>
              <View style={styles.toggleContainer}>
                <Toggle
                  checked={rememberMe}
                  onChange={setRememberMe}
                />
                <Text category="s1" style={styles.toggleText}>
                  {i18n.t('auth.remember_me')}
                </Text>
              </View>
              <Button
                appearance="ghost"
                size="tiny"
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                {i18n.t('auth.forgot_password')}
              </Button>
            </View>

            <Button
              style={styles.loginButton}
              size="large"
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? i18n.t('common.loading') : i18n.t('auth.login')}
            </Button>

            <Button
              style={styles.biometricButton}
              appearance="outline"
              accessoryLeft={FingerprintIcon}
              onPress={handleBiometricLogin}
            >
              {i18n.t('auth.biometric_login')}
            </Button>
          </Card>

          <View style={styles.registerContainer}>
            <Text category="s1" appearance="hint">
              {i18n.t('auth.no_account')}
            </Text>
            <Button
              appearance="ghost"
              onPress={() => navigation.navigate('Register')}
            >
              {i18n.t('auth.register')}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  title: {
    color: MedGuardColors.primary.trustBlue,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  loginCard: {
    marginBottom: Spacing.xl,
  },
  input: {
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    marginLeft: Spacing.sm,
  },
  loginButton: {
    marginBottom: Spacing.md,
  },
  biometricButton: {
    marginBottom: Spacing.md,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoginScreen;
