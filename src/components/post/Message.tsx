import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme';

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
  fill: { flex: 1, backgroundColor: colors.bg },
  message: { alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 },
  messageText: { color: colors.text, fontFamily: fonts.body, fontSize: 16, textAlign: 'center', lineHeight: 23 },
  primary: { backgroundColor: colors.signal, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  primaryText: { color: colors.signalInk, fontFamily: fonts.bodyBold },
  cancel: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 15 },
});
