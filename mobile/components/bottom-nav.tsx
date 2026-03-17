import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth';

type NavVariant = 'public' | 'app';

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

const publicItems = [
  { label: 'Welcome', path: '/WelcomeScreen' },
  { label: 'Login', path: '/LoginScreen' },
  { label: 'Signup', path: '/SignupScreen' },
  { label: 'All', path: '/AllScreens' },
];

const appItems = [
  { label: 'Dashboard', path: '/Dashboard' },
  { label: 'Home', path: '/(tabs)' },
  { label: 'Transactions', path: '/(tabs)/TransactionScreen' },
  { label: 'Profile', path: '/(tabs)/ProfileScreen' },
  { label: 'All', path: '/AllScreens' },
];

type BottomNavProps = {
  variant?: NavVariant;
};

export default function BottomNav({ variant }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tokens } = useAuth();

  const resolvedVariant: NavVariant = useMemo(() => {
    if (variant) {
      return variant;
    }
    return tokens?.access ? 'app' : 'public';
  }, [tokens?.access, variant]);

  const items = resolvedVariant === 'app' ? appItems : publicItems;

  const isActive = (path: string) => {
    if (pathname === path) {
      return true;
    }
    if (path === '/(tabs)') {
      return pathname.startsWith('/(tabs)');
    }
    return pathname.startsWith(`${path}/`);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.bar}>
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <TouchableOpacity
              key={item.path}
              style={[styles.button, active && styles.buttonActive]}
              onPress={() => router.replace(item.path)}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  bar: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  buttonActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  buttonTextActive: {
    color: palette.textPrimary,
  },
});
