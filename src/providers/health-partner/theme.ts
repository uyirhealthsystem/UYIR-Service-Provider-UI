// Health Partner design tokens are PRO's tokens, imported directly so the two
// provider experiences cannot drift apart: same brand blue, background, type
// scale, spacing, radii and shadows.
export { colors, radius, shadow, spacing, typography } from "../pro/theme";

/** Business rules the HP backend enforces (B:/uyir/hp). */
export const HP_RULES = {
  /** Reward credited per successful referral (citizen or Health Partner). */
  rewardPerReferral: 10,
} as const;
