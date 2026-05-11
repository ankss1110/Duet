import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { duetsTable } from "./duets";
import { usersTable } from "./users";

export const promptSuggestionsTable = pgTable("prompt_suggestions", {
  id: text("id").primaryKey(),
  duetId: text("duet_id").notNull().references(() => duetsTable.id),
  suggestedById: text("suggested_by_id").notNull().references(() => usersTable.id),
  promptText: text("prompt_text").notNull(),
  promptType: text("prompt_type").notNull().default("text"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const insertPromptSuggestionSchema = createInsertSchema(promptSuggestionsTable);
export type InsertPromptSuggestion = z.infer<typeof insertPromptSuggestionSchema>;
export type PromptSuggestion = typeof promptSuggestionsTable.$inferSelect;
