import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Layout, Text, Card, Spinner, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryPie, VictoryLine, VictoryAxis } from 'victory';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import apiService from '../../services/apiService';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';
import { format, subDays } from 'date-fns';
import medicalAnalyticsService from '../../services/analyticsService';
import { enZA, af } from 'date-fns/locale';

const screenWidth = Dimensions.get('window').width;

interface AdherenceDataPoint {
  date: string;
  adherence: number;
}

const AnalyticsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState<AdherenceDataPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<AdherenceDataPoint[]>([]);
  const [overallAdherence, setOverallAdherence] = useState<number>(0);

  const locale = i18n.getCurrentLanguage() === 'af' ? af : enZA;

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Compute from local analytics data
      const report = await medicalAnalyticsService.generateAdherenceReport();
      setOverallAdherence(Math.round(report.overallAdherence));

      // Build simple weekly/monthly arrays from last 7/30 days of events
      const today = new Date();
      const events = await (medicalAnalyticsService as any).getAdherenceData?.();
      const last7: AdherenceDataPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayKey = format(date, 'yyyy-MM-dd');
        const dayEvents = (events || []).filter((e: any) => (e.timestamp || '').slice(0, 10) === dayKey);
        const avg = dayEvents.length
          ? Math.round(dayEvents.reduce((s: number, e: any) => s + e.adherenceRate, 0) / dayEvents.length)
          : 0;
        last7.push({ date: format(date, 'EEE', { locale }), adherence: avg });
      }
      setWeeklyData(last7);

      const last30: AdherenceDataPoint[] = [];
      for (let i = 29; i >= 0; i -= 2) {
        const date = subDays(today, i);
        const dayKey = format(date, 'yyyy-MM-dd');
        const dayEvents = (events || []).filter((e: any) => (e.timestamp || '').slice(0, 10) === dayKey);
        const avg = dayEvents.length
          ? Math.round(dayEvents.reduce((s: number, e: any) => s + e.adherenceRate, 0) / dayEvents.length)
          : 0;
        last30.push({ date: format(date, 'd', { locale }), adherence: avg });
      }
      setMonthlyData(last30);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (loading) {
    return (
      <Layout style={[styles.container, { paddingTop: insets.top }]}>
        <Spinner size="giant" />
        <Text>{i18n.t('common.loading')}</Text>
      </Layout>
    );
  }

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="2">
      <TopNavigation title={i18n.t('analytics.title')} alignment="center" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overall Adherence */}
        <Card style={styles.card}>
          <Text category="h6" style={styles.sectionTitle}>
            {i18n.t('analytics.adherence_rate')}
          </Text>
          <VictoryPie
            data={[{ x: 1, y: overallAdherence }, { x: 2, y: 100 - overallAdherence }]}
            innerRadius={60}
            labels={({ datum }: { datum: { x: number; y: number } }) => (datum.x === 1 ? `${overallAdherence}%` : '')}
            colorScale={[MedGuardColors.primary.trustBlue, MedGuardColors.extended.lightGray]}
            width={screenWidth - Spacing.lg}
            height={200}
          />
          <Text category="s1" style={styles.chartCaption}>
            {i18n.t('analytics.adherence_trend')}
          </Text>
        </Card>

        {/* Weekly Adherence Chart */}
        <Card style={styles.card}>
          <Text category="h6" style={styles.sectionTitle}>
            {i18n.t('this_week')}
          </Text>
          <VictoryChart
            theme={VictoryTheme.material}
            domainPadding={20}
            width={screenWidth - Spacing.lg}
            height={220}
          >
            <VictoryAxis />
            <VictoryAxis dependentAxis tickFormat={(t: number) => `${t}%`} />
            <VictoryBar
              data={weeklyData}
              x="date"
              y="adherence"
              style={{ data: { fill: MedGuardColors.primary.healingGreen } }}
            />
          </VictoryChart>
        </Card>

        {/* Monthly Adherence Chart */}
        <Card style={styles.card}>
          <Text category="h6" style={styles.sectionTitle}>
            {i18n.t('this_month')}
          </Text>
          <VictoryChart
            theme={VictoryTheme.material}
            domainPadding={10}
            width={screenWidth - Spacing.lg}
            height={220}
          >
            <VictoryAxis tickCount={5} />
            <VictoryAxis dependentAxis tickFormat={(t: number) => `${t}%`} />
            <VictoryLine
              data={monthlyData}
              x="date"
              y="adherence"
              style={{ data: { stroke: MedGuardColors.primary.trustBlue, strokeWidth: 3 } }}
            />
          </VictoryChart>
        </Card>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
  card: { marginBottom: Spacing.md },
  sectionTitle: { marginBottom: Spacing.sm, color: MedGuardColors.primary.trustBlue },
  chartCaption: { textAlign: 'center', marginTop: Spacing.sm, color: MedGuardColors.extended.mediumGray },
});

export default AnalyticsScreen;
