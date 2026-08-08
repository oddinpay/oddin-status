import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notifications: defineTable({
    status: v.string(),
    note: v.string(),
    seen: v.boolean(),
  }).index("by_status", ["status"]),
});
