import { z } from 'zod';

import { copy } from './copy';

/** Shared field schemas mirroring DB constraints — reuse across forms. */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(copy.auth.emailInvalid);

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, copy.auth.codeInvalid);

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, copy.auth.fullNameRequired)
  .max(120);

export const roleSchema = z.enum(['client', 'provider']);
