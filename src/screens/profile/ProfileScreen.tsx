import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import {
  Layout,
  Text,
  Card,
  Button,
  Avatar,
  Icon,
  IconProps,
  Input,
  Select,
  SelectItem,
  Toggle,
  TopNavigation,
  TopNavigationAction,
  Divider,
  Spinner,
  IndexPath,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import authService from '../../services/authService';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';

const EditIcon = (props: IconProps) => <Icon {...props} name='edit-outline' />;
const LogoutIcon = (props: IconProps) => <Icon {...props} name='log-out-outline' />;

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  language: 'en' | 'af';
  timezone: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

const ProfileScreen: React.FC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('No user found');
      }
      setProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: (user as any).phone || '',
        dateOfBirth: (user as any).dateOfBirth || '',
        gender: (user as any).gender || 'other',
        language: user.preferredLanguage,
        timezone: (user as any).timezone || 'Africa/Johannesburg',
        emailNotifications: (user as any).emailNotifications ?? true,
        smsNotifications: (user as any).smsNotifications ?? true,
      });
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToSettings = () => navigation.navigate('Settings');
  const logout = async () => {
    try {
      await authService.logout();
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading || !profile) {
    return (
      <Layout style={[styles.container, { paddingTop: insets.top }]}>
        <Spinner size="giant" />
      </Layout>
    );
  }

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="2">
      <TopNavigation
        title={i18n.t('profile.title')}
        alignment="center"
        accessoryRight={() => (
          <TopNavigationAction icon={LogoutIcon} onPress={logout} />
        )}
      />
      <ScrollView style={styles.scroll}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              size="giant"
              source={require('../../assets/images/default-avatar.png')}
            />
            <View style={styles.profileNameContainer}>
              <Text category="h5">
                {profile.firstName} {profile.lastName}
              </Text>
              <Text appearance="hint">{profile.email}</Text>
            </View>
            <Button
              appearance="ghost"
              accessoryLeft={EditIcon}
              onPress={navigateToSettings}
            />
          </View>
          
          <Divider style={styles.divider} />

          <View style={styles.profileRow}>
            <Text category="s2">{i18n.t('profile.phone_number')}:</Text>
            <Text category="s1">{profile.phone}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text category="s2">{i18n.t('profile.date_of_birth')}:</Text>
            <Text category="s1">
              {i18n.formatDate(new Date(profile.dateOfBirth), 'long')}
            </Text>
          </View>
          <View style={styles.profileRow}>
            <Text category="s2">{i18n.t('profile.gender')}:</Text>
            <Text category="s1">{i18n.t(`auth.${profile.gender}`)}</Text>
          </View>
        </Card>

        {/* Preferences */}
        <Card style={styles.card}>
          <Text category="h6">{i18n.t('profile.preferences')}</Text>
          <Divider style={styles.divider} />

          <Toggle
            checked={profile.emailNotifications}
            onChange={value => setProfile({ ...profile, emailNotifications: value })}
          >
            {i18n.t('profile.email_notifications')}
          </Toggle>
          <Toggle
            checked={profile.smsNotifications}
            onChange={value => setProfile({ ...profile, smsNotifications: value })}
          >
            {i18n.t('profile.sms_notifications')}
          </Toggle>

          {/* Language Selection */}
          <View style={styles.selectRow}>
            <Text category="s2">{i18n.t('profile.language')}:</Text>
            <Select
              selectedIndex={new IndexPath(
                profile.language === 'af' ? 1 : 0
              )}
              onSelect={index => {
                const indexPath = index as IndexPath;
                const code = indexPath.row === 1 ? 'af' : 'en';
                setProfile({ ...profile, language: code });
                i18n.setLanguage(code);
              }}
            >
              {i18n.getAvailableLanguages().map(({ code, name }, idx) => (
                <SelectItem key={code} title={name} />
              ))}
            </Select>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button status="primary" onPress={navigateToSettings}>
            {i18n.t('common.settings')}
          </Button>
          <Button status="basic" onPress={logout}>
            {i18n.t('auth.logout')}
          </Button>
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md },
  profileCard: { marginBottom: Spacing.md },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileNameContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  divider: {
    marginVertical: Spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  selectRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: { marginBottom: Spacing.md },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.lg,
  },
});

export default ProfileScreen;
