import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("notifications").collect();
  },
});

export const post = mutation({
  args: {
    apiKey: v.string(),
    status: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    const id = await ctx.db.insert("notifications", {
      status: args.status,
      note: args.note,
      seen: false,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    apiKey: v.string(),
    id: v.id("notifications"),
    status: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      note: args.note,
    });

    return args.id;
  },
});

export const markAsRead = mutation({
  args: {
    apiKey: v.string(),
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      seen: true,
    });
  },
});

export const markAllAsRead = mutation({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("seen"), false))
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        seen: true,
      });
    }

    return { updatedCount: unreadNotifications.length };
  },
});

export const cleanup = internalMutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 35 * 24 * 60 * 60 * 1000;

    const oldItems = await ctx.db
      .query("notifications")
      .withIndex("by_status", (q) =>
        q.eq("status", "succeeded").lt("_creationTime", thirtyDaysAgo),
      )
      .collect();

    for (const item of oldItems) {
      await ctx.db.delete(item._id);
    }
  },
});
