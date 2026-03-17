import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

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

const screenSections = [
  {
    title: 'Public',
    description: 'No login required.',
    items: [
      { label: 'Welcome', path: '/WelcomeScreen' },
      { label: 'Login', path: '/LoginScreen' },
      { label: 'Signup', path: '/SignupScreen' },
      { label: 'Forgot Password', path: '/ForgotPasswordScreen' },
      { label: 'Reset Password', path: '/ResetPasswordScreen' },
    ],
  },
  {
    title: 'Main App',
    description: 'Requires login for full data.',
    items: [
      { label: 'Dashboard', path: '/Dashboard' },
      { label: 'Home (Tabs)', path: '/(tabs)' },
      { label: 'Transactions', path: '/(tabs)/TransactionScreen' },
      { label: 'Profile', path: '/(tabs)/ProfileScreen' },
      { label: 'Explore', path: '/(tabs)/explore' },
    ],
  },
];

export default function AllScreens() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>All Screens</Text>
          <Text style={styles.headerSubtitle}>Quick navigation hub for testing</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Tip</Text>
          <Text style={styles.noticeText}>
            If a screen redirects you, sign in first and then return here.
          </Text>
        </View>

        {screenSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.description}</Text>
            <View style={styles.sectionList}>
              {section.items.map((item) => (
                <Link key={item.path} href={item.path} asChild>
                  <TouchableOpacity style={styles.linkCard}>
                    <Text style={styles.linkLabel}>{item.label}</Text>
                    <Text style={styles.linkPath}>{item.path}</Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>
        ))}
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
  header: {
    backgroundColor: palette.sidebar,
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  backText: {
    color: palette.card,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: palette.card,
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 13,
    marginTop: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 20,
  },
  noticeCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  noticeTitle: {
    color: palette.cashBlue,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  noticeText: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  sectionList: {
    gap: 10,
  },
  linkCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  linkPath: {
    fontSize: 12,
    color: palette.textSecondary,
  },
});
