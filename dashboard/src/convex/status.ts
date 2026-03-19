import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { TableAggregate } from "@convex-dev/aggregate";

export const monitorAggregate = new TableAggregate<{
  Key: null;
  DataModel: DataModel;
  TableName: "status";
}>(components.monitorCount, {
  sortKey: () => null,
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
    const monitor = await ctx.db.insert("status", {
      host: args.host,
      interval: args.interval,
      name: args.name,
      protocol: args.protocol,
    });

    return monitor;
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    return await monitorAggregate.count(ctx);
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
        return `Error syncing monitor ${doc._id}: ${e}`;
      }
    }
    return `Synced ${existing.length} monitors.`;
  },
});
