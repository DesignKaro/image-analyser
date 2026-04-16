import { Platform } from "react-native";

export const colors = {
  bg: "#edf1f7",
  softBg: "#f7f9fc",
  surface: "#ffffff",
  border: "#d7dfec",
  borderStrong: "#000000",
  ink: "#1d2838",
  inkSoft: "#627287",
  primary: "#2d6ae3",
  primaryStrong: "#1f54ba",
  success: "#15684d",
  error: "#b42338"
} as const;

export const radius = {
  xl: 24,
  lg: 20,
  md: 14,
  sm: 10,
  pill: 999
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28
} as const;

export const shadows = {
  soft:
    Platform.OS === "ios"
      ? {
          shadowColor: "#0f1c34",
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 }
        }
      : {
          elevation: 3
        }
};

export const typography = {
  heading: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600" as const
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500" as const
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500" as const
  }
};
