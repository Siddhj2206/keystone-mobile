import { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Colors, Spacing, Borders, FontSizes, LetterSpacing, Opacity, CommonStyles } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authClient } from '@/lib/auth-client';

export default function RegisterScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('ALL FIELDS ARE REQUIRED');
      return;
    }

    if (password !== confirmPassword) {
      setError('PASSWORDS DO NOT MATCH');
      return;
    }

    if (password.length < 8) {
      setError('PASSWORD MUST BE AT LEAST 8 CHARACTERS');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message?.toUpperCase() || 'REGISTRATION FAILED');
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      setError('AN ERROR OCCURRED');
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
            CREATE YOUR ACCOUNT
          </ThemedText>
        </View>

        {/* Form */}
        <View style={[styles.form, { borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={styles.formTitle}>
            REGISTER
          </ThemedText>

          {error ? (
            <View style={[styles.errorBox, { borderColor: colors.accent }]}>
              <ThemedText style={{ color: colors.accent }}>{error}</ThemedText>
            </View>
          ) : null}

          <Input
            label="NAME"
            placeholder="YOUR NAME"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

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

          <Input
            label="CONFIRM PASSWORD"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title={isLoading ? 'LOADING...' : 'CREATE ACCOUNT'}
            variant="primary"
            onPress={handleRegister}
            disabled={isLoading}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <ThemedText type="label" style={styles.dividerText}>
              OR
            </ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Link href="/(auth)/login" asChild>
            <Button title="BACK TO LOGIN" variant="outline" />
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
