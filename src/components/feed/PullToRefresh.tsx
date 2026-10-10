import { RefreshControl } from 'react-native';
import { colors } from '@/theme';

/** Phones: the scroll view's own pull-to-refresh. */
export function usePullToRefresh(_getNode: () => HTMLElement | null, enabled: boolean, refreshing: boolean, onRefresh: () => void) {
  return {
    indicator: null,
    nativeRefreshControl: enabled ? (
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} progressViewOffset={120} />
    ) : undefined,
  };
}
