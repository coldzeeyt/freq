import { CameraView, useCameraPermissions, useMicrophonePermissions, type CameraType } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { Message } from './Message';
import { RecorderChrome } from './RecorderChrome';
import { MAX_SECONDS, type CameraRecorderProps } from './recorderTypes';

export function CameraRecorder({ onRecorded, onCancel }: CameraRecorderProps) {
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const camera = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('front');
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - started) / 1000), 200);
    return () => clearInterval(id);
  }, [recording]);

  if (!camPerm || !micPerm) return <View style={styles.fill} />;

  if (!camPerm.granted || !micPerm.granted) {
    return (
      <Message
        text="Freq needs your camera and microphone to record a human-made video."
        action="Allow access"
        onAction={async () => {
          await requestCam();
          await requestMic();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (error) return <Message text={error} onCancel={onCancel} />;

  const toggle = async () => {
    if (!camera.current) return;
    if (recording) {
      camera.current.stopRecording();
      return;
    }
    haptics.heavy();
    setElapsed(0);
    setRecording(true);
    try {
      const result = await camera.current.recordAsync({ maxDuration: MAX_SECONDS });
      setRecording(false);
      if (result?.uri) {
        haptics.success();
        onRecorded(result.uri);
      }
    } catch (e) {
      setRecording(false);
      haptics.warning();
      setError(`Recording failed: ${(e as Error).message}`);
    }
  };

  return (
    <View style={styles.fill}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        mode="video"
        facing={facing}
        onCameraReady={() => setReady(true)}
        onMountError={(e) => setError(`Camera unavailable: ${e.message}. Try "Upload" instead (the iOS Simulator has no camera).`)}
      />
      <RecorderChrome
        recording={recording}
        elapsed={elapsed}
        ready={ready}
        onToggle={toggle}
        onFlip={() => {
          haptics.tap();
          setFacing((f) => (f === 'back' ? 'front' : 'back'));
        }}
        onCancel={onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: '#000' } });
