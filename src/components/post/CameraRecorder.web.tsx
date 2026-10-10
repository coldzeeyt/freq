import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { Message } from './Message';
import { RecorderChrome } from './RecorderChrome';
import { MAX_SECONDS, type CameraRecorderProps } from './recorderTypes';

/** expo-camera can't record video on web, so use getUserMedia + MediaRecorder. */
export function CameraRecorder({ onRecorded, onCancel }: CameraRecorderProps) {
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supported = !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  useEffect(() => {
    let cancelled = false;
    if (!supported) return;
    navigator.mediaDevices
      .getUserMedia({
        // Ask only for a camera and a sensible resolution. Forcing a portrait size made phones
        // pick a cropped (zoomed-in) sensor mode.
        video: { facingMode: facing, width: { ideal: 1280 } },
        audio: true,
      })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream.current = s;
        if (videoEl.current) videoEl.current.srcObject = s;
        setReady(true);
      })
      .catch((e) => setError(`Camera unavailable: ${e.message}`));
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
    };
  }, [facing, supported]);

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const id = setInterval(() => {
      const s = (Date.now() - started) / 1000;
      setElapsed(s);
      if (s >= MAX_SECONDS) recorder.current?.stop();
    }, 200);
    return () => clearInterval(id);
  }, [recording]);

  if (!supported) return <Message text='This browser can’t record video. Try "Upload" instead.' onCancel={onCancel} />;
  if (error) return <Message text={error} onCancel={onCancel} />;

  const toggle = () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    if (!stream.current) return;
    const mimeType = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      setRecording(false);
      const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' });
      if (blob.size) {
        haptics.success();
        onRecorded(URL.createObjectURL(blob));
      }
    };
    recorder.current = rec;
    haptics.heavy();
    setElapsed(0);
    rec.start(250);
    setRecording(true);
  };

  return (
    <View style={styles.fill}>
      {createElement('video', {
        ref: videoEl,
        autoPlay: true,
        muted: true,
        playsInline: true,
        style: {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          // Show the whole camera picture (no crop-zoom); what you see is what's recorded.
          objectFit: 'contain',
          backgroundColor: '#000',
          transform: facing === 'user' ? 'scaleX(-1)' : undefined,
        },
      })}
      <RecorderChrome
        recording={recording}
        elapsed={elapsed}
        ready={ready}
        onToggle={toggle}
        onFlip={() => {
          haptics.tap();
          setReady(false);
          setFacing((f) => (f === 'user' ? 'environment' : 'user'));
        }}
        onCancel={onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: '#000' } });
