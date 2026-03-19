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
