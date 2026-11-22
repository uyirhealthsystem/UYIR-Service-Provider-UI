import type { TextStyle, ViewStyle } from "react-native";

// Health Partner design tokens. Same shape as the PRO / ambulance themes so
// every provider experience feels like one product. HP uses a calm teal-green
// brand: the role is about community health, not dispatch or sales.

export const colors = {
  background: "#F3F6F8",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F7",
  text: "#0F1F2B",
  textSecondary: "#4A5B69",
  muted: "#7B8A97",
  border: "#E0E7EC",
  divider: "#EDF2F5",

  brand: "#0E7C66",
  brandDark: "#095C4B",
  brandSoft: "#E3F4EF",
  brandOnDark: "#BFE6DB",

  blue: "#1D5FD1",
  blueSoft: "#E7EFFE",
  green: "#13854F",
  greenSoft: "#E3F6EB",
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
  display: { fontSize: 26, lineHeight: 32, fontWeight: "800", color: colors.text },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "800", color: colors.text },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: "700", color: colors.text },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: colors.text },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "400", color: colors.textSecondary },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500", color: colors.muted },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: "800", letterSpacing: 0.8, color: colors.muted },
} satisfies Record<string, TextStyle>;

export const shadow = {
  card: {
    shadowColor: "#0F1F2B",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  floating: {
    shadowColor: "#0F1F2B",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;

/** Business rules the HP backend enforces (B:/uyir/hp). */
export const HP_RULES = {
  /** Reward credited per successful referral (citizen or Health Partner). */
  rewardPerReferral: 10,
} as const;
