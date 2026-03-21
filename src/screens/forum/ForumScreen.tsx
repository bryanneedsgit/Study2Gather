import { StyleSheet, Text, View } from "react-native";
import { AppCard } from "@/components/AppCard";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { colors } from "@/theme/colors";
import { space } from "@/theme/layout";

const THREADS = [
  {
    id: "1",
    title: "Proof strategy: induction on tree height",
    subject: "CS2040",
    replies: 12,
    time: "2h ago"
  },
  {
    id: "2",
    title: "Big-O: why log n dominates linear scan here?",
    subject: "CS3230",
    replies: 7,
    time: "5h ago"
  },
  {
    id: "3",
    title: "Past paper MA1521 — Q3b discussion",
    subject: "MA1521",
    replies: 24,
    time: "1d ago"
  }
] as const;

export function ForumScreen() {
  return (
    <PlaceholderScreen title="Forum" subtitle="Text-only threads for course help — no images, no spam.">
      {THREADS.map((t) => (
        <AppCard key={t.id} style={styles.thread}>
          <View style={styles.threadTop}>
            <Text style={styles.badge}>{t.subject}</Text>
            <Text style={styles.time}>{t.time}</Text>
          </View>
          <Text style={styles.threadTitle}>{t.title}</Text>
          <Text style={styles.meta}>{t.replies} replies · academic tone enforced</Text>
        </AppCard>
      ))}
      <Text style={styles.footer}>
        Backend wiring: Convex posts + comments. Until then, this is a layout preview.
      </Text>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  thread: {
    marginBottom: space.md
  },
  threadTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.sm
  },
  badge: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden"
  },
  time: {
    fontSize: 12,
    color: colors.textMuted
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 22
  },
  meta: {
    marginTop: space.sm,
    fontSize: 13,
    color: colors.textSecondary
  },
  footer: {
    marginTop: space.lg,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18
  }
});
