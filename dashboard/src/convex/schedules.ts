import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { TableAggregate } from "@convex-dev/aggregate";

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

    // const doc = await ctx.db.get(id);
    // if (doc) {
    //   await monitorAggregate.insert(ctx, doc);
    // }
    return id;
  },
});