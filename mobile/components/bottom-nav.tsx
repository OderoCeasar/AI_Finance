import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

import { useAuth } from '@/lib/auth';

type NavVariant = 'public' | 'app';

const palette = {
  accentGreen: '#22C55E',
  activeGreen: '#22C55E',
  activeGreenBg: '#DCFCE7',
  sidebar: '#1E293B',
  textSecondary: '#94A3B8',
  textPrimary: '#0F172A',
  cashBlue: '#2563EB',
  mpesaGreen: '#10B981',
  surface: '#F8FAFC',
  card: '#F8FAFC',
};

const publicItems = [
  { label: 'Welcome', path: '/WelcomeScreen', icon: 'home' },
  { label: 'Login', path: '/LoginScreen', icon: 'login' },
  { label: 'Signup', path: '/SignupScreen', icon: 'adduser' },
];

const appItems = [
  {
    label: 'Home',
    path: '/Dashboard',
    icon: 'custom-home',
    source: require('@/assets/images/home-icon.png'),
    tint: false,
  },
  {
    label: 'Accounts',
    path: '/Accounts',
    icon: 'custom-accounts',
    source: require('@/assets/images/accounts-icon-finance.png'),
    tint: false,
    iconSize: 30,
  },
  {
    label: 'Activity',
    path: '/Activity',
    icon: 'custom-activity',
    source: require('@/assets/images/activity-icon.png'),
    tint: false,
  },
  {
    label: 'Budgets',
    path: '/Budgets',
    icon: 'custom-budgets',
    source: require('@/assets/images/budgets-icon.jpg'),
    tint: false,
  },
  {
    label: 'Insights',
    path: '/Insights',
    icon: 'custom-insights',
    source: require('@/assets/images/insights-icon.avif'),
    tint: false,
  },
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
          const iconColor = active ? palette.activeGreen : palette.textSecondary;
          return (
            <TouchableOpacity
              key={item.path}
              style={styles.button}
              onPress={() => router.replace(item.path)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                {item.source ? (
                <Image
                  source={item.source}
                  style={[
                    styles.customIcon,
                    item.iconSize ? { width: item.iconSize, height: item.iconSize } : null,
                    item.tint === false ? null : { tintColor: iconColor },
                  ]}
                  resizeMode="contain"
                />
                ) : (
                  <AntDesign
                    name={item.icon as keyof typeof AntDesign.glyphMap}
                    size={20}
                    color={iconColor}
                  />
                )}
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
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
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  bar: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: palette.card,
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: 'transparent',
    elevation: 0,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: palette.activeGreenBg,
    transform: [{ scale: 1.1 }],
  },
  customIcon: {
    width: 26,
    height: 26,
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  labelActive: {
    color: palette.activeGreen,
  },
});
