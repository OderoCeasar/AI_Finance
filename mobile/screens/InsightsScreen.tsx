import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import BottomNav from '@/components/bottom-nav';
import { ApiResult, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

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

type DashboardSummary = {
  income: number | string;
  expenses: number | string;
  savings: number | string;
  savings_rate: number | string;
  top_categories?: Array<{ category: string; total: number | string }>;
};

type Prediction = {
  id: number;
  predicted_expense: number | string;
  month: string;
};

type Recommendation = {
  id: number;
  message: string;
  priority: 'high' | 'medium' | 'low';
};

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const priorityScore: Record<Recommendation['priority'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

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
  const { tokens, refreshAccessToken } = useAuth();
  const accessToken = tokens?.access;
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setSummary(null);
      setPrediction(null);
      setRecommendations([]);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;

    const fetchWithRefresh = async <T,>(fetcher: (token: string) => Promise<ApiResult<T>>) => {
      let result = await fetcher(accessToken);
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await fetcher(newToken);
        }
      }
      return result;
    };

    const loadInsights = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const summaryRes = await fetchWithRefresh((token) =>
          api.get<DashboardSummary>('analytics/dashboard/', token),
        );
        if (isMounted && summaryRes.ok && summaryRes.data) {
          setSummary(summaryRes.data);
        }

        let predictionData: Prediction | null = null;
        const latestRes = await fetchWithRefresh((token) =>
          api.get<Prediction>('predictions/latest/', token),
        );
        if (latestRes.ok && latestRes.data) {
          predictionData = latestRes.data;
        } else if (latestRes.status === 404) {
          const forecastRes = await fetchWithRefresh((token) =>
            api.post<Prediction>('predictions/forecast/', {}, token),
          );
          if (forecastRes.ok && forecastRes.data) {
            predictionData = forecastRes.data;
          }
        }
        if (isMounted) {
          setPrediction(predictionData);
        }

        let recs: Recommendation[] = [];
        const listRes = await fetchWithRefresh((token) =>
          api.get<Recommendation[]>('recommendations/', token),
        );
        if (listRes.ok && Array.isArray(listRes.data) && listRes.data.length > 0) {
          recs = listRes.data;
        } else {
          const genRes = await fetchWithRefresh((token) =>
            api.post<Recommendation[]>('recommendations/generate/', {}, token),
          );
          if (genRes.ok && Array.isArray(genRes.data)) {
            recs = genRes.data;
          }
        }
        if (isMounted) {
          setRecommendations(recs);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage('Unable to load AI insights right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInsights();

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshAccessToken]);

  const forecastItems: ForecastItem[] = useMemo(() => {
    const items: ForecastItem[] = [];
    const currentExpense = toNumber(summary?.expenses);
    if (currentExpense > 0) {
      items.push({
        id: 'current',
        label: 'Current',
        amount: currentExpense,
        highlight: true,
      });
    }
    if (prediction) {
      const predicted = toNumber(prediction.predicted_expense);
      const growth =
        currentExpense > 0 ? Math.round(((predicted - currentExpense) / currentExpense) * 100) : null;
      items.push({
        id: prediction.month,
        label: prediction.month,
        amount: predicted,
        meta: growth !== null ? `${growth >= 0 ? '+' : ''}${growth}% growth` : undefined,
      });
    }
    return items;
  }, [prediction, summary?.expenses]);

  const sortedRecommendations = useMemo(() => {
    return [...recommendations].sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);
  }, [recommendations]);

  const monthLabel = useMemo(() => {
    return new Date().toLocaleString('en-US', { month: 'long' });
  }, []);

  const headlineRecommendation = sortedRecommendations[0];
  const savingsRate = toNumber(summary?.savings_rate);
  const confidence =
    headlineRecommendation?.priority === 'high'
      ? 92
      : headlineRecommendation?.priority === 'medium'
        ? 80
        : headlineRecommendation
          ? 68
          : 0;
  const statusLabel = loading ? 'Loading' : errorMessage ? 'Offline' : 'Live';
  const statusColor = loading ? palette.cashBlue : errorMessage ? '#DC2626' : palette.accentGreen;
  const topCategories = summary?.top_categories ?? [];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Insights</Text>
          <View style={styles.headerRow}>
            <Text style={styles.headerSubtitle}>Personalized recommendations powered by AI</Text>
            <View style={[styles.statusPill, { borderColor: statusColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTitle}>We could not refresh AI insights.</Text>
            <Text style={styles.errorBody}>{errorMessage}</Text>
          </View>
        ) : null}

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
            {headlineRecommendation?.message ?? 'We are preparing your personalized insights.'}
          </Text>
          <Text style={styles.insightBody}>
            {summary
              ? `Savings rate: ${savingsRate.toFixed(1)}% this month.`
              : 'Add transactions to unlock deeper insights.'}
          </Text>

          <View style={styles.insightDivider} />

          <View style={styles.confidenceRow}>
            <Feather name="cpu" size={16} color={palette.card} />
            <Text style={styles.confidenceText}>
              {confidence > 0 ? `AI Confidence: ${confidence}%` : 'AI Confidence: --'}
            </Text>
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
          {loading && forecastItems.length === 0 ? (
            <>
              <View style={styles.loadingRow}>
                <ActivityIndicator color={palette.cashBlue} />
                <Text style={styles.loadingText}>Fetching AI forecast…</Text>
              </View>
              <View style={styles.skeletonCard}>
                <View style={styles.skeletonLine} />
                <View style={styles.skeletonLineShort} />
              </View>
            </>
          ) : null}
          {!loading && forecastItems.length === 0 ? (
            <Text style={styles.emptyText}>No forecast data yet. Add expenses to begin.</Text>
          ) : null}
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

        {forecastItems.length >= 2 ? (
          <View style={styles.projectedRow}>
            <Feather name="trending-up" size={14} color={palette.accentGreen} />
            <Text style={styles.projectedText}>
              Projected change:{' '}
              <Text style={styles.projectedHighlight}>
                {forecastItems[1]?.meta ?? 'Forecast updated'}
              </Text>
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitleSpacing}>Spending Patterns</Text>
        <View style={styles.patternList}>
          {topCategories.length === 0 ? (
            <Text style={styles.emptyText}>No spending patterns yet.</Text>
          ) : null}
          {topCategories.map((item) => (
            <View key={item.category} style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <View style={styles.patternIcon}>
                  <Feather name="pie-chart" size={18} color={palette.accentGreen} />
                </View>
                <View style={styles.patternInfo}>
                  <Text style={styles.patternTitle}>{item.category}</Text>
                  <Text style={styles.patternSubtitle}>
                    {formatKes(toNumber(item.total))} spent this month
                  </Text>
                </View>
              </View>
              <View style={styles.patternPill}>
                <Feather name="zap" size={12} color={palette.accentGreen} />
                <Text style={styles.patternPillText}>Review this category budget</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitleSpacing}>Smart Recommendations</Text>
        <View style={styles.recommendationList}>
          {loading && recommendations.length === 0 ? (
            <>
              <View style={styles.loadingRow}>
                <ActivityIndicator color={palette.accentGreen} />
                <Text style={styles.loadingText}>Generating recommendations…</Text>
              </View>
              <View style={styles.skeletonCard}>
                <View style={styles.skeletonLine} />
                <View style={styles.skeletonLineShort} />
              </View>
            </>
          ) : null}
          {!loading && recommendations.length === 0 ? (
            <Text style={styles.emptyText}>No recommendations yet. Add activity to get started.</Text>
          ) : null}
          {sortedRecommendations.map((rec, index) => {
            const isHigh = rec.priority === 'high';
            const pillColor = isHigh ? 'rgba(74, 222, 128, 0.2)' : 'rgba(37, 99, 235, 0.15)';
            return (
              <View key={`${rec.id}-${index}`} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <View style={isHigh ? styles.recommendationIcon : styles.recommendationIconAlt}>
                    <Feather
                      name={isHigh ? 'trending-up' : 'zap'}
                      size={18}
                      color={isHigh ? palette.accentGreen : palette.cashBlue}
                    />
                  </View>
                  <View style={styles.recommendationInfo}>
                    <Text style={styles.recommendationTitle}>{rec.message}</Text>
                    <Text style={styles.recommendationSubtitle}>
                      Priority: {rec.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.recommendationFooter}>
                  <View style={[styles.recommendationPill, { backgroundColor: pillColor }]}>
                    <Text style={styles.recommendationPillText}>{rec.priority.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.recommendationAction}>Apply</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Feather name="calendar" size={16} color={palette.card} />
            <Text style={styles.summaryTitle}>{monthLabel} Summary</Text>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>
                {summary ? formatKes(toNumber(summary.income)) : 'KES --'}
              </Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryLabel}>Savings Rate</Text>
              <Text style={styles.summaryValue}>
                {summary ? `${savingsRate.toFixed(1)}%` : '--%'}
              </Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    backgroundColor: palette.card,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  errorBody: {
    fontSize: 12,
    color: '#7F1D1D',
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  skeletonCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    width: '80%',
  },
  skeletonLineShort: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    width: '50%',
  },
  emptyText: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 6,
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
