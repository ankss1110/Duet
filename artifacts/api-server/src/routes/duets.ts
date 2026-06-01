import { Router } from "express";
import { db, duetsTable, roundsTable, usersTable, promptSuggestionsTable } from "@workspace/db";
import { and, asc, desc, eq, isNull, not, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import type { Duet, Round, PromptSuggestion } from "@workspace/db";

async function sendPushNotification(
  token: string | null | undefined,
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  if (!token || !token.startsWith("ExponentPushToken")) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: token, title, body, data, sound: "default" }),
    });
  } catch {
    // Best-effort — never fail the request over a notification
  }
}

const router = Router();

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

function formatDuetState(
  duet: Duet,
  activeRound: Round | null,
  historyRounds: Round[],
  pendingSuggestions: PromptSuggestion[],
  userId: string,
) {
  const isCreator = duet.creatorId === userId;
  const myRaw = isCreator ? activeRound?.creatorResponse : activeRound?.partnerResponse;
  const theirRaw = isCreator ? activeRound?.partnerResponse : activeRound?.creatorResponse;
  const revealed = !!activeRound?.revealedAt;

  return {
    id: duet.id,
    inviteCode: duet.inviteCode,
    partnerName: duet.partnerDisplayName,
    partnerAvatarColor: duet.partnerAvatarColor,
    partnerAvatarIcon: duet.partnerAvatarIcon,
    isCreator,
    partnerJoined: !!duet.partnerId,
    streak: duet.streak,
    currentPromptIndex: duet.currentPromptIndex,
    currentPromptStartedAt: duet.currentPromptStartedAt.toISOString(),
    duetCreatedAt: duet.createdAt.toISOString(),
    customPrompt: activeRound?.customPrompt ?? null,
    customPromptType: activeRound?.customPromptType ?? null,
    myResponse: myRaw ?? null,
    partnerResponse: revealed ? (theirRaw ?? null) : null,
    revealed,
    history: historyRounds.map((r) => ({
      roundId: r.id,
      promptIndex: r.promptIndex,
      customPrompt: r.customPrompt ?? null,
      customPromptType: r.customPromptType ?? null,
      myResponse: (isCreator ? r.creatorResponse : r.partnerResponse) ?? "",
      partnerResponse: (isCreator ? r.partnerResponse : r.creatorResponse) ?? "",
      myReaction: (isCreator ? r.creatorReaction : r.partnerReaction) ?? null,
      partnerReaction: (isCreator ? r.partnerReaction : r.creatorReaction) ?? null,
      completedAt: r.completedAt?.toISOString() ?? "",
    })),
    pendingSuggestions: pendingSuggestions.map((s) => ({
      id: s.id,
      text: s.promptText,
      type: s.promptType,
      suggestedByMe: s.suggestedById === userId,
    })),
  };
}

async function getOrCreateActiveRound(duetId: string, promptIndex: number) {
  const [existing] = await db
    .select()
    .from(roundsTable)
    .where(and(eq(roundsTable.duetId, duetId), isNull(roundsTable.completedAt)))
    .limit(1);
  if (existing) return existing;

  const [newRound] = await db
    .insert(roundsTable)
    .values({ id: crypto.randomUUID(), duetId, promptIndex })
    .returning();
  return newRound;
}

async function getFullDuetState(duetId: string, userId: string) {
  const [duet] = await db
    .select()
    .from(duetsTable)
    .where(eq(duetsTable.id, duetId));
  if (!duet) return null;

  const [activeRound, historyRounds, pendingSuggestions] = await Promise.all([
    getOrCreateActiveRound(duetId, duet.currentPromptIndex),
    db
      .select()
      .from(roundsTable)
      .where(and(eq(roundsTable.duetId, duetId), not(isNull(roundsTable.completedAt))))
      .orderBy(desc(roundsTable.completedAt)),
    db
      .select()
      .from(promptSuggestionsTable)
      .where(
        and(
          eq(promptSuggestionsTable.duetId, duetId),
          eq(promptSuggestionsTable.status, "pending"),
        ),
      )
      .orderBy(asc(promptSuggestionsTable.createdAt)),
  ]);

  return formatDuetState(duet, activeRound, historyRounds, pendingSuggestions, userId);
}

