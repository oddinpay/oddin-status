import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { TableAggregate } from "@convex-dev/aggregate";

export const monitorAggregate = new TableAggregate<{
  Key: string;
  DataModel: DataModel;
  TableName: "status";
}>(components.monitorCount, {
  sortKey: (doc) => doc._creationTime.toString(),
});

export const get = query({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) throw new Error("Unauthorized");
    return await ctx.db.query("status").collect();
  },
});

export const post = mutation({
  args: {
    apiKey: v.string(),
    host: v.string(),
    interval: v.number(),
    name: v.string(),
    protocol: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    const id = await ctx.db.insert("status", {
      host: args.host,
      interval: args.interval,
      name: args.name,
      protocol: args.protocol,
    });

    const doc = await ctx.db.get(id);
    if (doc) {
      await monitorAggregate.insert(ctx, doc);
    }
    return id;
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    return await monitorAggregate.count(ctx);
  },
});

export const patch = mutation({
  args: {
    id: v.id("status"),
    apiKey: v.string(),
    host: v.optional(v.string()),
    interval: v.optional(v.number()),
    name: v.optional(v.string()),
    protocol: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    const { id, apiKey, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const deleteById = mutation({
  args: { id: v.id("status"), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    const doc = await ctx.db.get(args.id);
    if (doc) {
      await monitorAggregate.delete(ctx, doc);
      await ctx.db.delete(args.id);
    }
  },
});

export const deleteBulk = mutation({
  args: { id: v.array(v.id("status")), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    for (const id of args.id) {
      const doc = await ctx.db.get(id);
      if (doc) {
        await monitorAggregate.delete(ctx, doc);
        await ctx.db.delete(id);
      }
    }
  },
});

export const backfill = mutation({
  handler: async (ctx) => {
    await monitorAggregate.clear(ctx);
    const existing = await ctx.db.query("status").collect();
    for (const doc of existing) {
      try {
        await monitorAggregate.insert(ctx, doc);
      } catch (e) {
        return `Error backfilling monitor ${doc._id}: ${e}`;
      }
    }
    return `Synced ${existing.length} monitors.`;
  },
});
