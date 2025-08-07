
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import {
  Layout,
  Text,
  Button,
  Icon,
  IconProps,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MedGuardColors } from '../../theme/colors';
import { Spacing , Typography} from '../../theme/typography';
import i18n from '../../i18n';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const NextIcon = (props: IconProps) => <Icon {...props} name='arrow-forward-outline' />;
const CheckIcon = (props: IconProps) => <Icon {...props} name='checkmark-outline' />;

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
}

const OnboardingScreen: React.FC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      title: i18n.t('onboarding.welcome_title'),
      subtitle: 'MedGuard SA',
      description: i18n.t('onboarding.welcome_description'),
      icon: 'heart',
      color: MedGuardColors.primary.trustBlue,
    },
    {
      id: '2',
      title: i18n.t('onboarding.medication_management_title'),
      subtitle: i18n.t('onboarding.medication_management_subtitle'),
      description: i18n.t('onboarding.medication_management_description'),
      icon: 'activity',
      color: MedGuardColors.primary.healingGreen,
    },
    {
      id: '3',
      title: i18n.t('onboarding.smart_reminders_title'),
      subtitle: i18n.t('onboarding.smart_reminders_subtitle'),
      description: i18n.t('onboarding.smart_reminders_description'),
      icon: 'bell',
      color: MedGuardColors.alerts.infoBlue,
    },
    {
      id: '4',
      title: i18n.t('onboarding.prescription_scanner_title'),
      subtitle: i18n.t('onboarding.prescription_scanner_subtitle'),
      description: i18n.t('onboarding.prescription_scanner_description'),
      icon: 'camera',
      color: MedGuardColors.alerts.warningAmber,
    },
    {
      id: '5',
      title: i18n.t('onboarding.privacy_security_title'),
      subtitle: i18n.t('onboarding.privacy_security_subtitle'),
      description: i18n.t('onboarding.privacy_security_description'),
      icon: 'shield',
      color: MedGuardColors.primary.trustBlue,
    },
  ];

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      completeOnboarding();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const completeOnboarding = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Store onboarding completion status
    // AsyncStorage.setItem('onboarding_completed', 'true');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { backgroundColor: item.color + '10' }]}>
      <View style={styles.slideContent}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
          <Icon
            name={item.icon}
            style={styles.slideIcon}
            fill={MedGuardColors.primary.cleanWhite}
          />
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text category="h1" style={[styles.slideTitle, { color: item.color }]}>
            {item.title}
          </Text>
          
          <Text category="h6" style={styles.slideSubtitle}>
            {item.subtitle}
          </Text>
          
          <Text category="s1" style={styles.slideDescription}>
            {item.description}
          </Text>
        </View>

        {/* South African Healthcare Context */}
        {item.id === '1' && (
          <View style={styles.contextContainer}>
            <Text category="caption1" style={styles.contextText}>
              🇿🇦 {i18n.t('onboarding.south_africa_context')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor:
                index === currentIndex
                  ? slides[currentIndex]?.color || MedGuardColors.primary.trustBlue
                  : MedGuardColors.extended.lightGray,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="1">
      {/* Skip Button */}
      <View style={styles.header}>
        <Button
          appearance="ghost"
          size="small"
          onPress={skipOnboarding}
        >
          {i18n.t('common.skip')}
        </Button>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          viewAreaCoveragePercentThreshold: 50,
        }}
      />

      {/* Navigation */}
      <View style={[styles.navigation, { paddingBottom: insets.bottom }]}>
        {/* Pagination */}
        {renderPagination()}

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {currentIndex > 0 && (
            <Button
              appearance="ghost"
              onPress={goToPrevious}
            >
              {i18n.t('common.previous')}
            </Button>
          )}

          <View style={styles.spacer} />

          <Button
            style={[
              styles.nextButton,
              { backgroundColor: slides[currentIndex]?.color || MedGuardColors.primary.trustBlue },
            ]}
            accessoryRight={
              currentIndex === slides.length - 1 ? CheckIcon : NextIcon
            }
            onPress={goToNext}
          >
            {currentIndex === slides.length - 1
              ? i18n.t('onboarding.get_started')
              : i18n.t('common.next')
            }
          </Button>
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  slide: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    maxWidth: screenWidth * 0.8,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  slideIcon: {
    width: 64,
    height: 64,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: 'bold',
  },
  slideSubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: MedGuardColors.text.secondary,
  },
  slideDescription: {
    textAlign: 'center',
    lineHeight: 24,
    color: MedGuardColors.text.secondary,
  },
  contextContainer: {
    backgroundColor: MedGuardColors.extended.lightGray,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.lg,
  },
  contextText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  navigation: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    minWidth: 120,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default OnboardingScreen;
