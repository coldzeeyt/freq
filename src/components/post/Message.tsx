import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

export function Message({
  text,
  action,
  onAction,
  onCancel,
}: {
  text: string;
  action?: string;
  onAction?: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={[styles.fill, styles.message]}>
      <Text style={styles.messageText}>{text}</Text>
      {action && (
        <Pressable style={styles.primary} onPress={onAction}>
          <Text style={styles.primaryText}>{action}</Text>
        </Pressable>
      )}
      <Pressable onPress={onCancel} hitSlop={10}>
        <Text style={styles.cancel}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  message: { alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 },
  messageText: { color: colors.text, fontSize: 16, textAlign: 'center', lineHeight: 23 },
  primary: { backgroundColor: colors.glow, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 999 },
  primaryText: { color: '#1A1205', fontWeight: '800' },
  cancel: { color: colors.textDim, fontSize: 15, fontWeight: '600' },
});
