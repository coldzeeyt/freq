import '@/lib/webMediaGuard';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/ui/Toast';
import { WebFrame } from '@/components/ui/WebFrame';
import { FreqProvider } from '@/state/FreqProvider';
import { colors } from '@/theme';
import { FONT_MAP } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_MAP);
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <WebFrame>
          <FreqProvider>
            <ToastProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
                <Stack.Screen name="post" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="me" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="lab" options={{ animation: 'slide_from_right' }} />
              </Stack>
            </ToastProvider>
          </FreqProvider>
        </WebFrame>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
