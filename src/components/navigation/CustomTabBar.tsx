import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomNavigation, BottomNavigationTab, Icon } from '@ui-kitten/components';
import { useLocalization } from '@/contexts/LocalizationContext';

const CustomTabBar: React.FC<BottomTabBarProps> = ({ navigation, state }) => {
  const { t } = useLocalization();

  const onSelect = (index: number) => {
    navigation.navigate(state.routeNames[index]);
  };

  return (
    <BottomNavigation
      selectedIndex={state.index}
      onSelect={onSelect}
      style={styles.bottomNavigation}
    >
      <BottomNavigationTab
        title={t('navigation.dashboard')}
        icon={(props) => <Icon {...props} name="home-outline" />}
      />
      <BottomNavigationTab
        title={t('navigation.medications')}
        icon={(props) => <Icon {...props} name="pills-outline" />}
      />
      <BottomNavigationTab
        title={t('navigation.reminders')}
        icon={(props) => <Icon {...props} name="clock-outline" />}
      />
      <BottomNavigationTab
        title={t('navigation.pharmacy')}
        icon={(props) => <Icon {...props} name="map-outline" />}
      />
      <BottomNavigationTab
        title={t('navigation.profile')}
        icon={(props) => <Icon {...props} name="person-outline" />}
      />
    </BottomNavigation>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    paddingBottom: 8,
    paddingTop: 8,
  },
});

export default CustomTabBar;
