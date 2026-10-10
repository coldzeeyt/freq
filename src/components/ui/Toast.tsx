import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme';

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message });
    timer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(180)}
          exiting={FadeOutUp.duration(180)}
          pointerEvents="none"
          style={[styles.toast, { top: insets.top + 64 }]}
        >
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(26,26,33,0.96)',
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  text: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
