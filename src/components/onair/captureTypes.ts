export interface DualCaptureProps {
  /** Called with local URIs for the back and front photos. */
  onCaptured: (backUri: string, frontUri: string) => void;
  onCancel: () => void;
}
