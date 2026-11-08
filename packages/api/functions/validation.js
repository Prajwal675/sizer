const { z } = require('zod');

// A deliberately generous upper bound in cm — anything past this is almost certainly
// bad/malicious input rather than a real human measurement, regardless of unit.
const MAX_PLAUSIBLE_CM = 500;

const numericField = z.union([z.number(), z.string()]).optional();

const UserMeasurementsSchema = z.object({
  chest: numericField,
  waist: numericField,
  shoulders: numericField,
  height: numericField,
  weight: numericField,
  unit: z.enum(['cm', 'in', 'inches']).optional(),
  weight_unit: z.string().max(10).optional(),
  fit_preference: z.string().max(50).optional(),
  estimated: z.boolean().optional(),
  updated_at: z.string().max(60).optional()
});

const MatchRequestSchema = z.object({
  product_id: z.string().max(200).optional(),
  product_category: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  user_measurements: UserMeasurementsSchema
});

/**
 * Validates a parsed match-size request body against MatchRequestSchema.
 * Unknown top-level and nested fields are stripped by zod's default object
 * parsing, so this also acts as an allowlist against unexpected payload shapes.
 */
function validateMatchRequest(body) {
  const result = MatchRequestSchema.safeParse(body);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    };
  }
  return { valid: true, data: result.data };
}

module.exports = { validateMatchRequest, MAX_PLAUSIBLE_CM };
