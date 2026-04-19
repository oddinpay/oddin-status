import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { TableAggregate } from "@convex-dev/aggregate";

export const monitorAggregate = new TableAggregate<{
  Key: string;
  DataModel: DataModel;
  TableName: "schedules";
}>(components.monitorCount, {
  sortKey: (doc) => doc.service,
});


export const get = query({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) throw new Error("Unauthorized");
    return await ctx.db.query("schedules").collect();
  },
});

export const post = mutation({
  args: {
    apiKey: v.string(),
    title: v.string(),
    service: v.string(),
    status: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    const id = await ctx.db.insert("schedules", {
      title: args.title,
      service: args.service,
      status: args.status,
      note: args.note,
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

export const getStatusCounts = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("schedules").collect();
    return {
      inprogress: all.filter(s => s.status === "Inprogress").length,
      scheduled: all.filter(s => s.status === "Scheduled").length,
      total: all.length
    };
  }
});

export const backfill = mutation({
  handler: async (ctx) => {
    await monitorAggregate.clear(ctx);
    const existing = await ctx.db.query("schedules").collect();
    for (const doc of existing) {
      try {
        await monitorAggregate.insert(ctx, doc);
      } catch (e) {
        return `Error backfilling schedule ${doc._id}: ${e}`;
      }
    }
    return `Synced ${existing.length} schedules.`;
  },
});

