import { z } from 'zod';

// Shared constraints
const name = z.string().min(1, 'Platform name is required').max(100, 'Max 100 characters');
const accountType = z
  .string()
  .min(1, 'Account type is required')
  .max(100, 'Max 100 characters');
const nonNegativeNumber = z.number().min(0, 'Must be >= 0');
const positiveInt = z.number().int('Must be an integer').min(1, 'Must be >= 1');
const nonNegativeInt = z.number().int('Must be an integer').min(0, 'Must be >= 0');

export const platformCreateSchema = z.object({
  platform_name: name,
  account_type: accountType,
  inventory: nonNegativeInt,
  cost_price: nonNegativeNumber,
  low_stock_alert: positiveInt,
  is_visible_to_employee: z.boolean().optional(),
});

export type PlatformCreateForm = z.infer<typeof platformCreateSchema>;

export const platformUpdateSchema = platformCreateSchema.partial();
export type PlatformUpdateForm = z.infer<typeof platformUpdateSchema>;

export const purchaseSchema = z.object({
  quantity: positiveInt,
  cost_per_unit: nonNegativeNumber,
  supplier: z.string().max(120).optional().or(z.literal('')).transform((v) => v || undefined),
  notes: z.string().max(500).optional().or(z.literal('')).transform((v) => v || undefined),
});
export type PurchaseForm = z.infer<typeof purchaseSchema>;

export function formatZodErrors(issues: z.ZodIssue[]) {
  return issues.map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message)).join('\n');
}
