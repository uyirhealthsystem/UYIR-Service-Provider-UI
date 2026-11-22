import type { TextStyle, ViewStyle } from "react-native";

// PRO design tokens. Same shape as the ambulance module's theme so the app's
// provider experiences feel like one product; PRO keeps its brand blue.

export const colors = {
  background: "#F3F6FB",
  surface: "#FFFFFF",
  surfaceMuted: "#F2F5FA",
  text: "#0F1B33",
  textSecondary: "#4E5D78",
  muted: "#7A869C",
  border: "#E1E7F0",
  divider: "#EDF1F6",

  brand: "#1747D1",
  brandDark: "#0F35A8",
  brandSoft: "#E8EEFF",
  brandOnDark: "#C9D6FF",

  green: "#0F8A4F",
  greenSoft: "#E4F6EC",
  amber: "#B45309",
  amberSoft: "#FFF2DF",
  red: "#C8281E",
  redSoft: "#FDECEA",
  violet: "#6D3FD6",
  violetSoft: "#F0EAFE",

  white: "#FFFFFF",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "800", color: colors.text },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "800", color: colors.text },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: "700", color: colors.text },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: colors.text },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "400", color: colors.textSecondary },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500", color: colors.muted },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: "800", letterSpacing: 0.8, color: colors.muted },
} satisfies Record<string, TextStyle>;

export const shadow = {
  card: {
    shadowColor: "#0F1B33",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  floating: {
    shadowColor: "#0F1B33",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;

/** Business rules the PRO backend enforces (B:/uyir/pro pro.service.ts). */
export const PRO_RULES = {
  bucketSize: 5,
  /** A picked hospital should be visited within 24 hours (blockExpiresAt). */
  visitWindowHours: 24,
  /** Picks older than this become EXPIRED and return to the pool. */
  pickExpiryDays: 7,
  dailyTarget: 10,
  weeklyTarget: 30,
} as const;
