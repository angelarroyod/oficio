import { Ionicons } from '@expo/vector-icons';

import type { BadgeTone } from '@/components/Badge';
import { tradeColors } from '@/theme';
import type {
  JobStatus,
  QuoteStatus,
  RequestStatus,
  RequestUrgency,
  TradeType,
  VisitType,
} from '@/types/database';

import { copy } from './copy';
import { distanceKm } from './geo';

// Re-exported: screens import every domain helper from one place.
export { distanceKm };

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Presentation metadata for the domain enums. Enum values stay English (they
 * are database identifiers); everything a user reads comes from `copy`, and
 * everything a user sees comes from here.
 */
export const TRADES: ReadonlyArray<{
  value: TradeType;
  label: string;
  icon: IconName;
  fg: string;
  bg: string;
}> = [
  {
    value: 'plumbing',
    label: copy.trades.plumbing,
    icon: 'water-outline',
    ...tradeColors.plumbing,
  },
  {
    value: 'electrical',
    label: copy.trades.electrical,
    icon: 'flash-outline',
    ...tradeColors.electrical,
  },
  { value: 'masonry', label: copy.trades.masonry, icon: 'grid-outline', ...tradeColors.masonry },
  {
    value: 'carpentry',
    label: copy.trades.carpentry,
    icon: 'hammer-outline',
    ...tradeColors.carpentry,
  },
  {
    value: 'cleaning',
    label: copy.trades.cleaning,
    icon: 'sparkles-outline',
    ...tradeColors.cleaning,
  },
  {
    value: 'installations',
    label: copy.trades.installations,
    icon: 'build-outline',
    ...tradeColors.installations,
  },
];

const TRADE_BY_VALUE = Object.fromEntries(TRADES.map((trade) => [trade.value, trade])) as Record<
  TradeType,
  (typeof TRADES)[number]
>;

export function tradeMeta(trade: TradeType) {
  return TRADE_BY_VALUE[trade];
}

export const URGENCIES: ReadonlyArray<{
  value: RequestUrgency;
  label: string;
  hint: string;
  tone: BadgeTone;
  icon: IconName;
}> = [
  {
    value: 'emergency',
    label: copy.urgency.emergency,
    hint: copy.urgency.emergencyHint,
    tone: 'danger',
    icon: 'alert-circle-outline',
  },
  {
    value: 'this_week',
    label: copy.urgency.this_week,
    hint: copy.urgency.thisWeekHint,
    tone: 'warning',
    icon: 'time-outline',
  },
  {
    value: 'flexible',
    label: copy.urgency.flexible,
    hint: copy.urgency.flexibleHint,
    tone: 'neutral',
    icon: 'calendar-outline',
  },
];

export function urgencyMeta(urgency: RequestUrgency) {
  return URGENCIES.find((item) => item.value === urgency) ?? URGENCIES[2]!;
}

export const VISIT_TYPES: ReadonlyArray<{ value: VisitType; label: string; hint: string }> = [
  {
    value: 'diagnostic',
    label: copy.visitType.diagnostic,
    hint: copy.visitType.diagnosticHint,
  },
  {
    value: 'full_service',
    label: copy.visitType.full_service,
    hint: copy.visitType.fullServiceHint,
  },
];

const REQUEST_TONES: Record<RequestStatus, BadgeTone> = {
  open: 'primary',
  quoted: 'accent',
  accepted: 'success',
  cancelled: 'neutral',
  expired: 'neutral',
};

const QUOTE_TONES: Record<QuoteStatus, BadgeTone> = {
  sent: 'primary',
  accepted: 'success',
  rejected: 'neutral',
  expired: 'neutral',
  withdrawn: 'neutral',
};

const JOB_TONES: Record<JobStatus, BadgeTone> = {
  scheduled: 'primary',
  en_route: 'accent',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'neutral',
};

export function requestStatusBadge(status: RequestStatus) {
  return { label: copy.requestStatus[status], tone: REQUEST_TONES[status] };
}

export function quoteStatusBadge(status: QuoteStatus) {
  return { label: copy.quoteStatus[status], tone: QUOTE_TONES[status] };
}

export function jobStatusBadge(status: JobStatus) {
  return { label: copy.jobStatus[status], tone: JOB_TONES[status] };
}

/** Statuses a client still acts on, versus the ones that are just history. */
export const ACTIVE_REQUEST_STATUSES: RequestStatus[] = ['open', 'quoted'];
export const ACTIVE_JOB_STATUSES: JobStatus[] = ['scheduled', 'en_route', 'in_progress'];
export const OPEN_QUOTE_STATUSES: QuoteStatus[] = ['sent'];
