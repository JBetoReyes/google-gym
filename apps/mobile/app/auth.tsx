/**
 * Auth screen — sign in / sign up modal.
 * Replaces the iOS-only Alert.prompt approach in Settings.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type Mode = 'signin' | 'signup';

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <Path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
      <Path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <Path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </Svg>
  );
}

function FacebookIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill="#fff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </Svg>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const { theme } = useTheme();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setOauthLoading(provider);
    setError(null);
    try {
      await signInWithOAuth(provider);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password.trim());
      } else {
        await signUp(email.trim(), password.trim());
      }
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bgPage }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: theme.border }}
        >
          <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <X size={22} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6 pt-8 gap-4">
          {/* Mode toggle */}
          <View
            className="flex-row rounded-xl p-1"
            style={{ backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}
          >
            {(['signin', 'signup'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => { setMode(m); setError(null); }}
                className="flex-1 py-2.5 rounded-lg items-center"
                style={mode === m ? { backgroundColor: theme.accent } : undefined}
              >
                <Text
                  className="font-bold text-sm"
                  style={{ color: mode === m ? '#fff' : theme.textMuted }}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* OAuth buttons */}
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={() => handleOAuth('google')}
              disabled={!!oauthLoading}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                paddingVertical: 13, borderRadius: 12, backgroundColor: '#fff',
                opacity: oauthLoading === 'google' ? 0.6 : 1,
              }}
              activeOpacity={0.85}
            >
              {oauthLoading === 'google'
                ? <ActivityIndicator size="small" color="#333" />
                : <GoogleIcon />
              }
              <Text style={{ color: '#111', fontWeight: '700', fontSize: 15 }}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOAuth('facebook')}
              disabled={!!oauthLoading}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                paddingVertical: 13, borderRadius: 12, backgroundColor: '#1877F2',
                opacity: oauthLoading === 'facebook' ? 0.6 : 1,
              }}
              activeOpacity={0.85}
            >
              {oauthLoading === 'facebook'
                ? <ActivityIndicator size="small" color="#fff" />
                : <FacebookIcon />
              }
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                Continue with Facebook
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '600' }}>or continue with email</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
          </View>

          {/* Email */}
          <View>
            <Text className="text-xs font-semibold uppercase mb-2" style={{ color: theme.textMuted }}>
              Email
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3.5 text-base"
              style={{
                backgroundColor: theme.bgCard,
                borderWidth: 1,
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
              placeholder="you@example.com"
              placeholderTextColor={theme.textMuted}
              value={email}
              onChangeText={t => { setEmail(t); setError(null); }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </View>

          {/* Password */}
          <View>
            <Text className="text-xs font-semibold uppercase mb-2" style={{ color: theme.textMuted }}>
              Password
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3.5 text-base"
              style={{
                backgroundColor: theme.bgCard,
                borderWidth: 1,
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
              placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={t => { setPassword(t); setError(null); }}
              secureTextEntry
              textContentType={mode === 'signin' ? 'password' : 'newPassword'}
            />
          </View>

          {/* Error */}
          {error && (
            <View
              className="px-4 py-3 rounded-xl"
              style={{ backgroundColor: `${theme.danger}18`, borderWidth: 1, borderColor: `${theme.danger}40` }}
            >
              <Text className="text-sm font-medium" style={{ color: theme.danger }}>
                {error}
              </Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="py-4 rounded-xl items-center flex-row justify-center gap-2 mt-2"
            style={{ backgroundColor: loading ? theme.bgCard : theme.accent, opacity: loading ? 0.7 : 1 }}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text className="text-white font-bold text-base">
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
            }
          </TouchableOpacity>

          {/* Hint */}
          {mode === 'signup' && (
            <Text className="text-xs text-center leading-relaxed" style={{ color: theme.textMuted }}>
              By creating an account, your workouts sync across all your devices.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
