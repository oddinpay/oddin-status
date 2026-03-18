import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    const status = await ctx.db.query("status").collect();
    return status.map((status) => ({ ...status }));
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
