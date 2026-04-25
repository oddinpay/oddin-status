import { query } from "./_generated/server";

export const get = query({
  handler: async (ctx) => {
    const site = await ctx.db.query("site").collect();
    return site.map((site) => ({ ...site }));
  },
});

