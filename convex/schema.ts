import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  telemetry: defineTable({
    temp: v.number(),
    status: v.string(),
    timestamp: v.number(),
  }),

  defects: defineTable({
    storageId: v.id("_storage"),
    heatSignature: v.number(),
    timeDetected: v.string(),
  }),
});
