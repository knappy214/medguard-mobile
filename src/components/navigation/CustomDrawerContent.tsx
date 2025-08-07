import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Layout, Text, Avatar, Divider } from '@ui-kitten/components';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, logout } = useAuth();
  const { t } = useLocalization();

  const handleLogout = async () => {
    await logout();
    // Navigation will be handled by the auth state change
  };

  return (
    <Layout style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.userSection}>
          <Avatar
            style={styles.avatar}
            source={require('@/assets/images/default-avatar.png')}
          />
          <Text category="h6" style={styles.userName}>
            {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
          </Text>
          <Text category="c1" style={styles.userEmail}>
            {user?.email || 'guest@example.com'}
          </Text>
        </View>

        <Divider style={styles.divider} />

        <DrawerItem
          label={t('navigation.dashboard')}
          onPress={() => props.navigation.navigate('Main')}
          icon={() => null}
        />

        <DrawerItem
          label={t('navigation.emergencyAccess')}
          onPress={() => props.navigation.navigate('EmergencyAccess')}
          icon={() => null}
        />

        <DrawerItem
          label={t('navigation.healthcareAnalytics')}
          onPress={() => props.navigation.navigate('HealthcareAnalytics')}
          icon={() => null}
        />

        <DrawerItem
          label={t('navigation.privacySettings')}
          onPress={() => props.navigation.navigate('PrivacySettings')}
          icon={() => null}
        />

        <Divider style={styles.divider} />

        <DrawerItem
          label={t('navigation.support')}
          onPress={() => props.navigation.navigate('Support')}
          icon={() => null}
        />

        <DrawerItem
          label={t('navigation.about')}
          onPress={() => props.navigation.navigate('About')}
          icon={() => null}
        />

        <Divider style={styles.divider} />

        <DrawerItem
          label={t('common.logout')}
          onPress={handleLogout}
          icon={() => null}
        />
      </DrawerContentScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userSection: {
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  userName: {
    marginBottom: 4,
  },
  userEmail: {
    opacity: 0.7,
  },
  divider: {
    marginVertical: 8,
  },
});

export default CustomDrawerContent;
