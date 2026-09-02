import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, Screen, SectionHeader, SegmentedControl, SkeletonCard } from '@/components';
import { JobCard } from '@/features/jobs/JobCard';
import { useMyJobs } from '@/features/jobs/hooks';
import { copy } from '@/lib/copy';
import { ACTIVE_JOB_STATUSES } from '@/lib/domain';
import { formatDayLabel } from '@/lib/format';
import { theme } from '@/theme';

type Tab = 'today' | 'week';

function isSameDate(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/**
 * The provider's day. Grouped by day rather than listed flat because the
 * question being asked is "what is left today", not "what do I have".
 */
export default function ProviderScheduleScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('today');
  const jobs = useMyJobs();

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const active = (jobs.data ?? []).filter((job) => ACTIVE_JOB_STATUSES.includes(job.status));
  const today = active.filter((job) => isSameDate(new Date(job.window_start), now));
  const week = active.filter((job) => {
    const start = new Date(job.window_start);
    return start <= weekEnd;
  });
  const visible = tab === 'today' ? today : week;

  const groups = visible.reduce<Record<string, typeof visible>>((acc, job) => {
    const key = formatDayLabel(job.window_start);
    acc[key] = [...(acc[key] ?? []), job];
    return acc;
  }, {});

  return (
    <Screen contentStyle={styles.content}>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'today', label: copy.schedule.today, count: today.length },
          { value: 'week', label: copy.schedule.week, count: week.length },
        ]}
      />

      {jobs.isPending ? (
        <SkeletonCard />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={tab === 'today' ? copy.schedule.emptyToday : copy.schedule.emptyWeek}
          body={tab === 'today' ? copy.schedule.emptyTodayBody : copy.schedule.emptyWeekBody}
        />
      ) : (
        Object.entries(groups).map(([day, dayJobs]) => (
          <View key={day} style={styles.group}>
            <SectionHeader title={day} subtitle={dayJobs.length + ' ' + copy.schedule.title} />
            {dayJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                viewerRole="provider"
                onPress={() =>
                  router.push({ pathname: '/(provider)/job/[id]', params: { id: job.id } })
                }
              />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.lg },
  group: { gap: theme.spacing.md },
});
