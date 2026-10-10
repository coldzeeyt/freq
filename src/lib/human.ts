import type { Video } from '@/types/models';

/**
 * The single rule for the "Human" badge and the Human Only filter:
 * recorded with the in-app camera, or uploaded by a verified creator.
 */
export function isHumanMade(video: Video): boolean {
  return video.origin === 'camera' || video.creator.verified;
}
