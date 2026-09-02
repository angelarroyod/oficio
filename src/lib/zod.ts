import { z } from 'zod';

import { copy } from './copy';

/** Shared field schemas mirroring DB constraints — reuse across forms. */

export const emailSchema = z.string().trim().toLowerCase().email(copy.auth.emailInvalid);

export const otpCodeSchema = z.string().trim().regex(/^\d{6}$/, copy.auth.codeInvalid);

export const fullNameSchema = z.string().trim().min(2, copy.auth.fullNameRequired).max(120);

export const roleSchema = z.enum(['client', 'provider']);

/** Optional 10-digit MX number, stored digits-only. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ''))
  .refine((value) => value.length === 0 || value.length === 10, copy.profile.phoneInvalid);

// --- requests (mirrors 0004_requests.sql check constraints) ----------------

export const requestTitleSchema = z
  .string()
  .trim()
  .min(4, copy.newRequest.titleInvalid)
  .max(120, copy.newRequest.titleInvalid);

export const requestDescriptionSchema = z
  .string()
  .trim()
  .min(10, copy.newRequest.descriptionInvalid)
  .max(2000, copy.newRequest.descriptionInvalid);

export const addressSchema = z.string().trim().min(6, copy.newRequest.addressInvalid).max(240);

// --- quotes (mirrors 0005_quotes.sql + validate_quote()) ------------------

export const quoteLineItemSchema = z.object({
  concept: z.string().trim().min(2).max(120),
  qty: z.number().positive(),
  unit_price: z.number().min(0),
  type: z.enum(['labor', 'material']),
});

export const quoteDurationSchema = z
  .number()
  .int()
  .min(15, copy.quote.durationInvalid)
  .max(2880, copy.quote.durationInvalid);

export const quoteNotesSchema = z.string().trim().max(1000).optional();

// --- jobs / reviews / finance ---------------------------------------------

export const cancellationReasonSchema = z
  .string()
  .trim()
  .min(4, copy.schedule.cancelReasonRequired)
  .max(500);

export const ratingSchema = z.number().int().min(1, copy.review.ratingRequired).max(5);

export const reviewCommentSchema = z.string().trim().max(1000).optional();

export const financeAmountSchema = z.number().positive(copy.business.amountInvalid);

export const financeCategorySchema = z
  .string()
  .trim()
  .min(2, copy.business.categoryInvalid)
  .max(60, copy.business.categoryInvalid);

export const bioSchema = z.string().trim().max(600).optional();

export const serviceRadiusSchema = z.number().min(1).max(100);
