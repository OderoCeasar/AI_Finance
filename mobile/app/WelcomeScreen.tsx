import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[700]} />

      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={[colors.primary[900], colors.primary[700], colors.secondary[600]]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </LinearGradient>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>AI Finance</Text>
          <Text style={styles.tagline}>Smart Money Management</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Take control of your finances with AI-powered insights, automated tracking, and personalized recommendations.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Link href="/LoginScreen" asChild>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/SignupScreen" asChild>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Link href="/LoginScreen" style={styles.linkText}>
              Sign In
            </Link>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[900],
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.4,
    right: -width * 0.4,
  },
  circle2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: -width * 0.3,
    left: -width * 0.3,
  },
  circle3: {
    width: width * 0.4,
    height: width * 0.4,
    top: height * 0.3,
    left: -width * 0.2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: colors.text.white,
    opacity: 0.9,
  },
  descriptionContainer: {
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: colors.text.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: colors.text.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: colors.primary[700],
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.text.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: colors.text.white,
    fontSize: 14,
    opacity: 0.7,
  },
  linkText: {
    color: colors.secondary[400],
    fontWeight: '600',
  },
});