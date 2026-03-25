import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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

type ConnectedAccount = {
  id: string;
  name: string;
  initials: string;
  initialsColor: string;
  initialsBg: string;
  lastDigits: string;
  typeLabel: string;
  balance: number;
  synced: boolean;
  highlight?: boolean;
};

type AddAccountOption = {
  id: string;
  name: string;
  subtitle: string;
};

const connectedAccounts: ConnectedAccount[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    initials: 'M',
    initialsColor: '#FFFFFF',
    initialsBg: '#10B981',
    lastDigits: '7823',
    typeLabel: 'Mobile Money',
    balance: 45200,
    synced: true,
  },
  {
    id: 'equity',
    name: 'Equity Bank',
    initials: 'E',
    initialsColor: '#FFFFFF',
    initialsBg: '#2563EB',
    lastDigits: '4521',
    typeLabel: 'Savings Account',
    balance: 79380,
    synced: true,
    highlight: true,
  },
  {
    id: 'kcb',
    name: 'KCB Bank',
    initials: 'K',
    initialsColor: '#FFFFFF',
    initialsBg: '#0F172A',
    lastDigits: '9012',
    typeLabel: 'Current Account',
    balance: 32100,
    synced: true,
  },
];

const addAccountOptions: AddAccountOption[] = [
  { id: 'coop', name: 'Co-operative Bank', subtitle: 'Tap to connect' },
  { id: 'ncba', name: 'NCBA Bank', subtitle: 'Tap to connect' },
  { id: 'stanbic', name: 'Standard Chartered', subtitle: 'Tap to connect' },
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

export default function AccountsScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Accounts</Text>
          <Text style={styles.headerSubtitle}>Manage your connected accounts</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Combined Balance</Text>
          <Text style={styles.summaryValue}>{formatKes(156680)}</Text>
          <Text style={styles.summaryMeta}>Across 3 accounts</Text>
        </View>

        <Text style={styles.sectionTitle}>Connected Accounts</Text>

        <View style={styles.accountList}>
          {connectedAccounts.map((account) => (
            <Pressable
              key={account.id}
              style={({ pressed, hovered }) => [
                styles.accountCard,
                account.highlight && styles.accountCardHighlight,
                (pressed || hovered) && styles.accountCardActive,
              ]}
            >
              <View style={styles.accountTopRow}>
                <View
                  style={[
                    styles.accountBadge,
                    { backgroundColor: account.initialsBg },
                  ]}
                >
                  <Text style={[styles.accountBadgeText, { color: account.initialsColor }]}>
                    {account.initials}
                  </Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <View style={styles.accountMeta}>
                    <Text style={styles.accountNumber}>{`***${account.lastDigits}`}</Text>
                    <View style={styles.accountTag}>
                      <Text style={styles.accountTagText}>{account.typeLabel}</Text>
                    </View>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color={palette.textSecondary} />
              </View>

              <View style={styles.accountDivider} />

              <View style={styles.accountBottomRow}>
                <View>
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text style={styles.balanceValue}>{formatKes(account.balance)}</Text>
                </View>
                {account.synced ? (
                  <View style={styles.syncStatus}>
                    <View style={styles.syncDot} />
                    <Text style={styles.syncText}>Synced</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpacing]}>Add New Account</Text>
        <View style={styles.addAccountList}>
          {addAccountOptions.map((item, index) => (
            <Pressable
              key={item.id}
              style={({ pressed, hovered }) => [
                styles.addAccountCard,
                index === 1 && styles.addAccountCardActive,
                (pressed || hovered) && styles.addAccountCardPressed,
              ]}
            >
              <View style={styles.addAccountIcon}>
                <Feather name="home" size={18} color={palette.cashBlue} />
              </View>
              <View style={styles.addAccountInfo}>
                <Text style={styles.addAccountTitle}>{item.name}</Text>
                <Text style={styles.addAccountSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.addAccountPlus}>+</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <View style={styles.securityIcon}>
              <Feather name="check" size={16} color={palette.accentGreen} />
            </View>
            <Text style={styles.securityTitle}>Secure & Private</Text>
          </View>
          <Text style={styles.securityText}>256-bit encryption - Read-only access -</Text>
          <Text style={styles.securityText}>CBK compliant</Text>
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
  summaryCard: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.14)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  summaryMeta: {
    fontSize: 12,
    color: palette.accentGreen,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  sectionTitleSpacing: {
    marginTop: 22,
  },
  accountList: {
    gap: 16,
  },
  accountCard: {
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.14)',
  },
  accountCardHighlight: {
    borderColor: 'rgba(74, 222, 128, 0.6)',
  },
  accountCardActive: {
    borderColor: 'rgba(74, 222, 128, 0.8)',
    shadowColor: palette.accentGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  accountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountBadgeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  accountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountNumber: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  accountTag: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  accountTagText: {
    fontSize: 11,
    color: palette.cashBlue,
    fontWeight: '600',
  },
  accountDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginVertical: 14,
  },
  accountBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accentGreen,
  },
  syncText: {
    fontSize: 12,
    color: palette.accentGreen,
    fontWeight: '600',
  },
  addAccountList: {
    gap: 12,
    marginBottom: 16,
  },
  addAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  addAccountCardActive: {
    borderColor: 'rgba(74, 222, 128, 0.6)',
    shadowColor: palette.accentGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  addAccountCardPressed: {
    borderColor: 'rgba(74, 222, 128, 0.8)',
  },
  addAccountIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addAccountInfo: {
    flex: 1,
  },
  addAccountTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  addAccountSubtitle: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  addAccountPlus: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.accentGreen,
  },
  securityCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    marginBottom: 20,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  securityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  securityText: {
    fontSize: 12,
    color: palette.textSecondary,
    lineHeight: 18,
  },
});
