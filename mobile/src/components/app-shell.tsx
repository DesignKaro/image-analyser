import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadows, spacing } from "../theme/tokens";

type AppShellProps = {
  activeTab: "home" | "tools";
  children: ReactNode;
};

export function AppShell({ activeTab, children }: AppShellProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navWrap}>
        <View style={styles.navInner}>
          <View style={styles.brandPill}>
            <Text style={styles.brandLabel}>Image to Prompt</Text>
          </View>
          <View style={styles.navLinks}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/")}
              style={[styles.navLink, activeTab === "home" && styles.navLinkActive]}
            >
              <Text style={[styles.navLinkText, activeTab === "home" && styles.navLinkTextActive]}>Home</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/tools")}
              style={[styles.navLink, activeTab === "tools" && styles.navLinkActive]}
            >
              <Text style={[styles.navLinkText, activeTab === "tools" && styles.navLinkTextActive]}>Tools</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg
  },
  navWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm
  },
  navInner: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.soft
  },
  brandPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.softBg,
    borderWidth: 1,
    borderColor: colors.border
  },
  brandLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  navLink: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "transparent"
  },
  navLinkActive: {
    backgroundColor: colors.softBg,
    borderColor: colors.border
  },
  navLinkText: {
    color: colors.inkSoft,
    fontSize: 14,
    fontWeight: "600"
  },
  navLinkTextActive: {
    color: colors.ink
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md
  }
});
