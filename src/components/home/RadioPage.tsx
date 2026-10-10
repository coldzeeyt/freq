import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BandDisplay } from '@/components/dial/BandDisplay';
import { StaticOverlay } from '@/components/dial/StaticOverlay';
import { TuningDial } from '@/components/dial/TuningDial';
import { VideoFeed } from '@/components/feed/VideoFeed';
import { HumanOnlyToggle } from '@/components/ui/HumanOnlyToggle';
import { useToast } from '@/components/ui/Toast';
import { getStation, STATIONS, stationIndex } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { useFreq } from '@/state/FreqProvider';
import { useStationFeed } from '@/state/useStationFeed';
import { useTuner } from '@/state/useTuner';
import { colors, fonts } from '@/theme';
import { HEADER_HEIGHT } from './TabHeader';

export const DIAL = 80;
export const DIAL_MARGIN = 10;

/** The Radio tab: the vertical feed for the tuned station, and the dial. */
export function RadioPage({ active }: { active: boolean }) {
  const { stationId, humanOnly, muted, hydrated, setStation, setMuted, setHumanOnly } = useFreq();
  const feed = useStationFeed(stationId, humanOnly);
  const tuner = useTuner(stationId, setStation);
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const station = getStation(stationId);
  const displayed = tuner.previewIndex !== null ? STATIONS[tuner.previewIndex] : station;

  // ← / → turn the dial on desktop browsers.
  const { tuneTo } = tuner;
  useEffect(() => {
    if (Platform.OS !== 'web' || !active) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!delta) return;
      e.preventDefault();
      tuneTo(STATIONS[(stationIndex(stationId) + delta + STATIONS.length) % STATIONS.length].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stationId, tuneTo, active]);

  return (
    <View style={styles.page}>
      <VideoFeed
        videos={hydrated ? feed.videos : null}
        feedKey={`${stationId}-${humanOnly}`}
        muted={muted}
        holdPlayback={tuner.tuning || !active}
        railBottom={DIAL + DIAL_MARGIN * 2 + insets.bottom + 4}
        infoRight={DIAL + DIAL_MARGIN * 2}
        infoBottom={insets.bottom + 18}
        showStation={stationId === 'all'}
        refreshing={feed.refreshing}
        onRefresh={feed.refresh}
        emptyTitle={feed.error ? 'No signal.' : 'There aren’t enough videos on Freq yet.'}
        emptyMessage={
          feed.error
            ? feed.error
            : stationId === 'all'
              ? 'Be one of the first to go on air. Record one now!'
              : `Be the first on ${station.frequency.toFixed(1)} ${station.name}. Record one now!`
        }
        emptyAction={
          feed.error
            ? { label: 'Try again', icon: 'refresh', onPress: feed.retry }
            : {
                label: 'Record one now',
                icon: 'radio-button-on',
                onPress: () => {
                  haptics.tap();
                  router.push({ pathname: '/post', params: { start: 'record' } });
                },
              }
        }
      />

      <StaticOverlay level={tuner.staticLevel} visible={tuner.staticVisible} />

      <View style={[styles.top, { paddingTop: insets.top + HEADER_HEIGHT + 2 }]} pointerEvents="box-none">
        <BandDisplay
          station={displayed}
          tuning={tuner.tuning}
          bandOnlyWhileTuning
          trailing={
            <View style={styles.readoutActions}>
              <HumanOnlyToggle
                value={humanOnly}
                onChange={(on) => {
                  haptics.toggle();
                  setHumanOnly(on);
                  toast(on ? 'Human only: camera recordings and verified creators' : 'Showing everything');
                }}
              />
              <Pressable
                onPress={() => {
                  haptics.tap();
                  setMuted(!muted);
                }}
                hitSlop={12}
                style={styles.mute}
                accessibilityLabel={muted ? 'Unmute' : 'Mute'}
              >
                {muted && Platform.OS === 'web' && (
                  <Animated.Text entering={FadeIn.delay(800)} style={styles.soundHintText}>
                    sound off
                  </Animated.Text>
                )}
                <Ionicons name={muted ? 'volume-mute-outline' : 'volume-high-outline'} size={18} color={colors.textDim} />
              </Pressable>
            </View>
          }
        />
      </View>

      <View style={[styles.dial, { bottom: DIAL_MARGIN + insets.bottom }]}>
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
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16 },
  readoutActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mute: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  soundHintText: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 10 },
  dial: { position: 'absolute', right: DIAL_MARGIN },
});
