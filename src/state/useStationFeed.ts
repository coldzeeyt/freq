import { useCallback, useEffect, useState } from 'react';
import { services } from '@/services';
import type { StationId, Video } from '@/types/models';

/** Loads a list of videos, reloads when the catalogue changes, and supports pull-to-refresh. */
export function useVideoList(load: () => Promise<Video[]>, key: string) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => services.videos.subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((list) => {
        if (cancelled) return;
        setVideos(list);
        setError(null);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setVideos([]);
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
    // `key` stands in for whatever `load` depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setVideos(await load());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { videos, error, refreshing, refresh, retry: () => setVersion((v) => v + 1) };
}

export function useStationFeed(stationId: StationId, humanOnly: boolean) {
  return useVideoList(() => services.videos.getFeed({ stationId, humanOnly }), `${stationId}:${humanOnly}`);
}
