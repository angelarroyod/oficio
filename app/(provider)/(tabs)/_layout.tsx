import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { copy } from '@/lib/copy';
import { tabScreenOptions } from '@/lib/navigation';

export default function ProviderTabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: copy.opportunities.title,
          headerShown: false,
          tabBarLabel: copy.tabs.provider.opportunities,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: copy.quote.listTitle,
          tabBarLabel: copy.tabs.provider.quotes,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: copy.schedule.title,
          tabBarLabel: copy.tabs.provider.schedule,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="business"
        options={{
          title: copy.business.title,
          tabBarLabel: copy.tabs.provider.business,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: copy.profile.title,
          tabBarLabel: copy.tabs.provider.profile,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
