/**
 * Academic forum: posts + text-only replies (no likes/nesting/media in MVP).
 * Legacy CRUD lives in `crudMutations` / `crudQueries`; this module is the product API.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import type { GenericMutationCtx } from "convex/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { DataModel, Id } from "./_generated/dataModel";

const forumStatus = v.union(v.literal("open"), v.literal("resolved"));

function assertNonEmpty(s: string, field: string): string {
  const t = s.trim();
  if (!t) throw new Error(`${field}_required`);
  return t;
}

/** Example reply bodies aligned with `seedExampleForumPosts` thread order (oldest 3 posts by created_at). */
const EXAMPLE_RESPONSES_BY_THREAD: string[][] = [
  [
    "For the inductive step, state P(h) for the subtree heights explicitly, then show P(h+1) follows from combining — you don’t double-count the root if you frame the claim as “each subtree satisfies P at height ≤ h”.",
    "Sketch: let L,R be left/right subtrees. IH gives P(L) and P(R) at height ≤ h. For T at height h+1, the root is one node; apply your merge rule on the union without counting children twice."
  ],
  [
    "Master theorem case 2: T(n)=2T(n/2)+Θ(n) is Θ(n log n) — the combine step matches the recursion depth.",
    "Recursion tree: Θ(n) work per level, log n levels → Θ(n log n). The linear scan in combine is the Θ(n) per level."
  ],
  [
    "Absolute convergence: ∑ 1/n² converges (p-series p>1), so ∑ (-1)^n/n² converges absolutely — you can lead with that for a clean proof.",
    "For partial credit: alternating series test works too — terms → 0 and |aₙ| decreases; say which route matches the mark scheme."
  ]
];

export const createPost = mutationGeneric({
  args: {
    title: v.string(),
    body: v.string(),
    subject: v.string(),
    scheduledMeetupTime: v.optional(v.number()),
    nowMs: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("not_authenticated");

    const title = assertNonEmpty(args.title, "title");
    const body = assertNonEmpty(args.body, "body");
    const subject = assertNonEmpty(args.subject, "subject");
    const t = args.nowMs ?? Date.now();

    const id = await ctx.db.insert("forum_posts", {
      author_id: userId,
      title,
      body,
      subject,
      status: "open",
      scheduled_meetup_time: args.scheduledMeetupTime,
      created_at: t
    });
    return { postId: id };
  }
});

export const createResponse = mutationGeneric({
  args: {
    postId: v.id("forum_posts"),
    body: v.string(),
    nowMs: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("not_authenticated");

    const body = assertNonEmpty(args.body, "body");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("post_not_found");

    const t = args.nowMs ?? Date.now();
    const id = await ctx.db.insert("forum_responses", {
      post_id: args.postId,
      author_id: userId,
      body,
      created_at: t
    });
    return { responseId: id };
  }
});

export const getPosts = queryGeneric({
  args: {
    subject: v.optional(v.string()),
    status: v.optional(forumStatus),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const cap = Math.min(Math.max(1, args.limit ?? 50), 100);

    let rows;
    if (args.subject !== undefined) {
      rows = await ctx.db
        .query("forum_posts")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
        .collect();
    } else if (args.status !== undefined) {
      rows = await ctx.db
        .query("forum_posts")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      rows = await ctx.db.query("forum_posts").collect();
    }

    if (args.subject !== undefined && args.status !== undefined) {
      rows = rows.filter((p) => p.status === args.status);
    }

    rows.sort((a, b) => b.created_at - a.created_at);
    return rows.slice(0, cap);
  }
});

export const getPostById = queryGeneric({
  args: {
    postId: v.id("forum_posts")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  }
});

export const getResponsesForPost = queryGeneric({
  args: {
    postId: v.id("forum_posts")
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("forum_responses")
      .withIndex("by_post", (q) => q.eq("post_id", args.postId))
      .collect();
    rows.sort((a, b) => a.created_at - b.created_at);

    const enriched = [];
    for (const r of rows) {
      const u = await ctx.db.get(r.author_id);
      enriched.push({
        ...r,
        author_name: u?.username ?? undefined
      });
    }

    return enriched;
  }
});

export const getResponseCounts = queryGeneric({
  args: {
    postIds: v.array(v.id("forum_posts"))
  },
  handler: async (ctx, args) => {
    const counts: Record<string, number> = {};
    for (const id of args.postIds) {
      const rows = await ctx.db
        .query("forum_responses")
        .withIndex("by_post", (q) => q.eq("post_id", id))
        .collect();
      counts[id] = rows.length;
    }
    return counts;
  }
});

