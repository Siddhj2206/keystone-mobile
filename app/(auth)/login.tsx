import { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Colors, Spacing, Borders, FontSizes, LetterSpacing, Opacity, CommonStyles } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authClient, guestAuth } from '@/lib/auth-client';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('ALL FIELDS ARE REQUIRED');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message?.toUpperCase() || 'LOGIN FAILED');
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      setError('AN ERROR OCCURRED');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await guestAuth.enableGuestMode();
      router.replace('/(tabs)');
    } catch {
      setError('FAILED TO ENABLE GUEST MODE');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.logo}>
            KEYSTONE
          </ThemedText>
          <ThemedText style={styles.tagline}>
            MASTER YOUR SCHEDULE
          </ThemedText>
        </View>

        {/* Form */}
        <View style={[styles.form, { borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={styles.formTitle}>
            LOGIN
          </ThemedText>

          {error ? (
            <View style={[styles.errorBox, { borderColor: colors.accent }]}>
              <ThemedText style={{ color: colors.accent }}>{error}</ThemedText>
            </View>
          ) : null}

          <Input
            label="EMAIL"
            placeholder="YOUR@EMAIL.COM"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="PASSWORD"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title={isLoading ? 'LOADING...' : 'LOGIN'}
            variant="primary"
            onPress={handleLogin}
            disabled={isLoading}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <ThemedText type="label" style={styles.dividerText}>
              OR
            </ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Button
            title="CONTINUE AS GUEST"
            variant="outline"
            onPress={handleGuestLogin}
            disabled={isLoading}
          />

          <Link href="/(auth)/register" asChild>
            <Button title="CREATE ACCOUNT" variant="ghost" />
          </Link>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    fontSize: FontSizes.xxxl,
    letterSpacing: LetterSpacing.extraWide,
  },
  tagline: {
    marginTop: Spacing.sm,
    opacity: Opacity.muted,
  },
  form: {
    borderWidth: Borders.thick,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorBox: CommonStyles.errorBox,
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  dividerLine: CommonStyles.dividerLine,
  dividerText: {
    marginHorizontal: Spacing.md,
  },
});
