import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const insertReading = mutation({
  args: {
    temp: v.number(),
    status: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("telemetry", {
      temp: args.temp,
      status: args.status,
      timestamp: args.timestamp,
    });

    const all = await ctx.db.query("telemetry").order("desc").collect();

    if (all.length > 100) {
      const toDelete = all.slice(100);
      for (const row of toDelete) {
        await ctx.db.delete(row._id);
      }
    }
  },
});

export const getLast20 = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("telemetry").order("desc").take(20);
  },
});

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("telemetry").order("desc").first();
  },
});
