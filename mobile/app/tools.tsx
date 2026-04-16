import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppShell } from "../src/components/app-shell";
import { Card, SecondaryButton } from "../src/components/ui";
import { TOOLS } from "../src/lib/tools";
import { colors, radius, spacing, typography } from "../src/theme/tokens";

export default function ToolsScreen() {
  const router = useRouter();

  return (
    <AppShell activeTab="tools">
      <Card>
        <Text style={styles.title}>Tool Library</Text>
        <Text style={styles.subtitle}>
          Minimal app version of current web tools with matching UI style. Content and processing are intentionally not included.
        </Text>
        <SecondaryButton label="Back to Home" onPress={() => router.push("/")} />
      </Card>

      <View style={styles.grid}>
        {TOOLS.map((tool) => (
          <Pressable
            key={tool.slug}
            style={styles.card}
            onPress={() => router.push({ pathname: "/tool/[slug]", params: { slug: tool.slug } })}
          >
            <Text style={styles.cardTitle}>{tool.title}</Text>
            <Text style={styles.cardDescription}>{tool.description}</Text>
            <Text style={styles.cardLink}>Open placeholder</Text>
          </Pressable>
        ))}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.heading,
    color: colors.ink
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSoft
  },
  grid: {
    gap: spacing.md
  },
  card: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm
  },
  cardTitle: {
    ...typography.title,
    color: colors.ink
  },
  cardDescription: {
    ...typography.body,
    color: colors.inkSoft
  },
  cardLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700"
  }
});
