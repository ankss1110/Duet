import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateToken(length = 32) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return result;
}

router.post("/users", async (req, res) => {
  const { displayName, avatarColor, avatarIcon } = req.body;
  if (!displayName || !avatarColor || !avatarIcon) {
    res.status(400).json({ error: "displayName, avatarColor, and avatarIcon are required" });
    return;
  }

  const id = crypto.randomUUID();
  const deviceToken = generateToken(48);

  const [user] = await db
    .insert(usersTable)
    .values({ id, displayName, avatarColor, avatarIcon, deviceToken })
    .returning();

  res.status(201).json({
    id: user.id,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    avatarIcon: user.avatarIcon,
    deviceToken: user.deviceToken,
  });
});

router.get("/users/me", requireAuth, async (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    avatarIcon: user.avatarIcon,
  });
});

router.patch("/users/me/push-token", requireAuth, async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "token is required" });
    return;
  }
  await db
    .update(usersTable)
    .set({ expoPushToken: token })
    .where(eq(usersTable.id, req.user.id));
  res.status(204).end();
});

export default router;
