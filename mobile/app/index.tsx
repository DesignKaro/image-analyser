import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppShell } from "../src/components/app-shell";
import { Card, GradientButton, SecondaryButton } from "../src/components/ui";
import { checkBackendHealth, resolveBackendUrl } from "../src/lib/backend";
import { TOOLS } from "../src/lib/tools";
import { colors, radius, spacing, typography } from "../src/theme/tokens";

type HealthState = "checking" | "online" | "offline";

export default function HomeScreen() {
  const router = useRouter();
  const backendUrl = useMemo(() => resolveBackendUrl(), []);
  const [health, setHealth] = useState<HealthState>("checking");

  async function runHealthCheck(signal?: AbortSignal) {
    try {
      setHealth("checking");
      const ok = await checkBackendHealth(signal);
      setHealth(ok ? "online" : "offline");
    } catch {
      setHealth("offline");
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    void runHealthCheck(controller.signal);
    return () => controller.abort();
  }, [backendUrl]);

  return (
    <AppShell activeTab="home">
      <Card>
        <Text style={styles.heroKicker}>Image to Prompt Mobile</Text>
        <Text style={styles.heroTitle}>Minimal app shell for tools</Text>
        <Text style={styles.heroBody}>
          Same visual style as web, separate mobile codebase, and ready to use the same backend.
        </Text>

        <View style={styles.heroActions}>
          <View style={styles.actionFlex}>
            <GradientButton label="Open Tools" onPress={() => router.push("/tools")} />
          </View>
          <View style={styles.actionFlex}>
            <SecondaryButton label="Refresh Backend" onPress={() => void runHealthCheck()} />
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Upload Area (UI Placeholder)</Text>
        <View style={styles.uploadPlaceholder}>
          <Text style={styles.uploadPrimary}>Drop image here</Text>
          <Text style={styles.uploadSecondary}>No processing yet (content intentionally skipped).</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Backend Connection</Text>
        <View style={styles.backendRow}>
          <Text style={styles.backendLabel}>Base URL</Text>
          <Text style={styles.backendValue}>{backendUrl}</Text>
        </View>
        <View style={styles.backendStatusRow}>
          <View
            style={[
              styles.statusDot,
              health === "online"
                ? styles.statusOnline
                : health === "offline"
                  ? styles.statusOffline
                  : styles.statusChecking
            ]}
          />
          <Text style={styles.backendStatusText}>
            {health === "checking" ? "Checking health endpoint" : health === "online" ? "Backend online" : "Backend offline"}
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Tools</Text>
        <View style={styles.toolList}>
          {TOOLS.map((tool) => (
            <Pressable
              key={tool.slug}
              style={styles.toolItem}
              onPress={() => router.push({ pathname: "/tool/[slug]", params: { slug: tool.slug } })}
            >
              <View style={styles.toolItemTextWrap}>
                <Text style={styles.toolItemTitle}>{tool.title}</Text>
                <Text numberOfLines={2} style={styles.toolItemDescription}>
                  {tool.description}
                </Text>
              </View>
              <Text style={styles.toolArrow}>-></Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  heroKicker: {
    ...typography.caption,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  heroTitle: {
    ...typography.heading,
    color: colors.ink
  },
  heroBody: {
    ...typography.body,
    color: colors.inkSoft
  },
  heroActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  actionFlex: {
    flex: 1
  },
  sectionTitle: {
    ...typography.title,
    color: colors.ink
  },
  uploadPlaceholder: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.softBg,
    minHeight: 130,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.xs
  },
  uploadPrimary: {
    ...typography.title,
    color: colors.ink
  },
  uploadSecondary: {
    ...typography.caption,
    color: colors.inkSoft,
    textAlign: "center"
  },
  backendRow: {
    gap: spacing.xs
  },
  backendLabel: {
    ...typography.caption,
    color: colors.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.3
  },
  backendValue: {
    ...typography.body,
    color: colors.ink
  },
  backendStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill
  },
  statusOnline: {
    backgroundColor: colors.success
  },
  statusOffline: {
    backgroundColor: colors.error
  },
  statusChecking: {
    backgroundColor: colors.inkSoft
  },
  backendStatusText: {
    ...typography.caption,
    color: colors.inkSoft
  },
  toolList: {
    gap: spacing.sm
  },
  toolItem: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.softBg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  toolItemTextWrap: {
    flex: 1,
    gap: spacing.xs
  },
  toolItemTitle: {
    ...typography.body,
    color: colors.ink,
    fontWeight: "700"
  },
  toolItemDescription: {
    ...typography.caption,
    color: colors.inkSoft
  },
  toolArrow: {
    color: colors.ink,
    fontWeight: "700"
  }
});
