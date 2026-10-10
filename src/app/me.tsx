import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { haptics } from '@/lib/haptics';
import { useFreq } from '@/state/FreqProvider';
import { colors, fonts, radius } from '@/theme';

export default function Me() {
  const insets = useSafeAreaInsets();
  const { account, me, signOut, deleteAccount } = useFreq();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={10} style={styles.headerBtn} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(280)} style={styles.profile}>
        <Avatar creator={me} size={72} />
        <Text style={styles.name}>{account?.name ?? 'Guest'}</Text>
        <Text style={styles.handle}>@{me.handle}</Text>
        {account && <Text style={styles.email}>{account.email}</Text>}
      </Animated.View>

      <View style={styles.list}>
        <Row delay={80} icon="flask-outline" label="Test lab" sub="Try the dial, haptics, sound, Human only" onPress={() => router.push('/lab')} />
        <Row delay={140} icon="sparkles-outline" label="Replay welcome" sub="See the intro again" onPress={() => router.push('/welcome?replay=1')} />
        <Row
          delay={200}
          icon="log-out-outline"
          label="Log out"
          onPress={async () => {
            haptics.tap();
            await signOut();
            router.replace('/welcome');
          }}
        />
        {account && (
          <Row
            delay={260}
            icon="trash-outline"
            danger
            label={confirmDelete ? 'Tap again to delete for good' : 'Delete account'}
            sub={confirmDelete ? 'Your account, posts and likes are removed. This can’t be undone.' : undefined}
            onPress={async () => {
              if (!confirmDelete) {
                haptics.warning();
                setConfirmDelete(true);
                return;
              }
              try {
                await deleteAccount();
                router.replace('/welcome');
              } catch (e) {
                toast((e as Error).message);
              }
            }}
          />
        )}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  sub,
  onPress,
  delay,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  onPress: () => void;
  delay: number;
  danger?: boolean;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(260)}>
      <Pressable
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.signal} />
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
          {sub && <Text style={styles.rowSub}>{sub}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', paddingHorizontal: 12 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  profile: { alignItems: 'center', gap: 4, marginTop: 12, marginBottom: 28 },
  name: { color: colors.text, fontFamily: fonts.heavy, fontSize: 24, marginTop: 10, letterSpacing: -0.4 },
  handle: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 13 },
  email: { color: colors.textFaint, fontFamily: fonts.body, fontSize: 13 },
  list: { paddingHorizontal: 16, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  pressed: { transform: [{ scale: 0.985 }] },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15 },
  rowSub: { color: colors.textFaint, fontFamily: fonts.body, fontSize: 12 },
});
