import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, Screen, SegmentedControl, SkeletonCard } from '@/components';
import { RequestCard, quotesFootnote } from '@/features/requests/RequestCard';
import { useMyRequests } from '@/features/requests/hooks';
import { copy } from '@/lib/copy';
import { ACTIVE_REQUEST_STATUSES } from '@/lib/domain';
import { theme } from '@/theme';

type Tab = 'active' | 'history';

export default function ClientRequestsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('active');
  const requests = useMyRequests();

  const all = requests.data ?? [];
  const active = all.filter((request) => ACTIVE_REQUEST_STATUSES.includes(request.status));
  const history = all.filter((request) => !ACTIVE_REQUEST_STATUSES.includes(request.status));
  const visible = tab === 'active' ? active : history;

  return (
    <Screen
      contentStyle={styles.content}
      footer={
        <Button
          title={copy.clientHome.newRequest}
          variant="accent"
          onPress={() => router.push('/(client)/new-request')}
        />
      }
    >
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: copy.request.active, count: active.length },
          { value: 'history', label: copy.request.history, count: history.length },
        ]}
      />

      {requests.isPending ? (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={tab === 'active' ? 'clipboard-outline' : 'archive-outline'}
          title={tab === 'active' ? copy.request.emptyActive : copy.request.emptyHistory}
          body={tab === 'active' ? copy.request.emptyActiveBody : copy.request.emptyHistoryBody}
        />
      ) : (
        <View style={styles.list}>
          {visible.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              footnote={quotesFootnote(request.quotes.filter((q) => q.status === 'sent').length)}
              onPress={() =>
                router.push({ pathname: '/(client)/request/[id]', params: { id: request.id } })
              }
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
