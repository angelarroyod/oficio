import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { copy } from '@/lib/copy';
import { tabScreenOptions } from '@/lib/navigation';

export default function ClientTabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.client.home,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: copy.request.listTitle,
          tabBarLabel: copy.tabs.client.requests,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: copy.job.listTitle,
          tabBarLabel: copy.tabs.client.jobs,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: copy.profile.title,
          tabBarLabel: copy.tabs.client.profile,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
