import { useEffect, useState } from 'react';
import { phaseOf, todaysMoment, type OnAirPhase } from '@/lib/onAir';

/** Ticks once a second: today's On Air phase and the seconds left in the window. */
export function useOnAirClock(): { phase: OnAirPhase; secondsLeft: number; startsAt: number } {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const m = todaysMoment(now, new Date(now).getTimezoneOffset());
  return { phase: phaseOf(now, m), secondsLeft: Math.max(0, Math.ceil((m.endsAt - now) / 1000)), startsAt: m.startsAt };
}

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
