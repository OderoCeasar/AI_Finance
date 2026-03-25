import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

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

type CategoryChip = {
  id: string;
  label: string;
  count: number;
  active?: boolean;
};

type ActivityItem = {
  id: string;
  title: string;
  category: string;
  time: string;
  source: string;
  amount: number;
  icon: keyof typeof Feather.glyphMap;
  badge?: string;
};

const categoryChips: CategoryChip[] = [
  { id: 'all', label: 'All', count: 247, active: true },
  { id: 'shopping', label: 'Shopping', count: 52 },
  { id: 'bills', label: 'Bills', count: 23 },
  { id: 'transport', label: 'Transport', count: 31 },
  { id: 'food', label: 'Food', count: 89 },
];

const todayActivities: ActivityItem[] = [
  {
    id: 'zara',
    title: 'Zara - Westgate',
    category: 'Shopping',
    time: '2:45 PM',
    source: 'M-Pesa',
    amount: -4800,
    icon: 'shopping-bag',
  },
  {
    id: 'java',
    title: 'Java House',
    category: 'Food & Dining',
    time: '12:30 PM',
    source: 'Equity',
    amount: -890,
    icon: 'coffee',
  },
  {
    id: 'uber',
    title: 'Uber',
    category: 'Transport',
    time: '8:15 AM',
    source: 'M-Pesa',
    amount: -650,
    icon: 'truck',
  },
];

const yesterdayActivities: ActivityItem[] = [
  {
    id: 'salary',
    title: 'Salary - Tech',
    category: 'Income',
    time: '9:00 AM',
    source: 'Equity',
    amount: 95000,
    icon: 'dollar-sign',
    badge: 'Income',
  },
  {
    id: 'carrefour',
    title: 'Carrefour',
    category: 'Shopping',
    time: '6:45 PM',
    source: 'Equity',
    amount: -6500,
    icon: 'shopping-cart',
  },
  {
    id: 'kplc',
    title: 'Kenya Power',
    category: 'Bills',
    time: '3:20 PM',
    source: 'M-Pesa',
    amount: -3200,
    icon: 'zap',
  },
];

const march21Activities: ActivityItem[] = [
  {
    id: 'netflix',
    title: 'Netflix',
    category: 'Entertainment',
    time: '11:00 AM',
    source: 'Equity',
    amount: -1299,
    icon: 'film',
  },
  {
    id: 'matatu',
    title: 'Matatu - CBD',
    category: 'Transport',
    time: '8:00 AM',
    source: 'M-Pesa',
    amount: -60,
    icon: 'truck',
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

const formatSigned = (value: number) => {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${Math.abs(value).toLocaleString('en-KE')}`;
};

export default function ActivityScreen() {
  const renderActivityList = (items: ActivityItem[]) => (
    <View style={styles.activityList}>
      {items.map((item) => {
        const isPositive = item.amount >= 0;
        return (
          <Pressable
            key={item.id}
            style={({ pressed, hovered }) => [
              styles.activityCard,
              (pressed || hovered) && styles.activityCardActive,
            ]}
          >
            <View style={styles.activityIcon}>
              <Feather name={item.icon} size={18} color={palette.accentGreen} />
            </View>
            <View style={styles.activityDetails}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                {item.badge ? (
                  <View style={styles.activityBadge}>
                    <Text style={styles.activityBadgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.activityMetaRow}>
                <Text style={styles.activityMeta}>{item.category}</Text>
                <Text style={styles.activityMeta}>{item.time}</Text>
                <View style={styles.activityTag}>
                  <Text style={styles.activityTagText}>{item.source}</Text>
                </View>
              </View>
            </View>
            <Text
              style={[
                styles.activityAmount,
                isPositive && styles.activityAmountPositive,
              ]}
            >
              {formatSigned(item.amount)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>All your spending in one place</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Feather name="search" size={18} color={palette.textSecondary} />
            <TextInput
              placeholder="Search transactions..."
              placeholderTextColor={palette.textSecondary}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.85}>
            <Feather name="sliders" size={18} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {categoryChips.map((chip) => (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, chip.active && styles.chipActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, chip.active && styles.chipTextActive]}>
                {chip.label} ({chip.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>{formatKes(66550)}</Text>
            <Text style={styles.summaryMeta}>This month</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardAccent]}>
            <Text style={[styles.summaryLabel, styles.summaryLabelAccent]}>Avg per Day</Text>
            <Text style={styles.summaryValueAccent}>{formatKes(3140)}</Text>
            <Text style={styles.summaryMetaAccent}>-8% vs last month</Text>
          </View>
        </View>

        <View style={styles.todayHeader}>
          <Feather name="calendar" size={16} color={palette.textSecondary} />
          <Text style={styles.todayTitle}>Today</Text>
        </View>

        {renderActivityList(todayActivities)}

        <View style={styles.sectionSpacer} />
        <View style={styles.todayHeader}>
          <Feather name="calendar" size={16} color={palette.textSecondary} />
          <Text style={styles.todayTitle}>Yesterday</Text>
        </View>
        {renderActivityList(yesterdayActivities)}

        <View style={styles.sectionSpacer} />
        <View style={styles.todayHeader}>
          <Feather name="calendar" size={16} color={palette.textSecondary} />
          <Text style={styles.todayTitle}>Mar 21</Text>
        </View>
        {renderActivityList(march21Activities)}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: palette.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  chipRow: {
    gap: 10,
    paddingRight: 20,
    marginBottom: 18,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  chipActive: {
    backgroundColor: palette.accentGreen,
    borderColor: 'rgba(74, 222, 128, 0.6)',
  },
  chipText: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: palette.card,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
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
  summaryCardAccent: {
    backgroundColor: '#33C86E',
    borderColor: 'rgba(51, 200, 110, 0.6)',
  },
  summaryLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 8,
  },
  summaryLabelAccent: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  summaryValueAccent: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.card,
    marginBottom: 6,
  },
  summaryMeta: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  summaryMetaAccent: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  todayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  activityList: {
    gap: 12,
  },
  sectionSpacer: {
    height: 10,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  activityCardActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    borderColor: 'rgba(74, 222, 128, 0.5)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  activityBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activityBadgeText: {
    fontSize: 11,
    color: palette.accentGreen,
    fontWeight: '700',
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityMeta: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  activityTag: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activityTagText: {
    fontSize: 11,
    color: palette.cashBlue,
    fontWeight: '600',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginLeft: 10,
  },
  activityAmountPositive: {
    color: palette.accentGreen,
  },
});
