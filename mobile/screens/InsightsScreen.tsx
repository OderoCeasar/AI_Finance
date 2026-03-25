import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import BottomNav from '@/components/bottom-nav';

const palette = {
  accentGreen: '#4ADE80',
  sidebar: '#1E293B',
  textSecondary: '#64748B',
  textPrimary: '#0F172A',
  cashBlue: '#2563EB',
  mpesaGreen: '#10B981',
  surface: '#F8FAFC',
  card: '#FFFFFF',
};

type ForecastItem = {
  id: string;
  label: string;
  amount: number;
  meta?: string;
  highlight?: boolean;
};

const forecastItems: ForecastItem[] = [
  {
    id: 'current',
    label: 'Current',
    amount: 124580,
    highlight: true,
  },
  {
    id: 'april',
    label: 'April',
    amount: 138200,
    meta: '+11% growth',
  },
  {
    id: 'may',
    label: 'May',
    amount: 152800,
    meta: '+23% growth',
  },
  {
    id: 'june',
    label: 'June',
    amount: 168500,
    meta: '+35% growth',
  },
];

const formatKes = (value: number) => {
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return `KES ${Math.round(value).toLocaleString()}`;
  }
};

export default function InsightsScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Insights</Text>
          <Text style={styles.headerSubtitle}>Personalized recommendations powered by AI</Text>
        </View>

        <LinearGradient
          colors={['#34D399', '#22C55E']}
          style={styles.insightCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.insightHeader}>
            <View style={styles.insightIcon}>
              <Feather name="sparkles" size={18} color={palette.card} />
            </View>
            <View>
              <Text style={styles.insightTitle}>This Month's Insight</Text>
              <Text style={styles.insightSubtitle}>Based on your spending patterns</Text>
            </View>
          </View>

          <Text style={styles.insightBigText}>
            You're on track to save {formatKes(28450)} this month!
          </Text>
          <Text style={styles.insightBody}>
            That's 30% of your income - well above your 25% savings goal.
          </Text>

          <View style={styles.insightDivider} />

          <View style={styles.confidenceRow}>
            <Feather name="cpu" size={16} color={palette.card} />
            <Text style={styles.confidenceText}>AI Confidence: 94%</Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Balance Forecast</Text>
          <View style={styles.aiPill}>
            <Feather name="cpu" size={12} color={palette.accentGreen} />
            <Text style={styles.aiPillText}>AI Powered</Text>
          </View>
        </View>

        <View style={styles.forecastList}>
          {forecastItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.forecastCard,
                item.highlight && styles.forecastCardHighlight,
              ]}
            >
              <View style={styles.forecastInfo}>
                <View style={styles.forecastLabelRow}>
                  <View
                    style={[
                      styles.forecastDot,
                      item.highlight && styles.forecastDotHighlight,
                    ]}
                  />
                  <Text style={styles.forecastLabel}>{item.label}</Text>
                </View>
                {item.meta ? <Text style={styles.forecastMeta}>{item.meta}</Text> : null}
              </View>
              <Text style={styles.forecastAmount}>{formatKes(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.projectedRow}>
          <Feather name="trending-up" size={14} color={palette.accentGreen} />
          <Text style={styles.projectedText}>
            Projected growth:{' '}
            <Text style={styles.projectedHighlight}>+35% by June</Text>
          </Text>
        </View>

        <Text style={styles.sectionTitleSpacing}>Spending Patterns</Text>
        <View style={styles.patternList}>
          <View style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <View style={styles.patternIcon}>
                <Text style={styles.patternEmoji}>📅</Text>
              </View>
              <View style={styles.patternInfo}>
                <Text style={styles.patternTitle}>Weekly Pattern</Text>
                <Text style={styles.patternSubtitle}>
                  You spend 60% more on Fridays
                </Text>
              </View>
            </View>
            <View style={styles.patternPill}>
              <Feather name="zap" size={12} color={palette.accentGreen} />
              <Text style={styles.patternPillText}>Budget extra KES 2,000 for weekends</Text>
            </View>
          </View>

          <View style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <View style={styles.patternIcon}>
                <Text style={styles.patternEmoji}>☕</Text>
              </View>
              <View style={styles.patternInfo}>
                <Text style={styles.patternTitle}>Coffee Habit</Text>
                <Text style={styles.patternSubtitle}>
                  KES 800-1,200 weekly on coffee shops
                </Text>
              </View>
            </View>
            <View style={styles.patternPill}>
              <Feather name="zap" size={12} color={palette.accentGreen} />
              <Text style={styles.patternPillText}>Consider budgeting KES 4,000/month</Text>
            </View>
          </View>

          <View style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <View style={styles.patternIcon}>
                <Text style={styles.patternEmoji}>🚗</Text>
              </View>
              <View style={styles.patternInfo}>
                <Text style={styles.patternTitle}>Transport Savings</Text>
                <Text style={styles.patternSubtitle}>
                  Using matatus saved KES 3,400 vs Uber
                </Text>
              </View>
            </View>
            <View style={styles.patternPill}>
              <Feather name="zap" size={12} color={palette.accentGreen} />
              <Text style={styles.patternPillText}>Keep using public transport</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitleSpacing}>Smart Recommendations</Text>
        <View style={styles.recommendationList}>
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <View style={styles.recommendationIcon}>
                <Feather name="trending-up" size={18} color={palette.accentGreen} />
              </View>
              <View style={styles.recommendationInfo}>
                <Text style={styles.recommendationTitle}>Optimize M-Pesa Balance</Text>
                <Text style={styles.recommendationSubtitle}>
                  Move KES 20,000 to Equity savings for better interest
                </Text>
              </View>
            </View>
            <View style={styles.recommendationFooter}>
              <View style={styles.recommendationPill}>
                <Text style={styles.recommendationPillText}>+KES 300/month</Text>
              </View>
              <Text style={styles.recommendationAction}>Apply</Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <View style={styles.recommendationIconAlt}>
                <Feather name="zap" size={18} color={palette.cashBlue} />
              </View>
              <View style={styles.recommendationInfo}>
                <Text style={styles.recommendationTitle}>Reduce Entertainment</Text>
                <Text style={styles.recommendationSubtitle}>
                  Cut streaming services from 3 to 2
                </Text>
              </View>
            </View>
            <View style={styles.recommendationFooter}>
              <View style={styles.recommendationPill}>
                <Text style={styles.recommendationPillText}>Save KES 1,299/month</Text>
              </View>
              <Text style={styles.recommendationAction}>Apply</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Feather name="calendar" size={16} color={palette.card} />
            <Text style={styles.summaryTitle}>March Summary</Text>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>KES 95K</Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryLabel}>Savings Rate</Text>
              <Text style={styles.summaryValue}>30%</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  insightCard: {
    borderRadius: 22,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.card,
    marginBottom: 4,
  },
  insightSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  insightBigText: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.card,
    marginBottom: 10,
    lineHeight: 28,
  },
  insightBody: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 19,
    marginBottom: 16,
  },
  insightDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: palette.card,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  aiPillText: {
    fontSize: 11,
    color: palette.accentGreen,
    fontWeight: '700',
  },
  forecastList: {
    gap: 12,
  },
  forecastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  forecastCardHighlight: {
    borderColor: 'rgba(37, 99, 235, 0.25)',
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },
  forecastInfo: {
    flex: 1,
  },
  forecastLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  forecastDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.textSecondary,
  },
  forecastDotHighlight: {
    backgroundColor: palette.cashBlue,
  },
  forecastLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  forecastMeta: {
    fontSize: 12,
    color: palette.mpesaGreen,
  },
  forecastAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.cashBlue,
  },
  projectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 22,
  },
  projectedText: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  projectedHighlight: {
    color: palette.accentGreen,
    fontWeight: '700',
  },
  sectionTitleSpacing: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  patternList: {
    gap: 14,
    marginBottom: 24,
  },
  patternCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  patternIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternEmoji: {
    fontSize: 18,
  },
  patternInfo: {
    flex: 1,
  },
  patternTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  patternSubtitle: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  patternPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  patternPillText: {
    fontSize: 12,
    color: palette.accentGreen,
    fontWeight: '600',
    flex: 1,
  },
  recommendationList: {
    gap: 14,
    marginBottom: 18,
  },
  recommendationCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationIconAlt: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  recommendationSubtitle: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  recommendationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommendationPill: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recommendationPillText: {
    fontSize: 11,
    color: palette.accentGreen,
    fontWeight: '700',
  },
  recommendationAction: {
    fontSize: 12,
    color: palette.accentGreen,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#0EA5E9',
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    color: palette.card,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryMetric: {
    flex: 1,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginBottom: 6,
  },
  summaryValue: {
    color: palette.card,
    fontSize: 20,
    fontWeight: '700',
  },
});
