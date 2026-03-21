import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { AppCard } from "@/components/AppCard";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { useSession } from "@/context/SessionContext";
import { api } from "@/lib/convexApi";
import type { Doc } from "../../../convex/_generated/dataModel";
import { colors } from "@/theme/colors";
import { space } from "@/theme/layout";

function formatRelativeTime(createdAtMs: number): string {
  const sec = Math.floor((Date.now() - createdAtMs) / 1000);
  if (sec < 45) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function previewBody(body: string, max = 140): string {
  const t = body.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function ForumScreen() {
  const { user, loading: sessionLoading } = useSession();
  const posts = useQuery(api.forum.getPosts, { limit: 40 });
  const postIds = posts?.map((p) => p._id) ?? [];
  const responseCounts = useQuery(
    api.forum.getResponseCounts,
    postIds.length > 0 ? { postIds } : "skip"
  );
  const seed = useMutation(api.forum.seedExampleForumPosts);
  const markResolved = useMutation(api.forum.markPostResolved);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Doc<"forum_posts"> | null>(null);
  const threadResponses = useQuery(
    api.forum.getResponsesForPost,
    selectedPost ? { postId: selectedPost._id } : "skip"
  );

  const onSeed = useCallback(async () => {
    setMessage(null);
    setBusy(true);
    try {
      const r = await seed({});
      if (r.ok) {
        const parts: string[] = [];
        if (r.insertedPosts > 0) parts.push(`${r.insertedPosts} sample thread${r.insertedPosts === 1 ? "" : "s"}`);
        if (r.insertedResponses > 0) {
          parts.push(`${r.insertedResponses} sample repl${r.insertedResponses === 1 ? "y" : "ies"}`);
        }
        setMessage(parts.length > 0 ? `Added ${parts.join(" and ")}.` : "Done.");
      } else {
        setMessage(
          r.reason === "responses_already_seeded"
            ? "Sample data was already loaded (replies exist). Delete forum_responses in the dashboard to re-seed."
            : r.reason === "no_posts"
              ? "No threads found to attach replies to."
              : "Could not add samples."
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Seed failed.");
    } finally {
      setBusy(false);
    }
  }, [seed]);

  const loading = sessionLoading || posts === undefined;

  return (
    <PlaceholderScreen
      title="Forum"
      subtitle="Text-only threads and replies for course help — no images in MVP."
    >
      {user && (
        <Pressable
          style={[styles.seedBtn, busy && styles.seedBtnDisabled]}
          onPress={onSeed}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.seedBtnText}>Load sample threads &amp; replies</Text>
          )}
        </Pressable>
      )}

      {message ? <Text style={styles.msg}>{message}</Text> : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : posts.length === 0 ? (
        <Text style={styles.empty}>
          No threads yet. Sign in and tap &quot;Load sample threads &amp; replies&quot; for demo data, or create
          posts from the app when that flow is wired.
        </Text>
      ) : (
        posts.map((p: Doc<"forum_posts">) => {
          return (
            <Pressable
              key={p._id}
              accessibilityRole="button"
              accessibilityLabel={`Open thread: ${p.title}`}
              onPress={() => setSelectedPost(p)}
              style={({ pressed }) => [styles.threadPressable, pressed && styles.threadPressed]}
            >
              <AppCard style={styles.thread}>
                <View style={styles.threadTop}>
                  <Text style={styles.badge}>{p.subject}</Text>
                  <Text style={styles.time}>{formatRelativeTime(p.created_at)}</Text>
                </View>
                <Text style={styles.threadTitle}>{p.title}</Text>
                <Text style={styles.preview}>{previewBody(p.body)}</Text>
                <View style={styles.row}>
                  <Text
                    style={[
                      styles.status,
                      p.status === "resolved" ? styles.statusResolved : styles.statusOpen
                    ]}
                  >
                    {p.status === "resolved" ? "Resolved" : "Open"}
                  </Text>
                  <Text style={styles.tapHint}>
                    {responseCounts && responseCounts[p._id] !== undefined
                      ? `${responseCounts[p._id]} repl${responseCounts[p._id] === 1 ? "y" : "ies"} · tap to read`
                      : "Tap to read"}
                  </Text>
                </View>
              </AppCard>
            </Pressable>
          );
        })
      )}

      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPost(null)}
      >
        <SafeAreaView style={styles.modalSafe} edges={["top", "left", "right"]}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setSelectedPost(null)}
              hitSlop={12}
              style={styles.modalCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="Close thread"
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
          {selectedPost ? (
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalBadge}>{selectedPost.subject}</Text>
              <Text style={styles.modalTitle}>{selectedPost.title}</Text>
              <Text
                style={[
                  styles.modalStatus,
                  selectedPost.status === "resolved" ? styles.statusResolved : styles.statusOpen
                ]}
              >
                {selectedPost.status === "resolved" ? "Resolved" : "Open"} ·{" "}
                {formatRelativeTime(selectedPost.created_at)}
              </Text>
              <Text style={styles.modalBody}>{selectedPost.body}</Text>

              <Text style={styles.repliesHeading}>Replies</Text>
              {threadResponses === undefined ? (
                <ActivityIndicator style={styles.repliesLoader} color={colors.primary} />
              ) : threadResponses.length === 0 ? (
                <Text style={styles.repliesEmpty}>No replies yet.</Text>
              ) : (
                threadResponses.map((r) => (
                  <View key={r._id} style={styles.replyCard}>
                    <Text style={styles.replyMeta}>
                      {r.author_name ?? "Student"} · {formatRelativeTime(r.created_at)}
                    </Text>
                    <Text style={styles.replyBody}>{r.body}</Text>
                  </View>
                ))
              )}

              {user &&
              String(user._id) === String(selectedPost.author_id) &&
              selectedPost.status === "open" ? (
                <Pressable
                  style={styles.modalResolveBtn}
                  onPress={async () => {
                    setMessage(null);
                    try {
                      await markResolved({ postId: selectedPost._id });
                      setSelectedPost(null);
                    } catch (e) {
                      setMessage(e instanceof Error ? e.message : "Could not mark resolved.");
                    }
                  }}
                >
                  <Text style={styles.modalResolveText}>Mark resolved</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  seedBtn: {
    backgroundColor: colors.primary,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: 10,
    marginBottom: space.md,
    alignItems: "center"
  },
  seedBtnDisabled: {
    opacity: 0.7
  },
  seedBtnText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14
  },
  msg: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: space.md
  },
  loader: {
    marginVertical: space.lg
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20
  },
  threadPressable: {
    marginBottom: space.md,
    borderRadius: 14
  },
  threadPressed: {
    opacity: 0.92
  },
  thread: {
    marginBottom: 0
  },
  modalSafe: {
    flex: 1,
    backgroundColor: colors.background
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  modalCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  modalCloseText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.primary
  },
  modalScroll: {
    flex: 1
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32
  },
  modalBadge: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: space.md
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: space.sm
  },
  modalStatus: {
    fontSize: 13,
    marginBottom: space.lg
  },
  modalBody: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary
  },
  repliesHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: space.lg,
    marginBottom: space.sm
  },
  repliesLoader: {
    marginVertical: space.md
  },
  repliesEmpty: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: space.sm
  },
  replyCard: {
    backgroundColor: colors.cardMuted,
    borderRadius: 12,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  replyMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: space.sm
  },
  replyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary
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
  preview: {
    marginTop: space.sm,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: space.sm
  },
  tapHint: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted
  },
  status: {
    fontSize: 12,
    fontWeight: "600"
  },
  statusOpen: {
    color: colors.primary
  },
  statusResolved: {
    color: colors.textMuted
  },
  modalResolveBtn: {
    marginTop: space.lg,
    alignSelf: "flex-start",
    backgroundColor: colors.primaryMuted,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: 10
  },
  modalResolveText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary
  }
});
