import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StationPicker } from '@/components/post/StationPicker';
import { useToast } from '@/components/ui/Toast';
import { POSTABLE_STATIONS } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { colors, fonts, noWebOutline, radius } from '@/theme';
import type { StationId } from '@/types/models';

export default function NewPost() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ station?: string }>();
  const [stationId, setStationId] = useState<StationId | null>(
    POSTABLE_STATIONS.some((s) => s.id === params.station) ? String(params.station) : null,
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = !!stationId && title.trim().length >= 3;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const post = await services.talk.createPost(stationId!, title, body);
      haptics.success();
      router.replace({ pathname: '/talk/post/[id]', params: { id: post.id } });
    } catch (e) {
      haptics.warning();
      toast((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} style={styles.headerBtn} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New post</Text>
        <Pressable onPress={submit} disabled={!ready || busy} style={[styles.postBtn, (!ready || busy) && styles.off]} accessibilityLabel="Post">
          {busy ? <ActivityIndicator color={colors.signalInk} size="small" /> : <Text style={styles.postText}>Post</Text>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(240)} style={styles.field}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.textFaint}
            style={[styles.title, noWebOutline]}
            maxLength={140}
            multiline
            autoFocus
            accessibilityLabel="Title"
          />
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Say more (optional)"
            placeholderTextColor={colors.textFaint}
            style={[styles.text, noWebOutline]}
            maxLength={4000}
            multiline
            accessibilityLabel="Body"
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80).duration(240)} style={styles.field}>
          <Text style={styles.label}>Station</Text>
          <StationPicker value={stationId} onChange={setStationId} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 16 },
  postBtn: { height: 34, minWidth: 64, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  off: { opacity: 0.35 },
  postText: { color: colors.signalInk, fontFamily: fonts.bodyBold, fontSize: 14 },
  body: { padding: 16, gap: 24 },
  field: { gap: 10 },
  title: { color: colors.text, fontFamily: fonts.heavy, fontSize: 22, lineHeight: 28, paddingVertical: 4 },
  text: { color: colors.text, fontFamily: fonts.body, fontSize: 16, lineHeight: 23, minHeight: 140, textAlignVertical: 'top' },
  label: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
});
