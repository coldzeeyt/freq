import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { STATIONS } from '@/data/stations';
import { services } from '@/services';
import type { Account, Creator, NewAccountInput, Preferences, StationId, Video } from '@/types/models';

const DEFAULT_PREFS: Preferences = {
  stationId: 'all',
  humanOnly: false,
  // Browsers block autoplay with sound until the user interacts, so start muted on web.
  muted: Platform.OS === 'web',
};

interface FreqContextValue extends Preferences {
  hydrated: boolean;
  account: Account | null;
  /** The signed-in user as a video author. */
  me: Creator;
  createAccount: (input: NewAccountInput) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setStation: (id: StationId) => void;
  setHumanOnly: (on: boolean) => void;
  setMuted: (muted: boolean) => void;
  likedIds: ReadonlySet<string>;
  toggleLike: (video: Video) => boolean;
}

const FreqContext = createContext<FreqContextValue | null>(null);
const known = new Set(STATIONS.map((s) => s.id));

export function FreqProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const [saved, acct] = await Promise.all([services.preferences.load(), services.auth.currentAccount()]);
      const liked = acct ? await services.likes.getLikedIds() : [];
      setPrefs((p) => ({
        ...p,
        humanOnly: saved.humanOnly ?? p.humanOnly,
        stationId: saved.stationId && known.has(saved.stationId) ? saved.stationId : p.stationId,
        muted: Platform.OS === 'web' ? true : (saved.muted ?? p.muted),
      }));
      setLikedIds(new Set(liked));
      setAccount(acct);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated) services.preferences.save(prefs);
  }, [prefs, hydrated]);

  const update = useCallback((patch: Partial<Preferences>) => setPrefs((p) => ({ ...p, ...patch })), []);

  const toggleLike = useCallback(
    (video: Video) => {
      const next = !likedIds.has(video.id);
      setLikedIds((prev) => {
        const s = new Set(prev);
        if (next) s.add(video.id);
        else s.delete(video.id);
        return s;
      });
      services.likes.setLiked(video.id, next);
      services.signals.record({ type: 'like', videoId: video.id, liked: next }, video);
      return next;
    },
    [likedIds],
  );

  const me = useMemo<Creator>(
    () => ({
      id: account?.id ?? 'me',
      name: account?.name ?? 'You',
      handle: account?.handle ?? 'you',
      verified: false,
      avatarColor: '#EDE6D6',
    }),
    [account],
  );

  const value = useMemo<FreqContextValue>(
    () => ({
      ...prefs,
      hydrated,
      account,
      me,
      createAccount: async (input) => {
        setAccount(await services.auth.createAccount(input));
        setLikedIds(new Set());
      },
      signIn: async (email, password) => {
        setAccount(await services.auth.signIn(email, password));
        setLikedIds(new Set(await services.likes.getLikedIds()));
      },
      signOut: async () => {
        await services.auth.signOut();
        setAccount(null);
        setLikedIds(new Set());
      },
      setStation: (stationId) => update({ stationId }),
      setHumanOnly: (humanOnly) => update({ humanOnly }),
      setMuted: (muted) => update({ muted }),
      likedIds,
      toggleLike,
    }),
    [prefs, hydrated, account, me, update, likedIds, toggleLike],
  );

  return <FreqContext.Provider value={value}>{children}</FreqContext.Provider>;
}

export function useFreq() {
  const ctx = useContext(FreqContext);
  if (!ctx) throw new Error('useFreq must be used inside <FreqProvider>');
  return ctx;
}