function str(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

// GET /duets - list user's duets
router.get("/duets", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const duets = await db
    .select()
    .from(duetsTable)
    .where(or(eq(duetsTable.creatorId, userId), eq(duetsTable.partnerId, userId)))
    .orderBy(desc(duetsTable.createdAt));

  const results = await Promise.all(duets.map((d) => getFullDuetState(d.id, userId)));
  res.json(results.filter(Boolean));
});

// POST /duets - create a new duet
router.post("/duets", requireAuth, async (req, res) => {
  const { partnerName, partnerAvatarColor, partnerAvatarIcon } = req.body;
  if (!partnerName || !partnerAvatarColor || !partnerAvatarIcon) {
    res
      .status(400)
      .json({ error: "partnerName, partnerAvatarColor, and partnerAvatarIcon are required" });
    return;
  }

  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 5) {
    const [existing] = await db
      .select()
      .from(duetsTable)
      .where(eq(duetsTable.inviteCode, inviteCode));
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const [duet] = await db
    .insert(duetsTable)
    .values({
      id: crypto.randomUUID(),
      inviteCode,
      creatorId: req.user.id,
      partnerDisplayName: partnerName,
      partnerAvatarColor,
      partnerAvatarIcon,
    })
    .returning();

  const state = await getFullDuetState(duet.id, req.user.id);
  res.status(201).json(state);
});

// POST /duets/join - join with invite code (must be before /:id)
router.post("/duets/join", requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: "code is required" });
    return;
  }

  const [duet] = await db
    .select()
    .from(duetsTable)
    .where(eq(duetsTable.inviteCode, code.toUpperCase().trim()));

  if (!duet) {
    res.status(404).json({ error: "No duet found with that code" });
    return;
  }
  if (duet.partnerId) {
    if (duet.partnerId === req.user.id || duet.creatorId === req.user.id) {
      const state = await getFullDuetState(duet.id, req.user.id);
      res.json(state);
      return;
    }
    res.status(409).json({ error: "This duet already has two members" });
    return;
  }
  if (duet.creatorId === req.user.id) {
    res.status(400).json({ error: "You cannot join your own duet" });
    return;
  }

  await db
    .update(duetsTable)
    .set({ partnerId: req.user.id })
    .where(eq(duetsTable.id, duet.id));

  const state = await getFullDuetState(duet.id, req.user.id);
  res.json(state);
});

// GET /duets/:id - get duet state
router.get("/duets/:id", requireAuth, async (req, res) => {
  const id = str(req.params.id);
  const userId = req.user.id;

  const [duet] = await db.select().from(duetsTable).where(eq(duetsTable.id, id));
  if (!duet) {
    res.status(404).json({ error: "Duet not found" });
    return;
  }
  if (duet.creatorId !== userId && duet.partnerId !== userId) {
    res.status(403).json({ error: "Not a member of this duet" });
    return;
  }

  const state = await getFullDuetState(id, userId);
  res.json(state);
});

