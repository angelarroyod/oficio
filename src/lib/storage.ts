import { useQuery } from '@tanstack/react-query';
import { File } from 'expo-file-system';

import { qk } from './queryKeys';
import { supabase } from './supabase';

export const BUCKETS = {
  requestPhotos: 'request-photos',
  jobPhotos: 'job-photos',
} as const;

type Bucket = (typeof BUCKETS)[keyof typeof BUCKETS];

function extensionOf(uri: string): string {
  const match = /\.(jpe?g|png|webp|heic)(\?|$)/i.exec(uri);
  return (match?.[1] ?? 'jpg').toLowerCase();
}

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

/**
 * Uploads local picker URIs and returns the storage paths to persist in the
 * row. Paths (not URLs) are stored: the buckets are private, so every read
 * goes through a short-lived signed URL — a photo of someone's home should not
 * be reachable by anyone who once saw the link.
 *
 * Already-uploaded values (anything that is not a local file URI) pass through
 * untouched, so editing a row does not re-upload its existing photos.
 */
export async function uploadPhotos(
  bucket: Bucket,
  ownerId: string,
  uris: string[],
): Promise<string[]> {
  const uploaded = await Promise.all(
    uris.map(async (uri) => {
      if (!uri.startsWith('file:') && !uri.startsWith('content:')) return uri;

      const extension = extensionOf(uri);
      const path = ownerId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + extension;
      const bytes = await new File(uri).arrayBuffer();

      const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
        contentType: MIME[extension] ?? 'image/jpeg',
        upsert: false,
      });
      if (error) throw error;
      return path;
    }),
  );
  return uploaded;
}

/** Signed URLs for display. Empty input short-circuits (no pointless request). */
export async function signedPhotoUrls(bucket: Bucket, paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, 60 * 60);
  if (error) throw error;
  return data.flatMap((entry) => (entry.signedUrl ? [entry.signedUrl] : []));
}

/** Signed display URLs for a row's stored paths, cached like any other read. */
export function usePhotoUrls(bucket: Bucket, paths: string[] | undefined) {
  const list = paths ?? [];
  return useQuery({
    queryKey: qk.photos(bucket, list),
    queryFn: () => signedPhotoUrls(bucket, list),
    enabled: list.length > 0,
    // Signed URLs live an hour; refetching sooner just burns requests.
    staleTime: 45 * 60 * 1000,
  });
}
