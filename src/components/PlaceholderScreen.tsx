import { StyleSheet, View } from 'react-native';

import { copy } from '@/lib/copy';
import { theme } from '@/theme';

import { Badge } from './Badge';
import { Screen } from './Screen';
import { Text } from './Text';

type Props = {
  description: string;
  children?: React.ReactNode;
};

/** Sprint 1 stand-in for feature screens arriving in Sprints 2–3. */
export function PlaceholderScreen({ description, children }: Props) {
  return (
    <Screen>
      <View style={styles.body}>
        <Badge label={copy.placeholders.comingSoon} tone="primary" />
        <Text variant="body" color="textSecondary" style={styles.description}>
          {description}
        </Text>
        {children}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing.md, paddingTop: theme.spacing.md },
  description: { maxWidth: 480 },
});