// POST /duets/:id/respond
router.post("/duets/:id/respond", requireAuth, async (req, res) => {
  const id = str(req.params.id);
  const { response } = req.body;
  const userId = req.user.id;

  if (!response) {
    res.status(400).json({ error: "response is required" });
    return;
  }

  const [duet] = await db.select().from(duetsTable).where(eq(duetsTable.id, id));
  if (!duet) {
    res.status(404).json({ error: "Duet not found" });
    return;
  }
  if (duet.creatorId !== userId && duet.partnerId !== userId) {
    res.status(403).json({ error: "Not a member of this duet" });
    return;
  }
  if (!duet.partnerId) {
    res.status(400).json({ error: "Partner has not joined yet" });
    return;
  }

  const isCreator = duet.creatorId === userId;
  const activeRound = await getOrCreateActiveRound(id, duet.currentPromptIndex);

  const alreadyResponded = isCreator
    ? !!activeRound.creatorResponse
    : !!activeRound.partnerResponse;
  if (alreadyResponded) {
    res.status(400).json({ error: "Already responded to this prompt" });
    return;
  }

  const updateData = isCreator
    ? { creatorResponse: response }
    : { partnerResponse: response };
  await db.update(roundsTable).set(updateData).where(eq(roundsTable.id, activeRound.id));

  const [updatedRound] = await db
    .select()
    .from(roundsTable)
    .where(eq(roundsTable.id, activeRound.id));

  const bothResponded =
    updatedRound.creatorResponse && updatedRound.partnerResponse && !updatedRound.revealedAt;

  if (bothResponded) {
    await db
      .update(roundsTable)
      .set({ revealedAt: new Date() })
      .where(eq(roundsTable.id, activeRound.id));
  }

  // Fire push notifications async — don't block the response
  (async () => {
    const partnerId = isCreator ? duet.partnerId! : duet.creatorId;
    const [partnerUser, myUser] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, partnerId)).limit(1),
      db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1),
    ]);
    const myName = myUser[0]?.displayName ?? "Your partner";
    const data = { duetId: id };

    if (bothResponded) {
      // Both answered — notify the partner (who just triggered reveal) AND the first responder
      // Partner was notified above as "your turn", now tell first responder reveal is ready
      const firstResponderId = isCreator ? duet.partnerId! : duet.creatorId;
      const [firstResponder] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, firstResponderId))
        .limit(1);
      await sendPushNotification(
        firstResponder?.expoPushToken,
        "Answers revealed! 🎉",
        `${myName} answered — tap to see both responses.`,
        data,
      );
    } else {
      // Only one person has answered — nudge the partner
      await sendPushNotification(
        partnerUser[0]?.expoPushToken,
        `${myName} answered ✨`,
        "They're waiting to see your answer.",
        data,
      );
    }
  })().catch(() => {});

  const state = await getFullDuetState(id, userId);
  res.json(state);
});

// POST /duets/:id/next - advance to next prompt
router.post("/duets/:id/next", requireAuth, async (req, res) => {
  const id = str(req.params.id);
  const { reaction } = req.body;
  const userId = req.user.id;

  const [duet] = await db.select().from(duetsTable).where(eq(duetsTable.id, id));
  if (!duet) {
    res.status(404).json({ error: "Duet not found" });
    return;
  }
  if (duet.creatorId !== userId && duet.partnerId !== userId) {
    res.status(403).json({ error: "Not a member of this duet" });
    return;
  }

  const isCreator = duet.creatorId === userId;
  const activeRound = await getOrCreateActiveRound(id, duet.currentPromptIndex);

  // Guard: both players must have responded before anyone can advance
  if (!activeRound.revealedAt) {
    res.status(400).json({ error: "Both players must respond before advancing" });
    return;
  }

  // Guard: if this round was already completed by the other player racing us,
  // just return the latest state — don't double-advance
  if (activeRound.completedAt) {
    const state = await getFullDuetState(id, userId);
    res.json(state);
    return;
  }

  const reactionField = reaction
    ? isCreator
      ? { creatorReaction: reaction }
      : { partnerReaction: reaction }
    : {};

  // Atomic update: only succeeds if completedAt is still NULL (prevents race)
  const completed = await db
    .update(roundsTable)
    .set({ completedAt: new Date(), ...reactionField })
    .where(and(eq(roundsTable.id, activeRound.id), isNull(roundsTable.completedAt)))
    .returning({ id: roundsTable.id });

  if (completed.length === 0) {
    // Other player completed this round a moment before us — return current state
    const state = await getFullDuetState(id, userId);
    res.json(state);
    return;
  }

  const msSinceStart = Date.now() - duet.currentPromptStartedAt.getTime();
  const withinTimer = msSinceStart < 48 * 60 * 60 * 1000;
  const newStreak = withinTimer ? duet.streak + 1 : 0;
  const newPromptIndex = duet.currentPromptIndex + 1;

  await db
    .update(duetsTable)
    .set({
      currentPromptIndex: newPromptIndex,
      currentPromptStartedAt: new Date(),
      streak: newStreak,
    })
    .where(eq(duetsTable.id, id));

  // Check for a queued custom prompt suggestion
  const [nextSuggestion] = await db
    .select()
    .from(promptSuggestionsTable)
    .where(
      and(
        eq(promptSuggestionsTable.duetId, id),
        eq(promptSuggestionsTable.status, "pending"),
      ),
    )
    .orderBy(asc(promptSuggestionsTable.createdAt))
    .limit(1);

  if (nextSuggestion) {
    await db
      .update(promptSuggestionsTable)
      .set({ status: "used", usedAt: new Date() })
      .where(eq(promptSuggestionsTable.id, nextSuggestion.id));

    await db.insert(roundsTable).values({
      id: crypto.randomUUID(),
      duetId: id,
      promptIndex: newPromptIndex,
      customPrompt: nextSuggestion.promptText,
      customPromptType: nextSuggestion.promptType,
    });
  } else {
    await db.insert(roundsTable).values({
      id: crypto.randomUUID(),
      duetId: id,
      promptIndex: newPromptIndex,
    });
  }

  const state = await getFullDuetState(id, userId);
  res.json(state);
});

