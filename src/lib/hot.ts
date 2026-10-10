/**
 * Reddit's "hot" rank: the log of the score, so the 10th vote counts as much as
 * the next 90, plus time, so newer posts climb. 12.5 hours is worth 10x the votes.
 */
export function hotScore(score: number, createdAt: string | Date): number {
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = new Date(createdAt).getTime() / 1000 - 1134028003;
  return sign * order + seconds / 45000;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / (86400 * 30))}mo`;
}
