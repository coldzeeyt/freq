// expo-video's web player calls `video.play()` without handling the promise, so
// scrolling a card away mid-play surfaces "play() was interrupted" rejections.
// Those are expected in a fast-paging feed; swallow only those.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { name?: string; message?: string } | undefined;
    if (reason?.name === 'AbortError' && /play\(\)/.test(reason.message ?? '')) event.preventDefault();
  });
}
export {};
