import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
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

type BudgetCategory = {
  id: string;
  title: string;
  spent: number;
  total: number;
  progressColor: string;
  icon: keyof typeof Feather.glyphMap;
  alert?: boolean;
};

const budgetCategories: BudgetCategory[] = [
  {
    id: 'shopping',
    title: 'Shopping',
    spent: 23450,
    total: 30000,
    progressColor: '#22C55E',
    icon: 'shopping-bag',
  },
  {
    id: 'food',
    title: 'Food & Dining',
    spent: 18200,
    total: 20000,
    progressColor: '#2563EB',
    icon: 'coffee',
  },
  {
    id: 'transport',
    title: 'Transport',
    spent: 12800,
    total: 15000,
    progressColor: '#22C55E',
    icon: 'truck',
  },
  {
    id: 'entertainment',
    title: 'Entertainment',
    spent: 8900,
    total: 8000,
    progressColor: '#EF4444',
    icon: 'film',
    alert: true,
  },
  {
    id: 'bills',
    title: 'Bills',
    spent: 3200,
    total: 10000,
    progressColor: '#64748B',
    icon: 'zap',
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

export default function BudgetsScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Budgets</Text>
          <Text style={styles.headerSubtitle}>Track spending and savings goals</Text>
        </View>

        <LinearGradient
          colors={[palette.sidebar, '#1F2937']}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryMonth}>March 2026</Text>
            <Text style={styles.summaryPercent}>91%</Text>
          </View>
          <Text style={styles.summarySpent}>{formatKes(66550)}</Text>
          <Text style={styles.summaryMeta}>of {formatKes(73000)} budget</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '91%' }]} />
          </View>

          <View style={styles.summaryFooter}>
            <Feather name="trending-up" size={14} color={palette.accentGreen} />
            <Text style={styles.summaryFooterText}>KES 6,450 remaining for this month</Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.addRow}>
            <Text style={styles.addText}>+ Add</Text>
          </View>
        </View>

        <View style={styles.categoryList}>
          {budgetCategories.map((category) => {
            const percent = Math.min((category.spent / category.total) * 100, 100);
            const remaining = category.total - category.spent;
            const isOver = remaining < 0;
            const progressColor = isOver ? '#EF4444' : category.progressColor;
            return (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIcon}>
                    <Feather name={category.icon} size={18} color={palette.accentGreen} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryMeta}>
                      {formatKes(category.spent)} / {formatKes(category.total)}
                    </Text>
                  </View>
                  {category.alert ? (
                    <View style={styles.alertBadge}>
                      <Text style={styles.alertBadgeText}>!</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.categoryProgressTrack}>
                  <View
                    style={[
                      styles.categoryProgressFill,
                      { width: `${percent}%`, backgroundColor: progressColor },
                    ]}
                  />
                </View>
                <View style={styles.categoryFooter}>
                  <Text
                    style={[
                      styles.categoryUsed,
                      isOver && styles.categoryUsedOver,
                    ]}
                  >
                    {`${Math.round((category.spent / category.total) * 100)}% used`}
                  </Text>
                  <Text
                    style={[
                      styles.categoryLeft,
                      isOver && styles.categoryLeftOver,
                    ]}
                  >
                    {isOver
                      ? `${formatKes(Math.abs(remaining))} over budget`
                      : `${formatKes(remaining)} left`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitleSpacing}>Savings Goal</Text>
        <LinearGradient
          colors={['#34D399', '#22C55E']}
          style={styles.savingsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.savingsHeader}>
            <View style={styles.savingsIcon}>
              <Feather name="target" size={18} color={palette.card} />
            </View>
            <View>
              <Text style={styles.savingsTitle}>Emergency Fund</Text>
              <Text style={styles.savingsSubtitle}>Goal: {formatKes(100000)}</Text>
            </View>
          </View>

          <Text style={styles.savingsAmount}>{formatKes(67500)}</Text>

          <View style={styles.savingsProgressTrack}>
            <View style={[styles.savingsProgressFill, { width: '67.5%' }]} />
          </View>

          <View style={styles.savingsMetaRow}>
            <Text style={styles.savingsMeta}>67.5% complete</Text>
            <Text style={styles.savingsMeta}>{formatKes(32500)} to go</Text>
          </View>

          <View style={styles.savingsFooter}>
            <View>
              <Text style={styles.savingsLabel}>Monthly Target</Text>
              <Text style={styles.savingsTarget}>{formatKes(5000)}</Text>
            </View>
            <TouchableOpacity style={styles.savingsButton} activeOpacity={0.85}>
              <Text style={styles.savingsButtonText}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipTitle}>Budget Tip</Text>
          </View>
          <Text style={styles.tipText}>
            You're over budget on Entertainment by {formatKes(900)}. Consider reducing
            spending to stay on track this month.
          </Text>
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
    marginBottom: 18,
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
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryMonth: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  summaryPercent: {
    color: palette.accentGreen,
    fontSize: 20,
    fontWeight: '700',
  },
  summarySpent: {
    color: palette.card,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryMeta: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.accentGreen,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryFooterText: {
    color: palette.card,
    fontSize: 12,
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
  sectionTitleSpacing: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginTop: 22,
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addText: {
    fontSize: 13,
    color: palette.accentGreen,
    fontWeight: '600',
  },
  categoryList: {
    gap: 14,
  },
  categoryCard: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  alertBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  alertBadgeText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  categoryMeta: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  categoryProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    marginBottom: 8,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryUsed: {
    fontSize: 12,
    color: palette.accentGreen,
    fontWeight: '600',
  },
  categoryUsedOver: {
    color: '#EF4444',
  },
  categoryLeft: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  categoryLeftOver: {
    color: '#EF4444',
    fontWeight: '600',
  },
  savingsCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  savingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.card,
    marginBottom: 4,
  },
  savingsSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  savingsAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: palette.card,
    marginBottom: 12,
  },
  savingsProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginBottom: 8,
  },
  savingsProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.card,
  },
  savingsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  savingsMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  savingsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  savingsTarget: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.card,
  },
  savingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  savingsButtonText: {
    color: palette.card,
    fontSize: 12,
    fontWeight: '700',
  },
  tipCard: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
    marginBottom: 24,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  tipText: {
    fontSize: 12,
    color: palette.textSecondary,
    lineHeight: 18,
  },
});