export const markPostResolved = mutationGeneric({
  args: {
    postId: v.id("forum_posts")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("not_authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("post_not_found");
    if (post.author_id !== userId) throw new Error("only_author_can_resolve");

    await ctx.db.patch(args.postId, { status: "resolved" });
    return { ok: true as const };
  }
});

async function insertExampleResponses(
  ctx: GenericMutationCtx<DataModel>,
  postIds: Id<"forum_posts">[],
  responders: Id<"users">[],
  timeBase: number
): Promise<number> {
  let inserted = 0;
  let tick = 0;
  for (let pi = 0; pi < postIds.length && pi < EXAMPLE_RESPONSES_BY_THREAD.length; pi++) {
    const postId = postIds[pi]!;
    const texts = EXAMPLE_RESPONSES_BY_THREAD[pi]!;
    for (let ri = 0; ri < texts.length; ri++) {
      const responder = responders[(pi + ri) % responders.length]!;
      await ctx.db.insert("forum_responses", {
        post_id: postId,
        author_id: responder,
        body: texts[ri]!,
        created_at: timeBase + tick
      });
      tick += 1;
      inserted += 1;
    }
  }
  return inserted;
}

/**
 * Idempotent demo content: inserts sample threads when the forum has no posts, and/or
 * sample replies when there are no responses yet. Re-run after clearing responses in the dashboard
 * if you need to re-seed replies only (requires deleting `forum_responses` docs first).
 */
export const seedExampleForumPosts = mutationGeneric({
  args: {
    nowMs: v.optional(v.number()),
    /** Dashboard / CLI only: author user id when no auth context. Ignored if session user exists. */
    authorId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    const userId = authId ?? args.authorId ?? null;
    if (userId === null) {
      throw new Error(
        "not_authenticated: open the app signed in and tap Load sample threads, or run from the dashboard with authorId set to a users id"
      );
    }
    const author = await ctx.db.get(userId);
    if (!author) throw new Error("author_not_found");

    const anyResponse = await ctx.db.query("forum_responses").first();
    if (anyResponse) {
      return { ok: false as const, reason: "responses_already_seeded" as const };
    }

    const usersSnapshot = await ctx.db.query("users").take(16);
    const pool: Id<"users">[] = usersSnapshot.map((u) => u._id);
    const responders = pool.length > 0 ? pool : [userId];

    const t = args.nowMs ?? Date.now();
    let insertedPosts = 0;
    let targetPostIds: Id<"forum_posts">[] = [];

    const anyPost = await ctx.db.query("forum_posts").first();
    const seeds: {
      title: string;
      body: string;
      subject: string;
      scheduled_meetup_time?: number;
    }[] = [
      {
        title: "Proof strategy: induction on tree height",
        subject: "Informatik I",
        body:
          "For a binary tree T, I want to prove P(T) by induction on height. Base case h=0 is trivial. Inductive step: assume P holds for left and right subtrees — how do I combine them without double-counting nodes?",
        scheduled_meetup_time: t + 3 * 24 * 60 * 60 * 1000
      },
      {
        title: "Big-O: why does log n dominate a linear scan here?",
        subject: "Algorithms",
        body:
          "In the divide step we split in half each time; the combine step is O(n). Total recurrence T(n)=2T(n/2)+O(n) — walk me through the Master theorem case."
      },
      {
        title: "Past exam — series convergence (MA)",
        subject: "Lineare Algebra / Analysis",
        body:
          "Old paper Q3b: show sum convergence for ∑ (-1)^n / n^2. Alternating series test vs absolute convergence — what’s the cleanest write-up for partial credit?"
      }
    ];

    if (!anyPost) {
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i]!;
        const id = await ctx.db.insert("forum_posts", {
          author_id: userId,
          title: s.title,
          body: s.body,
          subject: s.subject,
          status: "open",
          scheduled_meetup_time: s.scheduled_meetup_time,
          created_at: t + i
        });
        targetPostIds.push(id);
        insertedPosts += 1;
      }
    } else {
      const all = await ctx.db.query("forum_posts").collect();
      all.sort((a, b) => a.created_at - b.created_at);
      targetPostIds = all.slice(0, EXAMPLE_RESPONSES_BY_THREAD.length).map((p) => p._id);
    }

    if (targetPostIds.length === 0) {
      return { ok: false as const, reason: "no_posts" as const };
    }

    const insertedResponses = await insertExampleResponses(ctx, targetPostIds, responders, t + 100);

    return {
      ok: true as const,
      insertedPosts,
      insertedResponses,
      postIds: targetPostIds
    };
  }
});
