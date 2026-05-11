import { Router } from "express";
import { db, duetsTable, roundsTable, usersTable } from "@workspace/db";
import { and, desc, eq, isNull, not, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import type { Duet, Round } from "@workspace/db";

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
    myResponse: myRaw ?? null,
    partnerResponse: revealed ? (theirRaw ?? null) : null,
    revealed,
    history: historyRounds.map((r) => ({
      roundId: r.id,
      promptIndex: r.promptIndex,
      myResponse: (isCreator ? r.creatorResponse : r.partnerResponse) ?? "",
      partnerResponse: (isCreator ? r.partnerResponse : r.creatorResponse) ?? "",
      myReaction: (isCreator ? r.creatorReaction : r.partnerReaction) ?? null,
      partnerReaction: (isCreator ? r.partnerReaction : r.creatorReaction) ?? null,
      completedAt: r.completedAt?.toISOString() ?? "",
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

  const activeRound = await getOrCreateActiveRound(duetId, duet.currentPromptIndex);

  const historyRounds = await db
    .select()
    .from(roundsTable)
    .where(and(eq(roundsTable.duetId, duetId), not(isNull(roundsTable.completedAt))))
    .orderBy(desc(roundsTable.completedAt));

  return formatDuetState(duet, activeRound, historyRounds, userId);
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
    res.status(400).json({ error: "partnerName, partnerAvatarColor, and partnerAvatarIcon are required" });
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

  if (updatedRound.creatorResponse && updatedRound.partnerResponse && !updatedRound.revealedAt) {
    await db
      .update(roundsTable)
      .set({ revealedAt: new Date() })
      .where(eq(roundsTable.id, activeRound.id));
  }

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

  const reactionField = reaction
    ? isCreator
      ? { creatorReaction: reaction }
      : { partnerReaction: reaction }
    : {};

  await db
    .update(roundsTable)
    .set({ completedAt: new Date(), ...reactionField })
    .where(eq(roundsTable.id, activeRound.id));

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

  await db.insert(roundsTable).values({
    id: crypto.randomUUID(),
    duetId: id,
    promptIndex: newPromptIndex,
  });

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

export default router;
