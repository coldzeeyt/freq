import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Message } from '@/components/post/Message';
import { haptics } from '@/lib/haptics';
import { CaptureChrome } from './CaptureChrome';
import type { DualCaptureProps } from './captureTypes';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function openCamera(facingMode: 'environment' | 'user') {
  try {
    return await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: facingMode }, width: { ideal: 1280 } }, audio: false });
  } catch {
    // Laptops usually have one camera: use whatever there is.
    return navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 } }, audio: false });
  }
}

/** Grabs the current video frame as a 3:4 JPEG blob URL. */
async function snap(video: HTMLVideoElement, mirror: boolean): Promise<string> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const targetH = Math.min(vh, (vw * 4) / 3);
  const targetW = (targetH * 3) / 4;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(targetW);
  canvas.height = Math.round(targetH);
  const ctx = canvas.getContext('2d')!;
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, (vw - targetW) / 2, (vh - targetH) / 2, targetW, targetH, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
  if (!blob) throw new Error('Could not capture a frame');
  return URL.createObjectURL(blob);
}

export function DualCapture({ onCaptured, onCancel }: DualCaptureProps) {
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState<'back' | 'front' | 'busy'>('back');
  const [error, setError] = useState<string | null>(null);
  const supported = !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    openCamera(facing)
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream.current?.getTracks().forEach((t) => t.stop());
        stream.current = s;
        if (videoEl.current) {
          videoEl.current.srcObject = s;
          videoEl.current.onloadeddata = () => setReady(true);
        }
      })
      .catch((e) => setError(`Camera unavailable: ${e.message}`));
    return () => {
      cancelled = true;
    };
  }, [facing, supported]);

  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  if (!supported) return <Message text="This browser can’t use the camera." onCancel={onCancel} />;
  if (error) return <Message text={error} onCancel={onCancel} />;

  const shoot = async () => {
    const video = videoEl.current;
    if (!video) return;
    try {
      haptics.heavy();
      setStage('busy');
      const back = await snap(video, false);
      setStage('front');
      setReady(false);
      setFacing('user');
      // Wait for the front camera to deliver frames.
      for (let i = 0; i < 40 && !(video.readyState >= 2 && video.srcObject !== null && stream.current?.getVideoTracks()[0]?.getSettings().facingMode !== 'environment'); i++) {
        await wait(75);
      }
      await wait(600);
      const front = await snap(video, true);
      haptics.success();
      onCaptured(back, front);
    } catch (e) {
      haptics.warning();
      setError(`Couldn’t take the photos: ${(e as Error).message}`);
    }
  };

  return (
    <View style={styles.fill}>
      {/* Preview at exactly the 3:4 frame that gets saved, so nothing is cropped by surprise. */}
      <View style={styles.frameWrap} pointerEvents="none">
        {createElement('video', {
          ref: videoEl,
          autoPlay: true,
          muted: true,
          playsInline: true,
          style: {
            width: '100%',
            aspectRatio: '3 / 4',
            maxHeight: '100%',
            objectFit: 'cover',
            borderRadius: 18,
            transform: facing === 'user' ? 'scaleX(-1)' : undefined,
          },
        })}
      </View>
      <CaptureChrome stage={stage} ready={ready} onShutter={shoot} onCancel={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  frameWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
});
