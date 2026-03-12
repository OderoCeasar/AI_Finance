import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AntDesign } from '@expo/vector-icons';
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

const palette = {
  accentGreen: "#4ADE80",
  sidebar: "#1E293B",
  textSecondary: "#64748B",
  textPrimary: "#0F172A",
  cashBlue: "#2563EB",
  mpesaGreen: "#10B981",
  surface: "#F8FAFC",
  card: "#FFFFFF",
};

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "707284577096-n2kos6gmt64re4aqns41rgpgf6vgfo3k.apps.googleusercontent.com",
  });

  console.log("Redirect URI:", AuthSession.makeRedirectUri());

  //handling Google login response
  useEffect(() => {
    if (response?.type === "success"){
      const{ authentication } = response;

      console.log("Google Access Token:", authentication?.accessToken);
      console.log("Google ID Token:", authentication?.idToken);

      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleSignup = () => {
    setIsLoading(true);
    // Simulate signup
    setTimeout(() => {
      setIsLoading(false);
      router.replace("/(tabs)");
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={palette.surface}
      />

      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={[
            palette.surface,
            palette.card,
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
        </LinearGradient>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>✨</Text>
          </View>
          <Text style={styles.brandName}>AI_Finance</Text>
        </View>
      </View>

      {/* Form Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={styles.formHeader}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Start your smart budgeting journey
          </Text>
        </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={palette.textSecondary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={palette.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={palette.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? "" : ""}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={palette.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? "" : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={palette.textPrimary} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Create Account</Text>
                  <Text style={styles.submitArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Social Login */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity 
            style={styles.socialButton} 
            activeOpacity={0.8}
            onPress={() => promptAsync()}
          >
            <AntDesign name="google" size={24} color="#DB4437" />
            <Text style={styles.socialText}>Sign up with Google</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/LoginScreen")}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    opacity: 0.2,
  },
  circle1: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.3,
    right: -width * 0.2,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  circle2: {
    width: width * 1.2,
    height: width * 1.2,
    bottom: -width * 0.3,
    left: -width * 0.2,
    backgroundColor: "rgba(74, 222, 128, 0.12)",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  backText: {
    color: palette.textPrimary,
    fontSize: 24,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: palette.sidebar,
    justifyContent: "center",
    alignItems: "center",
  },
  logoIcon: {
    fontSize: 20,
    color: palette.card,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: palette.textPrimary,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  formHeader: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: palette.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
  },
  form: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.25)",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: palette.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.25)",
  },
  inputIcon: {
    fontSize: 18,
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    color: palette.textPrimary,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 18,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.accentGreen,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: palette.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  submitArrow: {
    color: palette.textPrimary,
    fontSize: 18,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(100, 116, 139, 0.3)",
  },
  dividerText: {
    color: palette.textSecondary,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.card,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.25)",
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialText: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "500",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: palette.cashBlue,
    fontSize: 14,
    fontWeight: "600",
  },
});
