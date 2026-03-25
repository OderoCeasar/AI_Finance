import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

type GoogleAuthResult = {
  isLoading: boolean;
  error: string;
  prompt: () => void;
};

type GoogleAuthOptions = {
  expoClientId?: string;
  androidClientId?: string;
  iosClientId?: string;
  webClientId?: string;
  redirectPath?: string;
  onSuccess: (idToken: string) => Promise<void> | void;
};

export function useGoogleAuth({
  expoClientId,
  androidClientId,
  iosClientId,
  webClientId,
  redirectPath,
  onSuccess,
}: GoogleAuthOptions): GoogleAuthResult {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isExpoGo = Constants.appOwnership === 'expo';

  const resolvedIds = useMemo(
    () => ({
      expoClientId:
        expoClientId ??
        process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ??
        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      androidClientId: androidClientId ?? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: iosClientId ?? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      webClientId:
        webClientId ??
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    }),
    [expoClientId, androidClientId, iosClientId, webClientId],
  );

  if (isWeb && !resolvedIds.webClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing in the environment.');
  }

  const owner = Constants.expoConfig?.owner;
  const slug = Constants.expoConfig?.slug;
  const projectNameForProxy =
    (owner && slug ? `@${owner}/${slug}` : undefined) ??
    process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME;

  const useProxy = !isWeb && isExpoGo;
  const proxyRedirectUri = projectNameForProxy
    ? `https://auth.expo.io/${projectNameForProxy}`
    : undefined;
  const redirectUri = useProxy
    ? proxyRedirectUri
    : AuthSession.makeRedirectUri({
        // Use custom scheme for dev builds/standalone, web uses window.location.
        path: isWeb ? redirectPath : undefined,
      });
  if (useProxy && !proxyRedirectUri && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[GoogleAuth] Missing projectNameForProxy. Set EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME to "@owner/slug".'
    );
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      '[GoogleAuth] redirectUri:',
      redirectUri,
      'useProxy:',
      useProxy,
      'projectNameForProxy:',
      projectNameForProxy,
      'appOwnership:',
      Constants.appOwnership,
    );
  }

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: resolvedIds.expoClientId,
    androidClientId: resolvedIds.androidClientId,
    iosClientId: resolvedIds.iosClientId,
    webClientId: resolvedIds.webClientId,
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account',
  });

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') {
      return;
    }
    const hash = window.location.hash;
    if (!hash || !hash.includes('id_token=')) {
      return;
    }
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const idToken = params.get('id_token');
    if (!idToken) {
      setError(params.get('error_description') ?? params.get('error') ?? 'Google sign-in failed.');
      return;
    }
    setIsLoading(true);
    Promise.resolve(onSuccess(idToken))
      .catch((err) => {
        if (err instanceof Error && err.message) {
          setError(err.message);
        } else {
          setError('Google sign-in failed.');
        }
      })
      .finally(() => {
        setIsLoading(false);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      });
  }, [isWeb, onSuccess]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && response) {
      console.log('Google auth response:', response);
    }
    if (response?.type === 'success') {
      const { authentication, params } = response;
      const idToken = authentication?.idToken ?? params?.id_token;
      if (!idToken) {
        const details = params?.error_description || params?.error || 'Unable to read Google ID token.';
        setError(details);
        setIsLoading(false);
        return;
      }

      Promise.resolve(onSuccess(idToken))
        .catch((err) => {
          if (err instanceof Error && err.message) {
            setError(err.message);
          } else {
            setError('Google sign-in failed.');
          }
        })
        .finally(() => {
          setIsLoading(false);
          if (isWeb && typeof window !== 'undefined') {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        });
    }
    if (response && response.type !== 'success') {
      if (response.type === 'error') {
        setError(response.error?.message ?? 'Google sign-in failed.');
      }
      setIsLoading(false);
    }
  }, [response, onSuccess]);

  const prompt = () => {
    setError('');
    if (isWeb) {
      promptAsync({ windowName: '_self' });
      return;
    }
    // Expo Go requires proxy; dev builds/standalone should not use it.
    promptAsync({ useProxy, preferEphemeralSession: true });
  };

  return {
    isLoading: isLoading || !request,
    error,
    prompt,
  };
}
