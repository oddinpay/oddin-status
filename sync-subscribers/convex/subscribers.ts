import { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { TableAggregate } from "@convex-dev/aggregate";

export const subscriberAggregate = new TableAggregate<{
  Key: string;
  DataModel: DataModel;
  TableName: "subscribers";
}>(components.subscriberCount, {
  sortKey: (doc) => doc.email,
});

export const addSubscriber = mutation({
  args: {
    apiKey: v.string(),
    email: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      throw new Error("Subscriber with this email already exists");
    }

    const subscriberId = await ctx.db.insert("subscribers", {
      email: args.email,
      status: args.status,
    });

    if (args.status === "subscribed") {
      const subscriber = await ctx.db.get(subscriberId);
      if (subscriber) {
        await subscriberAggregate.insert(ctx, subscriber);
      }
    }
  },
});

export const deleteById = mutation({
  args: { id: v.id("subscribers"), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    const doc = await ctx.db.get(args.id);
    if (doc) {
      await subscriberAggregate.delete(ctx, doc);
      await ctx.db.delete(args.id);
    }
  },
});

export const deleteBulk = mutation({
  args: { id: v.array(v.id("subscribers")), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    for (const id of args.id) {
      const doc = await ctx.db.get(id);
      if (doc) {
        await subscriberAggregate.delete(ctx, doc);
        await ctx.db.delete(id);
      }
    }
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    return await subscriberAggregate.count(ctx);
  },
});

export const getSubscriberByEmail = query({
  args: {
    apiKey: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    return await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Sync
export const backfill = mutation({
  handler: async (ctx) => {
    await subscriberAggregate.clear(ctx);
    const existing = await ctx.db.query("subscribers").collect();
    for (const sub of existing) {
      try {
        await subscriberAggregate.insert(ctx, sub);
      } catch (e) {
        return `Error backfilling subscriber ${sub._id}: ${e}`;
      }
    }
    return `Synced ${existing.length} subscribers.`;
  },
});
