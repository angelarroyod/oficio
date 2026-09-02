import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, Screen, SegmentedControl, SkeletonCard } from '@/components';
import { JobCard } from '@/features/jobs/JobCard';
import { useMyJobs } from '@/features/jobs/hooks';
import { copy } from '@/lib/copy';
import { ACTIVE_JOB_STATUSES } from '@/lib/domain';
import { theme } from '@/theme';

type Tab = 'upcoming' | 'history';

export default function ClientJobsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('upcoming');
  const jobs = useMyJobs();

  const all = jobs.data ?? [];
  const upcoming = all.filter((job) => ACTIVE_JOB_STATUSES.includes(job.status));
  const history = all.filter((job) => !ACTIVE_JOB_STATUSES.includes(job.status));
  const visible = tab === 'upcoming' ? upcoming : history;

  return (
    <Screen contentStyle={styles.content}>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upcoming', label: copy.job.upcoming, count: upcoming.length },
          { value: 'history', label: copy.job.history, count: history.length },
        ]}
      />

      {jobs.isPending ? (
        <SkeletonCard />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={tab === 'upcoming' ? 'calendar-outline' : 'archive-outline'}
          title={tab === 'upcoming' ? copy.job.emptyUpcoming : copy.job.emptyHistory}
          body={tab === 'upcoming' ? copy.job.emptyUpcomingBody : copy.job.emptyHistoryBody}
        />
      ) : (
        <View style={styles.list}>
          {visible.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              viewerRole="client"
              onPress={() => router.push({ pathname: '/(client)/job/[id]', params: { id: job.id } })}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.lg },
  list: { gap: theme.spacing.md },
});
