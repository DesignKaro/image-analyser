import { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing } from "../theme/tokens";

type CardProps = {
  children: ReactNode;
};

export function Card({ children }: CardProps) {
  return <View style={styles.card}>{children}</View>;
}

type GradientButtonProps = {
  label: string;
  onPress: () => void;
};

export function GradientButton({ label, onPress }: GradientButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.buttonWrap}>
      <LinearGradient colors={[colors.primary, colors.primaryStrong]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonBg}>
        <Text style={styles.buttonLabel}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: GradientButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.soft
  },
  buttonWrap: {
    borderRadius: radius.pill,
    overflow: "hidden"
  },
  buttonBg: {
    minHeight: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  buttonLabel: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface
  },
  secondaryButtonLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  }
});
