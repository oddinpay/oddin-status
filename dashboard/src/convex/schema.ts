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
    textLogo: v.string(),
    signupUrl: v.string(),
    signinUrl: v.string(),
  }),
});
