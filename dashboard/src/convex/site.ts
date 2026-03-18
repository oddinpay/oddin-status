import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  handler: async (ctx) => {
    const site = await ctx.db.query("site").collect();
    return site.map((site) => ({ ...site }));
  },
});

export const post = mutation({
  args: {
    apiKey: v.string(),
    title: v.string(),
    description: v.string(),
    textLogo: v.string(),
    signupUrl: v.string(),
    signinUrl: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    await ctx.db.insert("site", {
      title: args.title,
      description: args.description,
      textLogo: args.textLogo,
      signupUrl: args.signupUrl,
      signinUrl: args.signinUrl,
    });
  },
});

export const patch = mutation({
  args: {
    id: v.id("site"),
    image: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    textLogo: v.optional(v.string()),
    signupUrl: v.optional(v.string()),
    signinUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Site not found");
    }
    await ctx.db.patch(id, rest);
  },
});
