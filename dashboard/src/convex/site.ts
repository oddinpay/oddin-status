import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  handler: async (ctx) => {
    const site = await ctx.db.query("site").collect();
    return site.map((site) => ({ ...site }));
  },
});

export const site = mutation({
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
    const page = await ctx.db.insert("site", {
      title: args.title,
      description: args.description,
      textLogo: args.textLogo,
      signupUrl: args.signupUrl,
      signinUrl: args.signinUrl,
    });
    return page ? true : false;
  },
});
