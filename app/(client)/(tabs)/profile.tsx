import { useRouter } from 'expo-router';

import { ProfileScreenBase } from '@/features/profile/ProfileScreenBase';

export default function ClientProfileScreen() {
  const router = useRouter();
  return <ProfileScreenBase onEditProfile={() => router.push('/(client)/edit-profile')} />;
}
