import React, { useMemo } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

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
  { label: 'Welcome', path: '/WelcomeScreen', icon: 'home' },
  { label: 'Login', path: '/LoginScreen', icon: 'login' },
  { label: 'Signup', path: '/SignupScreen', icon: 'adduser' },
];

const appItems = [
  { label: 'Dashboard', path: '/Dashboard', icon: 'home' },
  { label: 'Accounts', path: '/Accounts', icon: 'wallet' },
  { label: 'Activity', path: '/Activity', icon: 'profile' },
  { label: 'Budgets', path: '/Budgets', icon: 'piechart' },
  { label: 'Insights', path: '/Insights', icon: 'bulb1' },
  { label: 'Profile', path: '/(tabs)/ProfileScreen', icon: 'user' },
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

  const normalizePath = (value: string) => value.replace('/(tabs)', '');

  const isActive = (path: string) => {
    const normalizedPath = normalizePath(path);
    const normalizedCurrent = normalizePath(pathname);
    if (normalizedCurrent === normalizedPath) {
      return true;
    }
    if (normalizedPath === '') {
      return false;
    }
    return normalizedCurrent.startsWith(`${normalizedPath}/`);
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
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              {item.icon === 'custom-transaction' ? (
                <Image
                  source={item.source}
                  style={[
                    styles.customIcon,
                    { tintColor: active ? palette.textPrimary : palette.textSecondary },
                  ]}
                  resizeMode="contain"
                />
              ) : (
                <AntDesign
                  name={item.icon as keyof typeof AntDesign.glyphMap}
                  size={20}
                  color={active ? palette.textPrimary : palette.textSecondary}
                />
              )}
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
    gap: 6,
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
  customIcon: {
    width: 26,
    height: 26,
  },
});
