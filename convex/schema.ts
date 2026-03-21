import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  testCounters: defineTable({
    key: v.string(),
    count: v.number()
  }).index("by_key", ["key"])
});
