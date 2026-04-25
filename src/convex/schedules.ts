import { query } from "./_generated/server";
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


export const count = query({
  handler: async (ctx) => {
    return await scheduleAggregate.count(ctx);
  },
});

export const getStatusCounts = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("schedules").collect();
    return {
      inprogress: all.filter(s => s.status === "Inprogress").length,
      scheduled: all.filter(s => s.status === "Scheduled").length,
      total: all.length
    };
  }
});

