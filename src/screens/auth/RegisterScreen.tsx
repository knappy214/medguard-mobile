import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout, Text, Card } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalization } from '@/contexts/LocalizationContext';

const RegisterScreen: React.FC = () => {
  const { t } = useLocalization();

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.layout}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Text category="h1" style={styles.title}>
              {t('auth.registerTitle')}
            </Text>
            <Text category="s1" style={styles.subtitle}>
              {t('auth.registerSubtitle')}
            </Text>
            <Text category="c1" style={styles.placeholder}>
              Registration form coming soon...
            </Text>
          </Card>
        </View>
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  layout: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: { padding: 24 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 32, opacity: 0.7 },
  placeholder: { textAlign: 'center', opacity: 0.5 },
});

export default RegisterScreen;
