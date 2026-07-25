import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

/**
 * Bridges device connectivity into TanStack Query's onlineManager. When offline,
 * Query pauses mutations (networkMode: 'offlineFirst') and resumes them on
 * reconnect — the offline strategy locked in during design. Call once at boot.
 */
export function configureOnlineManager(): void {
  onlineManager.setEventListener((setOnline) => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected));
    });
    return unsubscribe;
  });
}

/** Reactive connectivity flag for UI (offline banners, disabled actions). */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
    () => true,
  );
}
