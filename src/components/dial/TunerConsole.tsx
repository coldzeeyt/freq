import { StyleSheet, View } from 'react-native';
import { STATIONS } from '@/data/stations';
import type { Station } from '@/types/models';
import { FrequencyDisplay } from './FrequencyDisplay';
import { TuningDial } from './TuningDial';

interface Props {
  displayed: Station;
  committedIndex: number;
  displayedIndex: number;
  tuning: boolean;
  humanOnly: boolean;
  onTuneStart: () => void;
  onDetent: (index: number) => void;
  onTuneEnd: (index: number) => void;
  /** Rendered under the display (presets). */
  children?: React.ReactNode;
}

export const DIAL_SIZE = 116;

/** The radio faceplate docked at the bottom of the feed. */
export function TunerConsole({ displayed, committedIndex, displayedIndex, tuning, humanOnly, children, ...dial }: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.left}>
        <FrequencyDisplay station={displayed} tuning={tuning} humanOnly={humanOnly} />
        {children}
      </View>
      <TuningDial count={STATIONS.length} index={committedIndex} litIndex={displayedIndex} size={DIAL_SIZE} accent={displayed.color} {...dial} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    paddingRight: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(14,14,18,0.86)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  left: { flex: 1, gap: 8 },
});
