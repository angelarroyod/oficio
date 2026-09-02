import { useRouter } from 'expo-router';

import { EmptyState, Screen } from '@/components';
import { copy } from '@/lib/copy';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen bottomInset>
      <EmptyState
        icon="compass-outline"
        title="Pantalla no encontrada"
        body="La ruta que abriste ya no existe."
        actionLabel={copy.common.back}
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
