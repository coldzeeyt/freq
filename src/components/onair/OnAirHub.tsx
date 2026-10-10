import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MomentCard } from '@/components/onair/MomentCard';
import { RadioWaves } from '@/components/onboarding/RadioWaves';
import { useToast } from '@/components/ui/Toast';
import { haptics } from '@/lib/haptics';
import { remindersEnabled, remindersSupported, scheduleOnAirReminders } from '@/lib/onAirReminders';
import { HEADER_HEIGHT } from '@/components/home/TabHeader';
import { services } from '@/services';
import { useFreq } from '@/state/FreqProvider';
import { clock, useOnAirClock } from '@/state/useOnAirClock';
import { colors, fonts, radius } from '@/theme';
import type { OnAirToday } from '@/types/models';

/** On Air: once a day, at a random moment, everyone has 2 minutes to show what they're doing. */
export function OnAirHub({ embedded, active = true }: { embedded?: boolean; active?: boolean }) {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useFreq();
  const toast = useToast();
  const { phase, secondsLeft } = useOnAirClock();
  const [today, setToday] = useState<OnAirToday | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState(false);
  const [confirmRetake, setConfirmRetake] = useState(false);

  const load = useCallback(async () => {
    try {
      setToday(await services.onAir.today());
    } catch (e) {
      toast((e as Error).message);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      if (!active) return;
      services.onAir
        .today()
        .then(setToday)
        .catch((e: Error) => toast(e.message));
    }, [toast, active]),
  );

  // Keep a week of reminders scheduled whenever permission was already given.
  useEffect(() => {
    if (!remindersSupported) return;
    remindersEnabled().then((on) => {
      setReminders(on);
      if (on) scheduleOnAirReminders(false);
    });
  }, []);

  const capture = () => {
    haptics.tap();
    router.push('/onair/capture');
  };

  const mine = today?.mine;

  return (
    <View style={[styles.screen, { paddingTop: embedded ? insets.top + HEADER_HEIGHT : insets.top }]}>
      {!embedded && (
        <View style={styles.header}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} style={styles.headerBtn} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>On Air</Text>
          <View style={styles.headerBtn} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.text}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {!today ? (
          <ActivityIndicator style={styles.loading} color={colors.text} />
        ) : !mine ? (
          <Animated.View entering={FadeIn.duration(260)} style={styles.hero}>
            <View style={styles.waves}>
              <RadioWaves size={260} rings={phase === 'live' ? 5 : 3} />
            </View>
            {phase === 'live' ? (
              <>
                <Text style={styles.kicker}>FREQ IS ON AIR</Text>
                <Text style={styles.countdown}>{clock(secondsLeft)}</Text>
                <Text style={styles.lede}>Two minutes. Show what you’re doing right now, back camera and front.</Text>
                <Primary label="Go On Air" icon="aperture" onPress={capture} />
              </>
            ) : phase === 'late' ? (
              <>
                <Text style={styles.kicker}>TODAY’S WINDOW CLOSED</Text>
                <Text style={styles.title}>You missed it.</Text>
                <Text style={styles.lede}>You can still post. It’ll be marked late.</Text>
                <Primary label="Post late" icon="aperture" onPress={capture} />
              </>
            ) : (
              <>
                <Text style={styles.kicker}>NOT ON AIR YET</Text>
                <Text style={styles.title}>Any minute now.</Text>
                <Text style={styles.lede}>
                  Once a day, at a random moment, Freq goes On Air for everyone. You get 2 minutes to show what you’re doing: both
                  cameras, no uploads, no filters.
                </Text>
                {remindersSupported ? (
                  reminders ? (
                    <Text style={styles.note}>
                      <Ionicons name="notifications" size={12} color={colors.textDim} /> We’ll ping you when it starts.
                    </Text>
                  ) : (
                    <Primary
                      label="Remind me"
                      icon="notifications-outline"
                      ghost
                      onPress={async () => {
                        const ok = await scheduleOnAirReminders(true);
                        setReminders(ok);
                        toast(ok ? 'We’ll ping you when Freq goes On Air' : 'Notifications are off for Freq in Settings');
                      }}
                    />
                  )
                ) : (
                  <Text style={styles.note}>The On Air button at the top of the feed lights up when it’s live.</Text>
                )}
              </>
            )}
            {today.othersCount > 0 && (
              <View style={styles.locked}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.textDim} />
                <Text style={styles.lockedText}>
                  {today.othersCount} {today.othersCount === 1 ? 'person has' : 'people have'} been on air today. Post yours to see them.
                </Text>
              </View>
            )}
          </Animated.View>
        ) : (
          <>
            <Text style={styles.section}>You, today</Text>
            <MomentCard moment={mine} />
            <Pressable
              onPress={async () => {
                if (!confirmRetake) return setConfirmRetake(true);
                await services.onAir.remove();
                setConfirmRetake(false);
                router.push('/onair/capture');
              }}
              style={styles.retake}
            >
              <Text style={[styles.retakeText, confirmRetake && { color: colors.danger }]}>
                {confirmRetake ? 'Tap again to delete and retake' : 'Delete and retake'}
              </Text>
            </Pressable>

            <Text style={styles.section}>Everyone else</Text>
            {today.moments.length === 0 ? (
              <Animated.View entering={FadeInDown} style={styles.emptyOthers}>
                <Text style={styles.emptyTitle}>You’re first today.</Text>
                <Text style={styles.lede}>Tell your friends Freq is On Air.</Text>
              </Animated.View>
            ) : (
              today.moments.map((m, i) => (
                <View key={m.id} style={styles.momentWrap}>
                  <MomentCard moment={m} index={i} />
                  {isAdmin && (
                    <Pressable
                      onPress={async () => {
                        try {
                          await services.onAir.removeById(m.id);
                          toast('Removed');
                          load();
                        } catch (e) {
                          toast((e as Error).message);
                        }
                      }}
                      style={styles.adminDelete}
                      accessibilityLabel={`Remove @${m.author.handle}'s On Air`}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                      <Text style={styles.adminDeleteText}>Remove (admin)</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Primary({ label, icon, onPress, ghost }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; ghost?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primary, ghost && styles.ghost, pressed && { transform: [{ scale: 0.97 }] }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={ghost ? colors.text : colors.signalInk} />
      <Text style={[styles.primaryText, ghost && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 16 },
  body: { paddingHorizontal: 18, gap: 16 },
  loading: { marginTop: 80 },
  hero: { alignItems: 'center', gap: 12, paddingTop: 40 },
  waves: { position: 'absolute', top: 0 },
  kicker: { color: colors.signal, fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1, marginTop: 70 },
  countdown: { color: colors.text, fontFamily: fonts.narrowBold, fontSize: 72, lineHeight: 76, fontVariant: ['tabular-nums'] },
  title: { color: colors.text, fontFamily: fonts.heavy, fontSize: 32, letterSpacing: -1 },
  lede: { color: colors.textDim, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  note: { color: colors.textDim, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 8 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 26,
    borderRadius: 26,
    backgroundColor: colors.signal,
    marginTop: 10,
  },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.lineStrong },
  primaryText: { color: colors.signalInk, fontFamily: fonts.bodyBold, fontSize: 16 },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  lockedText: { flex: 1, color: colors.textDim, fontFamily: fonts.body, fontSize: 13 },
  section: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11, marginTop: 10 },
  retake: { alignSelf: 'center', paddingVertical: 4 },
  retakeText: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 13 },
  emptyOthers: { alignItems: 'center', gap: 4, paddingVertical: 30 },
  emptyTitle: { color: colors.text, fontFamily: fonts.heavy, fontSize: 20 },
  momentWrap: { gap: 8 },
  adminDelete: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' },
  adminDeleteText: { color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 12 },
});
