import { useLocalSearchParams } from 'expo-router';

import { JobDetailScreen } from '@/features/jobs/JobDetailScreen';

export default function ProviderJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <JobDetailScreen jobId={id} viewerRole="provider" />;
}
