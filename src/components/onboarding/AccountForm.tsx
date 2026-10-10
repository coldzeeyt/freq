import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { backend } from '@/services';
import { colors, fonts, noWebOutline, radius } from '@/theme';
import type { NewAccountInput } from '@/types/models';

type Mode = 'create' | 'login';

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  onCreate: (input: NewAccountInput) => Promise<void>;
  onLogin: (email: string, password: string) => Promise<void>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AccountForm({ mode, onModeChange, onCreate, onLogin }: Props) {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanHandle = handle.replace(/^@/, '');
  const errors = {
    name: mode === 'create' && !name.trim() ? 'What should we call you?' : null,
    handle:
      mode === 'create' && !/^[a-z0-9._]{3,20}$/i.test(cleanHandle) ? '3 to 20 letters, numbers, dots or underscores' : null,
    email: !EMAIL.test(email.trim()) ? 'That email doesn’t look right' : null,
    password: password.length < 8 ? 'At least 8 characters' : null,
  };
  const valid = !Object.values(errors).some(Boolean);

  const submit = async () => {
    setSubmitted(true);
    setError(null);
    if (!valid) {
      haptics.warning();
      return;
    }
    setBusy(true);
    try {
      if (mode === 'create') await onCreate({ name, handle: cleanHandle, email, password });
      else await onLogin(email, password);
      haptics.success();
    } catch (e) {
      haptics.warning();
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  return (
    <View style={styles.wrap}>
      {mode === 'create' && (
        <Animated.View entering={FadeInDown.duration(240)} exiting={FadeOut.duration(120)} style={styles.group}>
          <Field label="Name" value={name} onChangeText={setName} error={show('name')} autoComplete="name" textContentType="name" />
          <Field
            label="Username"
            prefix="@"
            value={cleanHandle}
            onChangeText={(t) => setHandle(t.replace(/\s/g, ''))}
            error={show('handle')}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
          />
        </Animated.View>
      )}
      <Animated.View entering={FadeInDown.delay(60).duration(240)} style={styles.group}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={show('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={show('password')}
          secureTextEntry
          autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
          textContentType={mode === 'create' ? 'newPassword' : 'password'}
          onSubmitEditing={submit}
        />
      </Animated.View>

      {error && (
        <Animated.Text entering={FadeIn} style={styles.formError}>
          {error}
        </Animated.Text>
      )}

      <Pressable
        onPress={submit}
        disabled={busy}
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={mode === 'create' ? 'Create account' : 'Log in'}
      >
        {busy ? (
          <ActivityIndicator color={colors.signalInk} />
        ) : (
          <Text style={styles.primaryText}>{mode === 'create' ? 'Create account' : 'Log in'}</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          haptics.tap();
          setSubmitted(false);
          setError(null);
          onModeChange(mode === 'create' ? 'login' : 'create');
        }}
        hitSlop={8}
        style={styles.switch}
      >
        <Text style={styles.switchText}>
          {mode === 'create' ? 'Already have an account? ' : 'New here? '}
          <Text style={styles.switchLink}>{mode === 'create' ? 'Log in' : 'Create one'}</Text>
        </Text>
      </Pressable>
      {backend === 'device' && <Text style={styles.fine}>Offline mode: this account only lives on this device.</Text>}
    </View>
  );
}

function Field({ label, error, prefix, ...input }: TextInputProps & { label: string; error: string | null; prefix?: string }) {
  const [focused, setFocused] = useState(false);
  const f = useDerivedValue(() => withTiming(focused ? 1 : 0, { duration: 160 }));
  const border = useAnimatedStyle(() => ({
    borderColor: error ? colors.danger : interpolateColor(f.get(), [0, 1], [colors.lineStrong, colors.text]),
  }));
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.inputBox, border]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          {...input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.textFaint}
          style={[styles.input, noWebOutline]}
          accessibilityLabel={label}
        />
      </Animated.View>
      {error && (
        <Animated.Text entering={FadeInDown.duration(160)} style={styles.error}>
          {error}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  group: { gap: 14 },
  field: { gap: 6 },
  label: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  prefix: { color: colors.textFaint, fontFamily: fonts.body, fontSize: 16, marginRight: 2 },
  input: { flex: 1, height: 46, color: colors.text, fontFamily: fonts.body, fontSize: 16 },
  error: { color: colors.danger, fontFamily: fonts.body, fontSize: 12 },
  formError: { color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 14 },
  primary: { height: 52, borderRadius: radius.md, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pressed: { transform: [{ scale: 0.98 }] },
  primaryText: { color: colors.signalInk, fontFamily: fonts.bodyBold, fontSize: 16 },
  switch: { alignSelf: 'center', paddingVertical: 4 },
  switchText: { color: colors.textDim, fontFamily: fonts.body, fontSize: 14 },
  switchLink: { color: colors.text, fontFamily: fonts.bodyBold, textDecorationLine: 'underline' },
  fine: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 10, textAlign: 'center' },
});
