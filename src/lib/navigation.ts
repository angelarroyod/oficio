import { theme } from '@/theme';

/**
 * One header look for every stack in the app. Screen titles come from the
 * navigator, never from a <Text> inside the screen, so the back gesture, the
 * title and the safe area stay the platform's job.
 */
export const stackScreenOptions = {
  headerShadowVisible: false,
  headerTintColor: theme.colors.primary,
  headerStyle: { backgroundColor: theme.colors.surface },
  headerTitleStyle: {
    color: theme.colors.text,
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
  },
  contentStyle: { backgroundColor: theme.colors.background },
} as const;

export const tabScreenOptions = {
  headerShown: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: theme.colors.surface },
  headerTitleStyle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
  },
  tabBarActiveTintColor: theme.colors.primary,
  tabBarInactiveTintColor: theme.colors.textTertiary,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
  tabBarStyle: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
  },
  sceneStyle: { backgroundColor: theme.colors.background },
} as const;
