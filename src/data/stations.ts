import type { Station, StationId } from '@/types/models';

/** Ordered around the dial by ascending frequency. */
export const STATIONS: Station[] = [
  { id: 'all', name: 'All', frequency: 88.1, color: '#FFB547' },
  { id: 'music', name: 'Music', frequency: 89.7, color: '#B57BFF' },
  { id: 'gaming', name: 'Gaming', frequency: 91.5, color: '#5CE1E6' },
  { id: 'sports', name: 'Sports', frequency: 93.3, color: '#4ADE80' },
  { id: 'food', name: 'Food', frequency: 95.1, color: '#FF8A5B' },
  { id: 'tech', name: 'Tech', frequency: 96.9, color: '#5B9DFF' },
  { id: 'art', name: 'Art', frequency: 98.7, color: '#FF6FB5' },
  { id: 'fitness', name: 'Fitness', frequency: 100.5, color: '#C6F432' },
  { id: 'pets', name: 'Pets', frequency: 102.1, color: '#FFD166' },
  { id: 'comedy', name: 'Comedy', frequency: 104.3, color: '#FFE14D' },
  { id: 'fashion', name: 'Fashion', frequency: 105.5, color: '#F472B6' },
  { id: 'science', name: 'Science', frequency: 106.7, color: '#7DD3FC' },
  { id: 'travel', name: 'Travel', frequency: 107.9, color: '#34D399' },
];

export const POSTABLE_STATIONS = STATIONS.filter((s) => s.id !== 'all');

export const FREQ_MIN = 87.5;
export const FREQ_MAX = 108.5;

export function getStation(id: StationId): Station {
  return STATIONS.find((s) => s.id === id) ?? STATIONS[0];
}

export function stationIndex(id: StationId): number {
  return Math.max(0, STATIONS.findIndex((s) => s.id === id));
}

export function formatFrequency(station: Station): string {
  return station.frequency.toFixed(1);
}
