import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { TableAggregate } from "@convex-dev/aggregate";


export const scheduleAggregate = new TableAggregate<{
  Key: string;
  DataModel: DataModel;
  TableName: "schedules";
}>(components.scheduleCount, {
  sortKey: (doc) => doc.status,
});


export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("schedules").collect();
  },
});

export const post = mutation({
  args: {
    apiKey: v.string(),
    parentId: v.string(),
    title: v.optional(v.string()),
    service: v.string(),
    status: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    const id = await ctx.db.insert("schedules", {
      parentId: args.parentId,
      title: args.title ?? "",
      service: args.service,
      status: args.status,
      note: args.note,
    });

    const doc = await ctx.db.get(id);
    if (doc) {
      await scheduleAggregate.insert(ctx, doc);
    }
    return id;
  },
});


export const count = query({
  handler: async (ctx) => {
    return await scheduleAggregate.count(ctx);
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

export const update = mutation({
  args: {
    apiKey: v.string(),
    parentId: v.string(),
    service: v.string(),
    status: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    const id = await ctx.db.insert("schedules", {
      title: "", // Title is not updatable, so we set it to empty string to avoid confusion
      parentId: args.parentId,
      service: args.service,
      status: args.status,
      note: args.note,
    });

    const doc = await ctx.db.get(id);
    if (doc) {
      await scheduleAggregate.insert(ctx, doc);
    }
    return id;
  },
});

export const deleteById = mutation({
  args: { id: v.id("schedules"), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    const doc = await ctx.db.get(args.id);
    if (doc) {
      await scheduleAggregate.delete(ctx, doc);
      await ctx.db.delete(args.id);
    }
  },
});


export const deleteBulk = mutation({
  args: { id: v.array(v.id("schedules")), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    for (const id of args.id) {
      const doc = await ctx.db.get(id);
      if (doc) {
        await scheduleAggregate.delete(ctx, doc);
        await ctx.db.delete(id);
      }
    }
  },
});

export const backfill = mutation({
  handler: async (ctx) => {
    await scheduleAggregate.clear(ctx);
    const existing = await ctx.db.query("schedules").collect();
    for (const doc of existing) {
      try {
        await scheduleAggregate.insert(ctx, doc);
      } catch (e) {
        return `Error backfilling schedule ${doc._id}: ${e}`;
      }
    }
    return `Synced ${existing.length} schedules.`;
  },
});

