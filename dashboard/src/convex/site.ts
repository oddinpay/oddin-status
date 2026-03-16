import { query } from './_generated/server';
import { v } from 'convex/values';

export const get = query({
	args: {
		apiKey: v.string()
	},
	handler: async (ctx, args) => {
		if (args.apiKey !== process.env.API_KEY) {
			throw new Error('Unauthorized');
		}
		const site = await ctx.db.query('site').collect();
		return site.map((site) => ({ ...site }));
	}
});
