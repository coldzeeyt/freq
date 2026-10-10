import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoFeed } from '@/components/feed/VideoFeed';
import { HEADER_HEIGHT } from '@/components/home/TabHeader';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { useFreq } from '@/state/FreqProvider';
import { useVideoList } from '@/state/useStationFeed';
import { colors, fonts } from '@/theme';

const lockIn = () => {
  haptics.tap();
  router.push({ pathname: '/post', params: { vault: '1' } });
};

/** The Vault: videos that can never be deleted. Not by you, not by Freq. */
export function VaultPage({ active }: { active: boolean }) {
  const insets = useSafeAreaInsets();
  const { muted } = useFreq();
  const vault = useVideoList(() => services.videos.getVault(), 'vault');
  const { refresh } = vault;

  // Fresh each time you open the tab.
  const was = useRef(active);
  useEffect(() => {
    if (active && !was.current) refresh();
    was.current = active;
  }, [active, refresh]);

  return (
    <View style={styles.page}>
      <VideoFeed
        videos={vault.videos}
        feedKey="vault"
        muted={muted}
        holdPlayback={!active}
        railBottom={insets.bottom + 24}
        infoRight={70}
        infoBottom={insets.bottom + 18}
        showStation
        refreshing={vault.refreshing}
        onRefresh={vault.refresh}
        emptyTitle="The Vault is empty."
        emptyMessage="Whatever goes in here stays forever. No one can delete it, not even Freq. Be the first thing that lasts."
        emptyAction={{ label: 'Lock something in', icon: 'lock-closed', onPress: lockIn }}
      />
      <View style={[styles.top, { paddingTop: insets.top + HEADER_HEIGHT + 4 }]} pointerEvents="box-none">
        <View style={styles.titleRow} pointerEvents="none">
          <Ionicons name="lock-closed" size={14} color={colors.text} />
          <Text style={styles.title}>The Vault</Text>
          <Text style={styles.sub}>permanent · no deletes, ever</Text>
        </View>
        {!!vault.videos?.length && (
          <Pressable onPress={lockIn} style={styles.add} hitSlop={8} accessibilityLabel="Lock something in the Vault">
            <Ionicons name="add" size={14} color={colors.text} />
            <Text style={styles.addText}>Lock in</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  title: { color: colors.text, fontFamily: fonts.heavy, fontSize: 20, letterSpacing: -0.4, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 4 },
  sub: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor: 'rgba(14,13,11,0.4)',
  },
  addText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 12 },
});
