import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppShell } from "../../src/components/app-shell";
import { Card, GradientButton, SecondaryButton } from "../../src/components/ui";
import { getToolBySlug } from "../../src/lib/tools";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function ToolDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const tool = slug ? getToolBySlug(slug) : undefined;

  if (!tool) {
    return (
      <AppShell activeTab="tools">
        <Card>
          <Text style={styles.title}>Tool Not Found</Text>
          <Text style={styles.body}>This tool route does not exist in the current app build.</Text>
          <SecondaryButton label="Back to Tools" onPress={() => router.push("/tools")} />
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell activeTab="tools">
      <Card>
        <Text style={styles.kicker}>Tool Placeholder</Text>
        <Text style={styles.title}>{tool.title}</Text>
        <Text style={styles.body}>{tool.description}</Text>

        <View style={styles.actions}>
          <View style={styles.actionFlex}>
            <GradientButton label="Use Later" onPress={() => {}} />
          </View>
          <View style={styles.actionFlex}>
            <SecondaryButton label="Back to Tools" onPress={() => router.push("/tools")} />
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Layout Preview</Text>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Input Panel</Text>
          <Text style={styles.panelBody}>Upload controls and options will be connected here.</Text>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Output Panel</Text>
          <Text style={styles.panelBody}>Generated result area will render here after backend integration.</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Use Cases</Text>
        {tool.bullets.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...typography.caption,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.3
  },
  title: {
    ...typography.heading,
    color: colors.ink
  },
  body: {
    ...typography.body,
    color: colors.inkSoft
  },
  actions: {
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
  panel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.softBg,
    padding: spacing.md,
    gap: spacing.xs
  },
  panelLabel: {
    ...typography.body,
    color: colors.ink,
    fontWeight: "700"
  },
  panelBody: {
    ...typography.caption,
    color: colors.inkSoft
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: 5
  },
  bulletText: {
    ...typography.body,
    color: colors.inkSoft,
    flex: 1
  }
});
