import type { TextStyle, ViewStyle } from "react-native";

export const colors = {
  background: "#F4F6F9",
  surface: "#FFFFFF",
  surfaceMuted: "#F0F3F7",
  text: "#101C2D",
  textSecondary: "#526074",
  muted: "#6A778A",
  border: "#DDE3EB",
  divider: "#EBEFF4",
  navy: "#12263F",
  blue: "#0B5FD8",
  blueSoft: "#E7F0FD",
  green: "#067647",
  greenSoft: "#E3F6EC",
  amber: "#B54708",
  amberSoft: "#FEF0E1",
  red: "#C8281E",
  redSoft: "#FDECEA",
  white: "#FFFFFF",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: "700", color: colors.text },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700", color: colors.text },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: "700", color: colors.text },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: colors.text },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "400", color: colors.textSecondary },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500", color: colors.muted },
} satisfies Record<string, TextStyle>;

export const shadow = {
  card: {
    shadowColor: colors.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  floating: {
    shadowColor: colors.navy,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
} satisfies Record<string, ViewStyle>;
