import { useRouter } from 'expo-router';

import { ProfileScreenBase } from '@/features/profile/ProfileScreenBase';

export default function ProviderProfileScreen() {
  const router = useRouter();
  return (
    <ProfileScreenBase
      onEditProfile={() => router.push('/(provider)/edit-profile')}
      onEditProvider={() => router.push('/(provider)/setup')}
    />
  );
}
