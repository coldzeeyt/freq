import { StyleSheet, View } from 'react-native';
import { VideoFeed } from '@/components/feed/VideoFeed';
import { useFreq } from '@/state/FreqProvider';
import { useStationFeed } from '@/state/useStationFeed';

export default function FeedScreen() {
  const { stationId, humanOnly, muted, hydrated } = useFreq();
  const videos = useStationFeed(stationId, humanOnly);

  return (
    <View style={styles.screen}>
      <VideoFeed
        videos={hydrated ? videos : null}
        feedKey={`${stationId}-${humanOnly}`}
        muted={muted}
        holdPlayback={false}
        bottomInset={24}
        showStation={stationId === 'all'}
        emptyMessage="Nothing on air."
      />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#000' } });
