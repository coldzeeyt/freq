import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Message } from '@/components/post/Message';
import { haptics } from '@/lib/haptics';
import { CaptureChrome } from './CaptureChrome';
import type { DualCaptureProps } from './captureTypes';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One shutter press: back camera, flip, front camera. */
export function DualCapture({ onCaptured, onCancel }: DualCaptureProps) {
  const [perm, request] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState<'back' | 'front' | 'busy'>('back');
  const [error, setError] = useState<string | null>(null);
  const readyWaiter = useRef<(() => void) | null>(null);

  if (!perm) return <View style={styles.fill} />;
  if (!perm.granted) {
    return <Message text="On Air uses your back and front cameras." action="Allow camera" onAction={request} onCancel={onCancel} />;
  }
  if (error) return <Message text={error} onCancel={onCancel} />;

  const shoot = async () => {
    if (!camera.current) return;
    try {
      haptics.heavy();
      setStage('busy');
      const back = await camera.current.takePictureAsync({ quality: 0.7, skipProcessing: false });
      setStage('front');
      setReady(false);
      const flipped = new Promise<void>((r) => (readyWaiter.current = r));
      setFacing('front');
      // Give the front camera a moment to start and expose.
      await Promise.race([flipped, wait(1500)]);
      await wait(700);
      const front = await camera.current!.takePictureAsync({ quality: 0.7 });
      haptics.success();
      if (back?.uri && front?.uri) onCaptured(back.uri, front.uri);
    } catch (e) {
      haptics.warning();
      setError(`Couldn’t take the photos: ${(e as Error).message}`);
    }
  };

  return (
    <View style={styles.fill}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        mode="picture"
        facing={facing}
        mirror={facing === 'front'}
        onCameraReady={() => {
          setReady(true);
          readyWaiter.current?.();
          readyWaiter.current = null;
        }}
        onMountError={(e) => setError(`Camera unavailable: ${e.message}. On Air needs a phone camera.`)}
      />
      <CaptureChrome stage={stage} ready={ready} onShutter={shoot} onCancel={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: '#000' } });
