export interface CameraRecorderProps {
  onRecorded: (uri: string) => void;
  onCancel: () => void;
}

export const MAX_SECONDS = 60;

export function formatClock(seconds: number) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
