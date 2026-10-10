import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pager } from '@/components/home/Pager';
import { DIAL, DIAL_MARGIN, RadioPage } from '@/components/home/RadioPage';
import { TabHeader } from '@/components/home/TabHeader';
import { OnAirHub } from '@/components/onair/OnAirHub';
import { TalkBoard } from '@/components/talk/TalkBoard';
import { VaultPage } from '@/components/vault/VaultPage';
import { YouPage } from '@/components/you/YouPage';
import { haptics } from '@/lib/haptics';
import { useFreq } from '@/state/FreqProvider';
import { colors } from '@/theme';

const RADIO = 0;
const VAULT = 3;

/** Home: swipe (or tap the tabs) between Radio, Talk, On Air, Vault and You. */
export default function Home() {
  const { hydrated, account, stationId } = useFreq();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(RADIO);
  const position = useSharedValue(0);
  const [focused, setFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  if (hydrated && !account) return <Redirect href="/welcome" />;

  const go = (p: number) => {
    if (p !== page) haptics.detent();
    setPage(p);
  };
  const on = (p: number) => focused && page === p;

  return (
    <View style={styles.screen}>
      <Pager
        page={page}
        onPageChange={go}
        position={position}
        blocked={{ page: RADIO, right: DIAL_MARGIN, bottom: DIAL_MARGIN + insets.bottom, size: DIAL }}
      >
        <RadioPage active={on(0)} />
        <TalkBoard embedded active={on(1)} initialStation={stationId} />
        <OnAirHub embedded active={on(2)} />
        <VaultPage active={on(3)} />
        <YouPage active={on(4)} />
      </Pager>
      <TabHeader
        page={page}
        position={position}
        onSelect={go}
        overVideo={page === RADIO || page === VAULT}
        onPost={() => {
          haptics.tap();
          router.push(page === VAULT ? { pathname: '/post', params: { vault: '1' } } : '/post');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg } });
