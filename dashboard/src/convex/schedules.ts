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
    date: v.string(),
    time: v.string(),
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
      date: args.date,
      time: args.time,
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
    const groups = new Map<string, string[]>();

    all.forEach(s => {
      const existing = groups.get(s.parentId) || [];
      groups.set(s.parentId, [...existing, s.status]);
    });

    const groupValues = Array.from(groups.values());

    const scheduledCount = groupValues.filter(statuses =>
      statuses.includes("Scheduled") && statuses.length === 1
    ).length;


    const inprogressCount = groupValues.filter(statuses => {
      const hasInprogress = statuses.includes("Inprogress");
      const onlyAllowedStatuses = statuses.every(s =>
        s === "Inprogress" || s === "Scheduled"
      );
      return hasInprogress && onlyAllowedStatuses;
    }).length;

    return {
      inprogress: inprogressCount,
      scheduled: scheduledCount,
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
      title: "",
      parentId: args.parentId,
      service: args.service,
      date: "",
      time: "",
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

export const cleanup = mutation({
  handler: async (ctx) => {
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

    const oldItems = await ctx.db
      .query("schedules")
      .filter((q) => q.lt(q.field("_creationTime"), ninetyDaysAgo))
      .collect();

    for (const item of oldItems) {
      await ctx.db.delete(item._id);
    }
  },
});