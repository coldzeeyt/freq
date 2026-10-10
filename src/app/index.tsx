import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PresetBar } from '@/components/dial/PresetBar';
import { StaticOverlay } from '@/components/dial/StaticOverlay';
import { TunerConsole } from '@/components/dial/TunerConsole';
import { VideoFeed } from '@/components/feed/VideoFeed';
import { HumanOnlyToggle } from '@/components/ui/HumanOnlyToggle';
import { useToast } from '@/components/ui/Toast';
import { getStation, STATIONS, stationIndex } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { useFreq } from '@/state/FreqProvider';
import { useStationFeed } from '@/state/useStationFeed';
import { useTuner } from '@/state/useTuner';
import { colors } from '@/theme';

export default function FeedScreen() {
  const { stationId, humanOnly, muted, hydrated, presets, setStation, setMuted, setHumanOnly, savePreset } = useFreq();
  const toast = useToast();
  const videos = useStationFeed(stationId, humanOnly);
  const tuner = useTuner(stationId, setStation);
  const insets = useSafeAreaInsets();
  const [consoleHeight, setConsoleHeight] = useState(150);

  const station = getStation(stationId);
  const displayed = tuner.previewIndex !== null ? STATIONS[tuner.previewIndex] : station;

  const toggleHumanOnly = (on: boolean) => {
    haptics.toggle();
    setHumanOnly(on);
    toast(on ? 'Human Only: showing human-made videos' : 'Showing all videos');
  };

  const storePreset = (slot: number) => {
    savePreset(slot, stationId);
    haptics.success();
    toast(`Saved ${station.frequency.toFixed(1)} ${station.name} to preset ${slot + 1}`);
  };

  return (
    <View style={styles.screen}>
      <VideoFeed
        videos={hydrated ? videos : null}
        feedKey={`${stationId}-${humanOnly}`}
        muted={muted}
        holdPlayback={tuner.tuning}
        bottomInset={consoleHeight}
        showStation={stationId === 'all'}
        emptyMessage={
          humanOnly
            ? `No human-made videos on ${station.frequency.toFixed(1)} ${station.name} yet. Turn off Human Only or be the first to post.`
            : `Nothing on ${station.frequency.toFixed(1)} ${station.name} yet.`
        }
      />

      <StaticOverlay level={tuner.staticLevel} visible={tuner.staticVisible} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.brand}>
          <Ionicons name="radio" size={18} color={colors.glow} />
          <Text style={styles.wordmark}>FREQ</Text>
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
            <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View
        style={[styles.console, { paddingBottom: insets.bottom + 10 }]}
        onLayout={(e) => setConsoleHeight(e.nativeEvent.layout.height)}
        pointerEvents="box-none"
      >
        <TunerConsole
          displayed={displayed}
          committedIndex={stationIndex(stationId)}
          displayedIndex={tuner.previewIndex ?? stationIndex(stationId)}
          tuning={tuner.tuning}
          humanOnly={humanOnly}
          onTuneStart={tuner.onTuneStart}
          onDetent={tuner.onDetent}
          onTuneEnd={tuner.onTuneEnd}
        >
          <PresetBar
            presets={presets}
            current={stationId}
            onSelect={tuner.tuneTo}
            onStore={storePreset}
            onEmptyPress={() => {
              haptics.tap();
              toast('Hold a preset to save the current station');
            }}
          />
        </TunerConsole>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wordmark: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 4 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  console: { position: 'absolute', left: 10, right: 10, bottom: 0 },
});
