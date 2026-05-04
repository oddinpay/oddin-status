import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  status: defineTable({
    host: v.string(),
    interval: v.number(),
    name: v.string(),
    protocol: v.string(),
  }),
  site: defineTable({
    title: v.string(),
    description: v.string(),
    textLogo: v.optional(v.string()),
    signupUrl: v.optional(v.string()),
    signinUrl: v.optional(v.string()),
    image: v.optional(v.string()),
    slug: v.optional(v.string()),
  }),

  incidents: defineTable({
    parentId: v.string(),
    service: v.string(),
    title: v.string(),
    status: v.string(),
    note: v.string(),
  }),

  schedules: defineTable({
    parentId: v.string(),
    title: v.string(),
    service: v.string(),
    date: v.string(),
    time: v.string(),
    status: v.string(),
    note: v.string(),
  }),
});
