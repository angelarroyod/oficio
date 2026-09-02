/**
 * Every query key in one place. Invalidation after a mutation is the easiest
 * thing in this codebase to get subtly wrong — a typo'd inline key silently
 * invalidates nothing — so keys are values, not literals at call sites.
 */
export const qk = {
  requests: {
    mine: (clientId: string) => ['requests', 'mine', clientId] as const,
    detail: (id: string) => ['requests', 'detail', id] as const,
    opportunities: () => ['requests', 'opportunities'] as const,
  },
  quotes: {
    mine: (providerId: string) => ['quotes', 'mine', providerId] as const,
    forRequest: (requestId: string) => ['quotes', 'request', requestId] as const,
  },
  jobs: {
    mine: (userId: string) => ['jobs', 'mine', userId] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
  },
  provider: {
    details: (userId: string) => ['provider', 'details', userId] as const,
    reviews: (userId: string) => ['provider', 'reviews', userId] as const,
    finance: (userId: string) => ['provider', 'finance', userId] as const,
  },
  photos: (bucket: string, paths: string[]) => ['photos', bucket, ...paths] as const,
} as const;
