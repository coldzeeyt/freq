import { Image, StyleSheet, Text, View } from 'react-native';
import type { Creator } from '@/types/models';

export function Avatar({ creator, size = 44 }: { creator: Creator; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (creator.avatarUrl) return <Image source={{ uri: creator.avatarUrl }} style={[styles.base, style]} />;
  return (
    <View style={[styles.base, style, { backgroundColor: creator.avatarColor }]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{creator.name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  initial: { color: '#0B0B0F', fontWeight: '800' },
});
