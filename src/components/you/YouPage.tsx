import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_HEIGHT } from '@/components/home/TabHeader';
import { Avatar } from '@/components/ui/Avatar';
import { InstallTip } from '@/components/ui/InstallTip';
import { useToast } from '@/components/ui/Toast';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { useFreq } from '@/state/FreqProvider';
import { colors, fonts, radius } from '@/theme';
import type { Video } from '@/types/models';
import { VideoRow } from './VideoRow';

type Scope = 'mine' | 'everyone';

/** The You tab: your profile, your videos (delete them here), and settings. */
export function YouPage({ active = true, embedded = true, onClose }: { active?: boolean; embedded?: boolean; onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { account, me, isAdmin, signOut, deleteAccount } = useFreq();
  const [scope, setScope] = useState<Scope>('mine');
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      setVideos(await (scope === 'everyone' ? services.videos.listAll() : services.videos.listMine()));
    } catch (e) {
      setVideos([]);
      toast((e as Error).message);
    }
  }, [scope, toast]);

  useEffect(() => {
    let cancelled = false;
    (scope === 'everyone' ? services.videos.listAll() : services.videos.listMine())
      .then((v) => !cancelled && setVideos(v))
      .catch((e: Error) => {
        if (cancelled) return;
        setVideos([]);
        toast(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [scope, toast]);

  const was = useRef(active);
  useEffect(() => {
    if (active && !was.current) load();
    was.current = active;
  }, [active, load]);

  const remove = async (v: Video) => {
    try {
      await services.videos.deleteVideo(v.id);
      haptics.success();
      setVideos((list) => list?.filter((x) => x.id !== v.id) ?? null);
      toast('Video deleted');
    } catch (e) {
      haptics.warning();
      toast((e as Error).message);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: embedded ? insets.top + HEADER_HEIGHT : insets.top + 8 }]}>
      {!embedded && (
        <View style={styles.closeRow}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
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
        <Animated.View entering={FadeInDown.duration(260)} style={styles.profile}>
          <Avatar creator={me} size={64} />
          <View style={styles.profileText}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{account?.name ?? 'Guest'}</Text>
              {isAdmin && <Text style={styles.admin}>ADMIN</Text>}
            </View>
            <Text style={styles.handle}>@{me.handle}</Text>
            {account && <Text style={styles.email}>{account.email}</Text>}
          </View>
        </Animated.View>

        <InstallTip delay={40} />

        <View style={styles.sectionHead}>
          <Text style={styles.section}>{scope === 'mine' ? 'Your videos' : 'Everyone’s videos'}</Text>
          {isAdmin && (
            <View style={styles.scope}>
              {(['mine', 'everyone'] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    haptics.tap();
                    setVideos(null);
                    setScope(s);
                  }}
                  style={[styles.scopeBtn, scope === s && styles.scopeOn]}
                >
                  <Text style={[styles.scopeText, scope === s && styles.scopeTextOn]}>{s === 'mine' ? 'Mine' : 'Everyone'}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        {videos === null ? (
          <ActivityIndicator color={colors.text} style={styles.loading} />
        ) : videos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{scope === 'mine' ? 'You haven’t posted yet.' : 'Nothing posted yet.'}</Text>
            {scope === 'mine' && (
              <Pressable onPress={() => router.push({ pathname: '/post', params: { start: 'record' } })} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Record one now</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {videos.map((v) => (
              <VideoRow key={v.id} video={v} showAuthor={scope === 'everyone'} onDelete={remove} />
            ))}
          </View>
        )}

        <Text style={styles.section}>Settings</Text>
        <View style={styles.list}>
          <Row icon="flask-outline" label="Test lab" sub="Try the dial, haptics, sound, Human only" onPress={() => router.push('/lab')} />
          <Row icon="sparkles-outline" label="Replay welcome" sub="See the intro again" onPress={() => router.push('/welcome?replay=1')} />
          <Row
            icon="log-out-outline"
            label="Log out"
            onPress={async () => {
              await signOut();
              router.replace('/welcome');
            }}
          />
          {account && (
            <Row
              icon="trash-outline"
              danger
              label={confirmDelete ? 'Tap again to delete for good' : 'Delete account'}
              sub={confirmDelete ? 'Your account, posts and likes are removed. Vault videos stay, without your name.' : undefined}
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
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  sub,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  closeRow: { flexDirection: 'row', paddingHorizontal: 12 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  profileText: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: colors.text, fontFamily: fonts.heavy, fontSize: 22, letterSpacing: -0.4 },
  admin: { color: colors.bg, backgroundColor: colors.signal, fontFamily: fonts.monoMedium, fontSize: 9, letterSpacing: 0.8, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, overflow: 'hidden' },
  handle: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 12 },
  email: { color: colors.textFaint, fontFamily: fonts.body, fontSize: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  section: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11, marginTop: 10 },
  scope: { flexDirection: 'row', gap: 4, marginTop: 10 },
  scopeBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.lineStrong },
  scopeOn: { backgroundColor: colors.text, borderColor: colors.text },
  scopeText: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 12 },
  scopeTextOn: { color: colors.bg },
  loading: { marginVertical: 20 },
  list: { gap: 8 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  emptyText: { color: colors.textDim, fontFamily: fonts.body, fontSize: 14 },
  emptyBtn: { paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: colors.signal, justifyContent: 'center' },
  emptyBtnText: { color: colors.signalInk, fontFamily: fonts.bodyBold, fontSize: 14 },
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
