import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const duetsTable = pgTable("duets", {
  id: text("id").primaryKey(),
  inviteCode: text("invite_code").notNull().unique(),
  creatorId: text("creator_id").notNull().references(() => usersTable.id),
  partnerId: text("partner_id").references(() => usersTable.id),
  partnerDisplayName: text("partner_display_name").notNull(),
  partnerAvatarColor: text("partner_avatar_color").notNull(),
  partnerAvatarIcon: text("partner_avatar_icon").notNull(),
  currentPromptIndex: integer("current_prompt_index").notNull().default(0),
  currentPromptStartedAt: timestamp("current_prompt_started_at", { withTimezone: true }).notNull().defaultNow(),
  streak: integer("streak").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDuetSchema = createInsertSchema(duetsTable);
export type InsertDuet = z.infer<typeof insertDuetSchema>;
export type Duet = typeof duetsTable.$inferSelect;
