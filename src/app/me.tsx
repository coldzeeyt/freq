import { router } from 'expo-router';
import { YouPage } from '@/components/you/YouPage';

/** Standalone route; the You tab embeds the same page. */
export default function Me() {
  return <YouPage embedded={false} onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
