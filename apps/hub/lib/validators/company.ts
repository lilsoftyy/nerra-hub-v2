import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Firmanavn er påkrevd'),
  country: z.string().min(2, 'Land er påkrevd').max(2, 'Bruk ISO 3166-1 alpha-2 (f.eks. NO, DE)'),
  operational_area: z.string().optional(),
  website: z.string().url('Ugyldig URL').optional().or(z.literal('')),
  org_number: z.string().optional(),
  employee_count: z.coerce.number().int().positive().optional(),
  notes: z.string().optional(),
  // Primary contact (optional inline)
  contact_name: z.string().optional(),
  contact_email: z.string().email('Ugyldig e-post').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_role: z.string().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
