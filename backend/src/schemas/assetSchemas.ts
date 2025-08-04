import { z } from 'zod';

export const DutySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  xp_reward: z.number().int().positive(),
  currency_reward: z.number().int().positive(),
  repeatable: z.enum(["daily", "weekly", "monthly"]),
});
export type Duty = z.infer<typeof DutySchema>;

export const VentureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  xp_reward: z.number().int().positive(),
  currency_reward: z.number().int().positive(),
});
export type Venture = z.infer<typeof VentureSchema>;

// Add other schemas here as needed (Goods, Trophies, etc.)