// POST /duets/:id/react - react to a completed round
router.post("/duets/:id/react", requireAuth, async (req, res) => {
  const id = str(req.params.id);
  const { roundId, reaction } = req.body;
  const userId = req.user.id;

  if (!roundId || !reaction) {
    res.status(400).json({ error: "roundId and reaction are required" });
    return;
  }

  const [duet] = await db.select().from(duetsTable).where(eq(duetsTable.id, id));
  if (!duet) {
    res.status(404).json({ error: "Duet not found" });
    return;
  }
  if (duet.creatorId !== userId && duet.partnerId !== userId) {
    res.status(403).json({ error: "Not a member of this duet" });
    return;
  }

  const isCreator = duet.creatorId === userId;
  const updateData = isCreator ? { creatorReaction: reaction } : { partnerReaction: reaction };

  await db
    .update(roundsTable)
    .set(updateData)
    .where(and(eq(roundsTable.id, roundId), eq(roundsTable.duetId, id)));

  const state = await getFullDuetState(id, userId);
  res.json(state);
});

// POST /duets/:id/suggest - suggest a custom prompt
router.post("/duets/:id/suggest", requireAuth, async (req, res) => {
  const id = str(req.params.id);
  const { text, type = "text" } = req.body;
  const userId = req.user.id;

  if (!text || typeof text !== "string" || text.trim().length < 5) {
    res.status(400).json({ error: "text must be at least 5 characters" });
    return;
  }

  const [duet] = await db.select().from(duetsTable).where(eq(duetsTable.id, id));
  if (!duet) {
    res.status(404).json({ error: "Duet not found" });
    return;
  }
  if (duet.creatorId !== userId && duet.partnerId !== userId) {
    res.status(403).json({ error: "Not a member of this duet" });
    return;
  }

  await db.insert(promptSuggestionsTable).values({
    id: crypto.randomUUID(),
    duetId: id,
    suggestedById: userId,
    promptText: text.trim(),
    promptType: type === "photo" ? "photo" : "text",
  });

  const state = await getFullDuetState(id, userId);
  res.status(201).json(state);
});

// DELETE /duets/:id/suggest/:suggestionId - remove a queued suggestion
router.delete("/duets/:id/suggest/:suggestionId", requireAuth, async (req, res) => {
  const id = str(req.params.id);
  const suggestionId = str(req.params.suggestionId);
  const userId = req.user.id;

  const [suggestion] = await db
    .select()
    .from(promptSuggestionsTable)
    .where(eq(promptSuggestionsTable.id, suggestionId));

  if (!suggestion || suggestion.duetId !== id) {
    res.status(404).json({ error: "Suggestion not found" });
    return;
  }
  if (suggestion.suggestedById !== userId) {
    res.status(403).json({ error: "You can only remove your own suggestions" });
    return;
  }

  await db
    .delete(promptSuggestionsTable)
    .where(eq(promptSuggestionsTable.id, suggestionId));

  const state = await getFullDuetState(id, userId);
  res.json(state);
});

export default router;
