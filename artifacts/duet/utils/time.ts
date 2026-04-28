export function formatTimeLeft(startedAt: number, durationMs: number = 48 * 60 * 60 * 1000) {
  const expiresAt = startedAt + durationMs;
  const now = Date.now();
  const leftMs = expiresAt - now;
  
  if (leftMs <= 0) return "Expired";
  
  const hours = Math.floor(leftMs / (1000 * 60 * 60));
  if (hours > 24) return `about ${Math.floor(hours / 24)} days left`;
  if (hours > 0) return `about ${hours} hours left`;
  
  const minutes = Math.floor(leftMs / (1000 * 60));
  if (minutes > 0) return `${minutes} minutes left`;
  
  return "less than a minute left";
}