import { useLocalSearchParams } from 'expo-router';
import { TalkBoard } from '@/components/talk/TalkBoard';

/** Standalone route (deep links). The Talk tab embeds the same board. */
export default function BoardRoute() {
  const params = useLocalSearchParams<{ station: string }>();
  return <TalkBoard initialStation={String(params.station ?? 'all')} />;
}
