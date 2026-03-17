import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
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

type DashboardSummary = {
  income: number | string;
  expenses: number | string;
  savings: number | string;
  savings_rate: number | string;
  top_categories: Array<{ category: string; total: number | string }>;
};

type CategoryBreakdownItem = {
  category: string;
  total: number | string;
  percentage: number | string;
};

type RecommendationItem = {
  id?: number;
  message: string;
  priority?: string;
};

type CategoryOption = {
  id: number;
  name: string;
};

type BudgetItem = {
  id: number;
  amount: number | string;
  month: string;
  category: CategoryOption;
};

type TrendItem = {
  month: string;
  income: number | string;
  expenses: number | string;
  savings: number | string;
};

type PredictionItem = {
  id?: number;
  predicted_expense: number | string;
  month: string;
  created_at?: string;
};

const fallbackSummary: DashboardSummary = {
  income: 120000,
  expenses: 72000,
  savings: 48000,
  savings_rate: 40,
  top_categories: [],
};

const fallbackInsights: RecommendationItem[] = [
  { message: 'You are likely to overspend on food this month.' },
  { message: 'You can save KES 5,000 if you reduce entertainment spending.' },
];

const toNumber = (value: number | string) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatKes = (value: number | string) => {
  const numeric = toNumber(value);
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch (error) {
    return `KES ${Math.round(numeric).toLocaleString()}`;
  }
};

const normalizeAmountInput = (value: string) =>
  value.replace(/[^0-9.]/g, '');

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [insights, setInsights] = useState<RecommendationItem[]>(fallbackInsights);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [prediction, setPrediction] = useState<PredictionItem | null>(null);
  const [predictionError, setPredictionError] = useState('');
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [budgetCategoryId, setBudgetCategoryId] = useState<number | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetError, setBudgetError] = useState('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { tokens, refreshAccessToken } = useAuth();
  const accessToken = tokens?.access;
  const currentMonth = new Date().toLocaleDateString('en-CA').slice(0, 7);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const fetchWithRefresh = async <T,>(fetcher: (token: string) => Promise<ReturnType<typeof api.get<T>>>) => {
          if (!accessToken) {
            return fetcher('');
          }
          let result = await fetcher(accessToken);
          if (result.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              result = await fetcher(newToken);
            }
          }
          return result;
        };

        const [
          summaryRes,
          breakdownRes,
          insightsRes,
          trendRes,
          predictionRes,
          categoriesRes,
          budgetsRes,
        ] = await Promise.all([
          fetchWithRefresh((token) => api.get<DashboardSummary>('analytics/dashboard/', token)),
          fetchWithRefresh((token) => api.get<CategoryBreakdownItem[]>('analytics/category-breakdown/', token)),
          fetchWithRefresh((token) => api.get<RecommendationItem[]>('recommendations/', token)),
          fetchWithRefresh((token) => api.get<TrendItem[]>('analytics/spending-trend/', token)),
          fetchWithRefresh((token) => api.get<PredictionItem>('predictions/latest/', token)),
          fetchWithRefresh((token) => api.get<CategoryOption[]>('categories/', token)),
          fetchWithRefresh((token) => api.get<BudgetItem[]>(`budgets/?month=${currentMonth}`, token)),
        ]);

        if (isMounted && summaryRes.ok && summaryRes.data) {
          setSummary(summaryRes.data);
        }

        if (isMounted && breakdownRes.ok && breakdownRes.data) {
          setBreakdown(breakdownRes.data);
        }

        if (isMounted && insightsRes.ok && insightsRes.data?.length) {
          setInsights(insightsRes.data);
        }

        if (isMounted && trendRes.ok && trendRes.data) {
          setTrend(trendRes.data);
        }

        if (isMounted) {
          if (predictionRes.ok && predictionRes.data) {
            setPrediction(predictionRes.data);
            setPredictionError('');
          } else {
            setPrediction(null);
            if (predictionRes.status !== 404) {
              setPredictionError(predictionRes.message ?? 'Unable to load prediction.');
            } else {
              setPredictionError('');
            }
          }
        }

        if (isMounted && categoriesRes.ok && categoriesRes.data) {
          setCategories(categoriesRes.data);
        }

        if (isMounted && budgetsRes.ok && budgetsRes.data) {
          setBudgets(budgetsRes.data);
        }
      } catch (error) {
        if (isMounted) {
          setSummary(fallbackSummary);
          setBreakdown([]);
          setInsights(fallbackInsights);
          setTrend([]);
          setPrediction(null);
          setBudgets([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshAccessToken, currentMonth]);

  const handleGenerateRecommendations = async () => {
    if (!accessToken || isGeneratingRecommendations) {
      return;
    }
    setIsGeneratingRecommendations(true);
    try {
      let result = await api.post<RecommendationItem[]>('recommendations/generate/', {}, accessToken);
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.post<RecommendationItem[]>('recommendations/generate/', {}, newToken);
        }
      }
      if (result.ok && result.data?.length) {
        setInsights(result.data);
      }
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const handleGenerateForecast = async () => {
    if (!accessToken || isGeneratingForecast) {
      return;
    }
    setIsGeneratingForecast(true);
    setPredictionError('');
    try {
      let result = await api.post<PredictionItem>('predictions/forecast/', {}, accessToken);
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.post<PredictionItem>('predictions/forecast/', {}, newToken);
        }
      }
      if (result.ok && result.data) {
        setPrediction(result.data);
      } else {
        setPredictionError(result.message ?? 'Unable to generate forecast.');
      }
    } catch (error) {
      setPredictionError('Unable to generate forecast right now.');
    } finally {
      setIsGeneratingForecast(false);
    }
  };

  const selectedBudgetCategory = useMemo(
    () => categories.find((item) => item.id === budgetCategoryId) ?? null,
    [categories, budgetCategoryId],
  );

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    breakdown.forEach((item) => {
      map.set(item.category.toLowerCase(), toNumber(item.total));
    });
    return map;
  }, [breakdown]);

  const handleSaveBudget = async () => {
    setBudgetError('');
    if (!budgetCategoryId) {
      setBudgetError('Select a category to budget for.');
      return;
    }
    const amountValue = Number(normalizeAmountInput(budgetAmount));
    if (!amountValue || amountValue <= 0) {
      setBudgetError('Enter a valid budget amount.');
      return;
    }
    if (!accessToken) {
      setBudgetError('Sign in to save budgets.');
      return;
    }

    setIsSavingBudget(true);
    const monthValue = `${currentMonth}-01`;
    const existing = budgets.find(
      (budget) =>
        budget.category.id === budgetCategoryId &&
        budget.month.startsWith(currentMonth),
    );
    const payload = {
      category_id: budgetCategoryId,
      month: monthValue,
      amount: amountValue,
    };
    try {
      let result = existing
        ? await api.patch<BudgetItem>(`budgets/${existing.id}/`, payload, accessToken)
        : await api.post<BudgetItem>('budgets/', payload, accessToken);
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = existing
            ? await api.patch<BudgetItem>(`budgets/${existing.id}/`, payload, newToken)
            : await api.post<BudgetItem>('budgets/', payload, newToken);
        }
      }
      if (result.ok && result.data) {
        setBudgets((prev) => {
          if (existing) {
            return prev.map((item) => (item.id === existing.id ? result.data : item));
          }
          return [result.data, ...prev];
        });
        setBudgetAmount('');
      } else {
        setBudgetError(result.message ?? 'Unable to save budget.');
      }
    } catch (error) {
      setBudgetError('Unable to save budget right now.');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!accessToken) {
      return;
    }
    try {
      let result = await api.delete(`budgets/${id}/`, accessToken);
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.delete(`budgets/${id}/`, newToken);
        }
      }
      if (result.ok) {
        setBudgets((prev) => prev.filter((item) => item.id !== id));
      } else {
        setBudgetError(result.message ?? 'Unable to delete budget.');
      }
    } catch (error) {
      setBudgetError('Unable to delete budget right now.');
    }
  };

  const budgetProgress = useMemo(() => {
    if (!budgets.length) {
      return [];
    }

    return budgets.map((budget, index) => {
      const spent = spentByCategory.get(budget.category.name.toLowerCase()) ?? 0;
      const limit = toNumber(budget.amount);
      const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
      const isOver = spent > limit;
      const colors = [palette.accentGreen, palette.cashBlue, palette.sidebar, palette.mpesaGreen];
      const color = isOver ? '#EF4444' : colors[index % colors.length];
      return {
        category: budget.category.name,
        percent,
        color,
      };
    });
  }, [budgets, spentByCategory]);

  const savingsRate = toNumber(summary.savings_rate);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Report Period: This Month</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Link href="/(tabs)/TransactionScreen" asChild>
              <TouchableOpacity style={styles.quickCard}>
                <Text style={styles.quickTitle}>Add Transaction</Text>
                <Text style={styles.quickSubtitle}>Log income or expense</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/TransactionScreen" asChild>
              <TouchableOpacity style={styles.quickCard}>
                <Text style={styles.quickTitle}>View Transactions</Text>
                <Text style={styles.quickSubtitle}>History & filters</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/ProfileScreen" asChild>
              <TouchableOpacity style={styles.quickCard}>
                <Text style={styles.quickTitle}>Profile</Text>
                <Text style={styles.quickSubtitle}>Account settings</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financial Overview</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceValue}>{formatKes(summary.savings)}</Text>
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Income (This Month)</Text>
              <Text style={[styles.metricValue, styles.metricIncome]}>
                {formatKes(summary.income)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Expenses (This Month)</Text>
              <Text style={[styles.metricValue, styles.metricExpense]}>
                {formatKes(summary.expenses)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Savings Rate (%)</Text>
              <Text style={[styles.metricValue, styles.metricSavings]}>
                {`${savingsRate.toFixed(1)}%`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Budgets ({currentMonth})</Text>
          <View style={styles.budgetForm}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setBudgetOpen((prev) => !prev)}
            >
              <Text style={styles.dropdownValue}>
                {selectedBudgetCategory?.name ?? 'Select category'}
              </Text>
            </TouchableOpacity>
            {budgetOpen ? (
              <View style={styles.dropdownList}>
                {categories.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setBudgetCategoryId(item.id);
                      setBudgetOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <Text style={styles.label}>Monthly Budget Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 8,000"
              placeholderTextColor={palette.textSecondary}
              keyboardType="numeric"
              value={budgetAmount}
              onChangeText={(value) => setBudgetAmount(normalizeAmountInput(value))}
            />
            {budgetError ? <Text style={styles.errorText}>{budgetError}</Text> : null}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveBudget}
              disabled={isSavingBudget}
            >
              {isSavingBudget ? (
                <ActivityIndicator color={palette.textPrimary} />
              ) : (
                <Text style={styles.saveButtonText}>Save Budget</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.budgetList}>
            {budgets.length ? (
              budgets.map((budget) => {
                const limit = toNumber(budget.amount);
                const spent = spentByCategory.get(budget.category.name.toLowerCase()) ?? 0;
                const remaining = limit - spent;
                const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                const isOver = spent > limit;
                return (
                  <View key={budget.id} style={styles.budgetRow}>
                    <View style={styles.budgetHeader}>
                      <Text style={styles.budgetCategory}>{budget.category.name}</Text>
                      <TouchableOpacity
                        style={styles.budgetDelete}
                        onPress={() => handleDeleteBudget(budget.id)}
                      >
                        <Text style={styles.budgetDeleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.budgetMeta}>
                      <Text style={styles.budgetValue}>Budget: {formatKes(limit)}</Text>
                      <Text style={[styles.budgetValue, isOver && styles.budgetOver]}>
                        Spent: {formatKes(spent)}
                      </Text>
                      <Text style={styles.budgetValue}>
                        Remaining: {formatKes(remaining)}
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${percent}%`,
                            backgroundColor: isOver ? '#EF4444' : palette.accentGreen,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No budgets set for this month.</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, styles.cardTitleTight]}>Spending Trend</Text>
            <Text style={styles.cardHint}>Last 6 months</Text>
          </View>
          {trend.length ? (
            trend.map((item) => (
              <View key={item.month} style={styles.trendRow}>
                <Text style={styles.trendMonth}>{item.month}</Text>
                <View style={styles.trendValues}>
                  <Text style={styles.trendIncome}>{formatKes(item.income)}</Text>
                  <Text style={styles.trendExpense}>{formatKes(item.expenses)}</Text>
                  <Text style={styles.trendSavings}>{formatKes(item.savings)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No trend data yet.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Budget Progress</Text>
          {budgetProgress.length ? (
            budgetProgress.map((item) => (
              <View key={item.category} style={styles.progressRow}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{item.category}</Text>
                  <Text style={styles.progressPercent}>{`${item.percent.toFixed(0)}% used`}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(item.percent, 100)}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No budgets set for this month.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, styles.cardTitleTight]}>AI Insights</Text>
            <TouchableOpacity
              style={styles.actionPill}
              onPress={handleGenerateRecommendations}
              disabled={isGeneratingRecommendations}
            >
              {isGeneratingRecommendations ? (
                <ActivityIndicator color={palette.textPrimary} />
              ) : (
                <Text style={styles.actionPillText}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>
          {insights.slice(0, 3).map((insight, index) => (
            <View key={`${insight.message}-${index}`} style={styles.insightRow}>
              <View style={styles.insightDot} />
              <Text style={styles.insightText}>{insight.message}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, styles.cardTitleTight]}>Next Month Forecast</Text>
            <TouchableOpacity
              style={styles.actionPill}
              onPress={handleGenerateForecast}
              disabled={isGeneratingForecast}
            >
              {isGeneratingForecast ? (
                <ActivityIndicator color={palette.textPrimary} />
              ) : (
                <Text style={styles.actionPillText}>Generate</Text>
              )}
            </TouchableOpacity>
          </View>
          {prediction ? (
            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Predicted expenses for {prediction.month}</Text>
              <Text style={styles.predictionValue}>{formatKes(prediction.predicted_expense)}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No forecast generated yet.</Text>
          )}
          {predictionError ? <Text style={styles.errorText}>{predictionError}</Text> : null}
        </View>
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={palette.accentGreen} />
        </View>
      ) : null}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    backgroundColor: palette.sidebar,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: palette.card,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accentGreen,
    marginRight: 6,
  },
  statusText: {
    color: palette.card,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  cardTitleTight: {
    marginBottom: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHint: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.5)',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  label: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: palette.textPrimary,
    backgroundColor: palette.card,
    marginBottom: 12,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: palette.card,
    marginBottom: 12,
  },
  dropdownValue: {
    color: palette.textPrimary,
    fontSize: 14,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: palette.card,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.12)',
  },
  dropdownItemText: {
    color: palette.textPrimary,
  },
  saveButton: {
    backgroundColor: palette.accentGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: palette.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  budgetForm: {
    marginBottom: 16,
  },
  budgetList: {
    gap: 12,
  },
  budgetRow: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 14,
    padding: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  budgetDelete: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  budgetDeleteText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '600',
  },
  budgetMeta: {
    gap: 4,
    marginBottom: 10,
  },
  budgetValue: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  budgetOver: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  quickActions: {
    gap: 12,
  },
  quickCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  quickSubtitle: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  balanceRow: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.12)',
  },
  trendMonth: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  trendValues: {
    alignItems: 'flex-end',
    gap: 4,
  },
  trendIncome: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.mpesaGreen,
  },
  trendExpense: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.cashBlue,
  },
  trendSavings: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  metricItem: {
    width: '48%',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricIncome: {
    color: palette.mpesaGreen,
  },
  metricExpense: {
    color: palette.cashBlue,
  },
  metricSavings: {
    color: palette.textPrimary,
  },
  progressRow: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  progressPercent: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(100, 116, 139, 0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accentGreen,
    marginTop: 6,
    marginRight: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  predictionRow: {
    gap: 8,
  },
  predictionLabel: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  predictionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  emptyText: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: palette.cashBlue,
    marginTop: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
