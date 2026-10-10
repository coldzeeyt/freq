import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/ui/Toast';
import { FreqProvider } from '@/state/FreqProvider';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <FreqProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="post" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            </Stack>
          </ToastProvider>
        </FreqProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
