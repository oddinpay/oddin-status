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
    image: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db.query("site").first();

    if (existing !== null) {
      throw new Error("A site already exists.");
    }

    await ctx.db.insert("site", {
      title: args.title,
      description: args.description,
      textLogo: args.textLogo,
      signupUrl: args.signupUrl,
      signinUrl: args.signinUrl,
      image: args.image,
      slug: args.slug,
    });
  },
});

export const patch = mutation({
  args: {
    id: v.id("site"),
    apiKey: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    textLogo: v.optional(v.string()),
    signupUrl: v.optional(v.string()),
    signinUrl: v.optional(v.string()),
    image: v.optional(v.string()),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const deleteById = mutation({
  args: { id: v.id("site"), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.API_KEY) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});
