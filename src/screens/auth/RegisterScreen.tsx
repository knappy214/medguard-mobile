import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  View,
} from 'react-native';
import {
  Layout,
  Text,
  Card,
  Button,
  Input,
  Icon,
  IconProps,
  Select,
  SelectItem,
  IndexPath,
  Datepicker,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';

const PersonIcon = (props: IconProps) => <Icon {...props} name='person-outline' />;
const EmailIcon = (props: IconProps) => <Icon {...props} name='email-outline' />;
const PasswordIcon = (props: IconProps) => <Icon {...props} name='lock-outline' />;
const PhoneIcon = (props: IconProps) => <Icon {...props} name='phone-outline' />;
const CalendarIcon = (props: IconProps) => <Icon {...props} name='calendar-outline' />;

const RegisterScreen: React.FC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [selectedGender, setSelectedGender] = useState(new IndexPath(0));
  const [loading, setLoading] = useState(false);

  const genderOptions = [
    i18n.t('auth.male'),
    i18n.t('auth.female'),
    i18n.t('auth.other'),
  ];

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert(i18n.t('common.error'), i18n.t('errors.validation_error'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(i18n.t('common.error'), i18n.t('auth.passwords_dont_match'));
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Here you would call your registration API
      // await authService.register({...formData});

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        i18n.t('common.success'),
        i18n.t('auth.register_success'),
        [
          {
            text: i18n.t('common.ok'),
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      console.error('Register error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        i18n.t('common.error'),
        (error as Error)?.message || i18n.t('errors.unknown_error')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="1">
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <Text category="h2" style={styles.title}>
                {i18n.t('auth.register')}
              </Text>
              <Text category="s1" appearance="hint" style={styles.subtitle}>
                {i18n.t('auth.create_account_subtitle')}
              </Text>
            </View>

            <Card style={styles.registerCard}>
              <Input
                placeholder={i18n.t('auth.first_name')}
                value={firstName}
                onChangeText={setFirstName}
                accessoryLeft={PersonIcon}
                style={styles.input}
              />

              <Input
                placeholder={i18n.t('auth.last_name')}
                value={lastName}
                onChangeText={setLastName}
                accessoryLeft={PersonIcon}
                style={styles.input}
              />

              <Input
                placeholder={i18n.t('auth.email')}
                value={email}
                onChangeText={setEmail}
                accessoryLeft={EmailIcon}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <Input
                placeholder={i18n.t('auth.phone_number')}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                accessoryLeft={PhoneIcon}
                keyboardType="phone-pad"
                style={styles.input}
              />

              <Datepicker
                label={i18n.t('auth.date_of_birth')}
                date={dateOfBirth}
                onSelect={setDateOfBirth}
                accessoryLeft={CalendarIcon}
                style={styles.input}
              />

              <Select
                label={i18n.t('auth.gender')}
                selectedIndex={selectedGender}
                onSelect={(index) => setSelectedGender(index as IndexPath)}
                value={genderOptions[selectedGender.row]}
                style={styles.input}
              >
                {genderOptions.map((option, index) => (
                  <SelectItem key={index} title={option} />
                ))}
              </Select>

              <Input
                placeholder={i18n.t('auth.password')}
                value={password}
                onChangeText={setPassword}
                accessoryLeft={PasswordIcon}
                secureTextEntry
                style={styles.input}
              />

              <Input
                placeholder={i18n.t('auth.confirm_password')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                accessoryLeft={PasswordIcon}
                secureTextEntry
                style={styles.input}
              />

              <Button
                style={styles.registerButton}
                size="large"
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? i18n.t('common.loading') : i18n.t('auth.register')}
              </Button>
            </Card>

            <View style={styles.loginContainer}>
              <Text category="s1" appearance="hint">
                {i18n.t('auth.have_account')}
              </Text>
              <Button
                appearance="ghost"
                onPress={() => navigation.navigate('Login')}
              >
                {i18n.t('auth.login')}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    color: MedGuardColors.primary.trustBlue,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  registerCard: {
    marginBottom: Spacing.xl,
  },
  input: {
    marginBottom: Spacing.md,
  },
  registerButton: {
    marginTop: Spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RegisterScreen;
