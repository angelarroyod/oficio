import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Screen, Text } from '@/components';
import { theme } from '@/theme';

export default function NotFoundScreen() {
  return (
    <Screen bottomInset>
      <Text variant="h2" style={styles.title}>
        Pantalla no encontrada
      </Text>
      <Link href="/">
        <Text color="primary">Volver al inicio</Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md },
});
