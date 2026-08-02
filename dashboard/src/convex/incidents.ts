import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { TableAggregate } from "@convex-dev/aggregate";

export const incidentAggregate = new TableAggregate<{
  Key: string;
  DataModel: DataModel;
  TableName: "incidents";
}>(components.incidentCount, {
  sortKey: (doc) => doc.status,
});

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("incidents").collect();
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

    const id = await ctx.db.insert("incidents", {
      parentId: args.parentId,
      title: args.title ?? "",
      status: args.status,
      service: args.service,
      note: args.note,
    });

    const doc = await ctx.db.get(id);
    if (doc) {
      await incidentAggregate.insert(ctx, doc);
    }
    return id;
  },
});

export const count = query({
  handler: async (ctx) => {
    return await incidentAggregate.count(ctx);
  },
});

export const getStatusCounts = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("incidents").collect();
    const groups = new Map<string, string[]>();

    all.forEach((s) => {
      const existing = groups.get(s.parentId) || [];
      groups.set(s.parentId, [...existing, s.status]);
    });

    const identifiedCount = Array.from(groups.values()).filter(
      (statuses) =>
        statuses.includes("Identified") &&
        statuses.every((s) => s === "Identified" || s === "Investigating"),
    ).length;

    const incidentCount = Array.from(groups.values()).filter(
      (statuses) =>
        statuses.includes("Investigating") &&
        statuses.every(
          (s) =>
            s === "Identified" || s === "Investigating" || s === "Inprogress",
        ),
    ).length;

    return {
      incidents: incidentCount,
      identified: identifiedCount,
      total: all.length,
    };
  },
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

    const id = await ctx.db.insert("incidents", {
      title: "",
      parentId: args.parentId,
      status: args.status,
      service: args.service,
      note: args.note,
    });

    const doc = await ctx.db.get(id);
    if (doc) {
      await incidentAggregate.insert(ctx, doc);
    }
    return id;
  },
});

export const deleteById = mutation({
  args: { id: v.id("incidents"), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    const doc = await ctx.db.get(args.id);
    if (doc) {
      await incidentAggregate.delete(ctx, doc);
      await ctx.db.delete(args.id);
    }
  },
});

export const deleteBulk = mutation({
  args: { id: v.array(v.id("incidents")), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    for (const id of args.id) {
      const doc = await ctx.db.get(id);
      if (doc) {
        await incidentAggregate.delete(ctx, doc);
        await ctx.db.delete(id);
      }
    }
  },
});

export const backfill = mutation({
  handler: async (ctx) => {
    await incidentAggregate.clear(ctx);
    const existing = await ctx.db.query("incidents").collect();
    for (const doc of existing) {
      try {
        await incidentAggregate.insert(ctx, doc);
      } catch (e) {
        return `Error backfilling incident ${doc._id}: ${e}`;
      }
    }
    return `Synced ${existing.length} incidents.`;
  },
});

export const cleanup = internalMutation({
  handler: async (ctx) => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const oldItems = await ctx.db
      .query("incidents")
      .withIndex("by_status", (q) =>
        q.eq("status", "Resolved").lt("_creationTime", ninetyDaysAgo),
      )
      .collect();

    for (const item of oldItems) {
      await ctx.db.delete(item._id);
    }
  },
});

