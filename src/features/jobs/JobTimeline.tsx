import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { copy } from '@/lib/copy';
import { formatTime } from '@/lib/format';
import { theme } from '@/theme';
import type { Job } from '@/types/database';

const ORDER: Job['status'][] = ['scheduled', 'en_route', 'in_progress', 'completed'];

/**
 * Vertical state machine, drawn. It mirrors `enforce_job_transition()` exactly
 * — if the trigger gains a state, this array is the one place the UI needs to
 * learn about it.
 */
export function JobTimeline({ job }: { job: Job }) {
  if (job.status === 'cancelled') {
    return (
      <View style={styles.cancelled}>
        <Ionicons name="close-circle" size={18} color={theme.colors.danger} />
        <View style={styles.grow}>
          <Text variant="label" color="danger">
            {copy.jobStatus.cancelled}
          </Text>
          {job.cancellation_reason ? (
            <Text variant="bodySm" color="textSecondary">
              {job.cancellation_reason}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  const currentIndex = ORDER.indexOf(job.status);

  return (
    <View style={styles.wrap}>
      {ORDER.map((step, index) => {
        const done = index <= currentIndex;
        const isLast = index === ORDER.length - 1;
        const stamp =
          step === 'in_progress' && job.actual_arrival_at
            ? formatTime(job.actual_arrival_at)
            : step === 'completed' && job.completed_at
              ? formatTime(job.completed_at)
              : null;

        return (
          <View key={step} style={styles.step}>
            <View style={styles.rail}>
              <View style={[styles.dot, done && styles.dotDone]}>
                {done ? (
                  <Ionicons name="checkmark" size={12} color={theme.colors.textOnPrimary} />
                ) : null}
              </View>
              {isLast ? null : <View style={[styles.line, done && styles.lineDone]} />}
            </View>
            <View style={styles.stepBody}>
              <Text variant="label" color={done ? 'text' : 'textTertiary'}>
                {copy.jobStatus[step]}
              </Text>
              {stamp ? (
                <Text variant="caption" color="textSecondary" numeric>
                  {stamp}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  step: { flexDirection: 'row', gap: theme.spacing.md },
  rail: { alignItems: 'center', width: 22 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSunken,
  },
  dotDone: { backgroundColor: theme.colors.primary },
  line: { flex: 1, width: 2, minHeight: 22, backgroundColor: theme.colors.surfaceSunken },
  lineDone: { backgroundColor: theme.colors.primary },
  stepBody: { flex: 1, paddingBottom: theme.spacing.lg, gap: 2 },
  cancelled: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.dangerTint,
  },
  grow: { flex: 1, gap: 2 },
});
