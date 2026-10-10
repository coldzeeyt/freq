import { useEffect, useState } from 'react';
import { services } from '@/services';
import type { StationId, Video } from '@/types/models';

export function useStationFeed(stationId: StationId, humanOnly: boolean) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => services.videos.subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let cancelled = false;
    services.videos.listVideos({ stationId, humanOnly }).then((list) => {
      if (!cancelled) setVideos(list);
    });
    return () => {
      cancelled = true;
    };
  }, [stationId, humanOnly, version]);

  return videos;
}
