import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { duetsTable } from "./duets";

export const roundsTable = pgTable("rounds", {
  id: text("id").primaryKey(),
  duetId: text("duet_id").notNull().references(() => duetsTable.id),
  promptIndex: integer("prompt_index").notNull(),
  customPrompt: text("custom_prompt"),
  customPromptType: text("custom_prompt_type"),
  creatorResponse: text("creator_response"),
  partnerResponse: text("partner_response"),
  creatorReaction: text("creator_reaction"),
  partnerReaction: text("partner_reaction"),
  revealedAt: timestamp("revealed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoundSchema = createInsertSchema(roundsTable);
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof roundsTable.$inferSelect;
