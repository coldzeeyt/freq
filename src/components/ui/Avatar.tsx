import { Image, StyleSheet, Text, View } from 'react-native';
import { fonts } from '@/theme';
import type { Creator } from '@/types/models';

export function Avatar({ creator, size = 40 }: { creator: Creator; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (creator.avatarUrl) return <Image source={{ uri: creator.avatarUrl }} style={[styles.base, style]} />;
  return (
    <View style={[styles.base, style, { backgroundColor: creator.avatarColor }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{creator.name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(14,13,11,0.9)' },
  initial: { color: '#1A1814', fontFamily: fonts.narrowBold },
});
