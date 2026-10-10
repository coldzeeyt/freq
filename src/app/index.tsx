import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BandDisplay } from '@/components/dial/BandDisplay';
import { StaticOverlay } from '@/components/dial/StaticOverlay';
import { TuningDial } from '@/components/dial/TuningDial';
import { VideoFeed } from '@/components/feed/VideoFeed';
import { StationBar } from '@/components/stations/StationBar';
import { StationSheet } from '@/components/stations/StationSheet';
import { HumanOnlyToggle } from '@/components/ui/HumanOnlyToggle';
import { useToast } from '@/components/ui/Toast';
import { getStation, STATIONS, stationIndex } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { MAX_PINNED, useFreq } from '@/state/FreqProvider';
import { useStationFeed } from '@/state/useStationFeed';
import { useTuner } from '@/state/useTuner';
import { colors, fonts } from '@/theme';
import type { StationId } from '@/types/models';

const DIAL = 92;
const DIAL_MARGIN = 10;

export default function FeedScreen() {
  const { stationId, humanOnly, muted, hydrated, pinned, setStation, setMuted, setHumanOnly, togglePin } = useFreq();
  const videos = useStationFeed(stationId, humanOnly);
  const tuner = useTuner(stationId, setStation);
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [counts, setCounts] = useState<Record<StationId, number>>({});
  const [focused, setFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    services.videos.countByStation(humanOnly).then(setCounts);
  }, [humanOnly, sheetOpen]);

  const station = getStation(stationId);
  const displayed = tuner.previewIndex !== null ? STATIONS[tuner.previewIndex] : station;

  // ← / → tune on desktop browsers.
  const { tuneTo } = tuner;
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || sheetOpen) return;
      const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!delta) return;
      e.preventDefault();
      const i = (stationIndex(stationId) + delta + STATIONS.length) % STATIONS.length;
      tuneTo(STATIONS[i].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stationId, tuneTo, sheetOpen]);

  const toggleHumanOnly = (on: boolean) => {
    haptics.toggle();
    setHumanOnly(on);
    toast(on ? 'Human only: camera recordings and verified creators' : 'Showing everything');
  };

  const onTogglePin = (id: StationId) => {
    const s = getStation(id);
    const wasPinned = pinned.includes(id);
    if (!togglePin(id)) {
      haptics.warning();
      toast(`The bar holds ${MAX_PINNED}. Unpin one first.`);
      return;
    }
    haptics.success();
    toast(wasPinned ? `Unpinned ${s.name}` : `Pinned ${s.name}`);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.stage}>
        <VideoFeed
          videos={hydrated ? videos : null}
          feedKey={`${stationId}-${humanOnly}`}
          muted={muted}
          holdPlayback={tuner.tuning || !focused || sheetOpen}
          railBottom={DIAL + DIAL_MARGIN * 2 + 4}
          infoRight={DIAL + DIAL_MARGIN * 2}
          showStation={stationId === 'all'}
          emptyMessage={
            humanOnly
              ? `No human-made videos on ${station.frequency.toFixed(1)} ${station.name} yet. Turn off Human only, or record the first one.`
              : `Nothing on ${station.frequency.toFixed(1)} ${station.name} yet.`
          }
        />

        <StaticOverlay level={tuner.staticLevel} visible={tuner.staticVisible} />

        <LinearGradient
          colors={['rgba(14,13,11,0.82)', 'rgba(14,13,11,0.4)', 'rgba(14,13,11,0)']}
          style={[styles.topScrim, { height: insets.top + 140 }]}
          pointerEvents="none"
        />

        <View style={[styles.top, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
          <View style={styles.topRow}>
            <View style={styles.brand}>
              <Text style={styles.wordmark}>freq</Text>
              <View style={styles.led} />
            </View>
            <View style={styles.topActions}>
              <HumanOnlyToggle value={humanOnly} onChange={toggleHumanOnly} />
              <Pressable
                onPress={() => {
                  haptics.tap();
                  setMuted(!muted);
                }}
                style={styles.iconButton}
                hitSlop={8}
                accessibilityLabel={muted ? 'Unmute' : 'Mute'}
              >
                <Ionicons name={muted ? 'volume-mute-outline' : 'volume-high-outline'} size={20} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() => {
                  haptics.tap();
                  router.push('/post');
                }}
                style={[styles.iconButton, styles.postButton]}
                hitSlop={8}
                accessibilityLabel="New post"
              >
                <Ionicons name="add" size={22} color={colors.signalInk} />
              </Pressable>
            </View>
          </View>
          <BandDisplay station={displayed} tuning={tuner.tuning} />
          {muted && Platform.OS === 'web' && (
            <Animated.View entering={FadeIn.delay(800)}>
              <Pressable onPress={() => setMuted(false)} style={styles.soundHint} accessibilityLabel="Turn sound on">
                <Ionicons name="volume-mute-outline" size={12} color={colors.textDim} />
                <Text style={styles.soundHintText}>tap for sound</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>

        <View style={styles.dial}>
          <TuningDial
            count={STATIONS.length}
            index={stationIndex(stationId)}
            litIndex={tuner.previewIndex ?? stationIndex(stationId)}
            size={DIAL}
            onTuneStart={tuner.onTuneStart}
            onDetent={tuner.onDetent}
            onTuneEnd={tuner.onTuneEnd}
          />
        </View>
      </View>

      <StationBar
        pinned={pinned}
        current={stationId}
        previewing={tuner.previewIndex !== null ? STATIONS[tuner.previewIndex].id : null}
        onSelect={tuner.tuneTo}
        onMore={() => {
          haptics.tap();
          setSheetOpen(true);
        }}
        bottomInset={insets.bottom}
      />

      <StationSheet
        open={sheetOpen}
        current={stationId}
        pinned={pinned}
        counts={counts}
        onClose={() => setSheetOpen(false)}
        onSelect={tuner.tuneTo}
        onTogglePin={onTogglePin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  stage: { flex: 1 },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  wordmark: { color: colors.text, fontFamily: fonts.heavy, fontSize: 24, letterSpacing: -1 },
  led: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.signal, marginTop: 6 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor: 'rgba(14,13,11,0.35)',
  },
  postButton: { backgroundColor: colors.signal, borderColor: colors.signal },
  soundHint: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  soundHintText: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 11 },
  dial: { position: 'absolute', right: DIAL_MARGIN, bottom: DIAL_MARGIN },
});
