import "server-only";

// In-memory typing presence. Good enough for local/single-process dev; for a
// multi-instance deployment back this with Redis or a websocket server.
const typing = new Map<string, Map<string, number>>();
const TTL = 4000;

export function setTyping(conversationId: string, userId: string) {
  let m = typing.get(conversationId);
  if (!m) {
    m = new Map();
    typing.set(conversationId, m);
  }
  m.set(userId, Date.now());
}

export function getTyping(conversationId: string, exclude: string): string[] {
  const m = typing.get(conversationId);
  if (!m) return [];
  const now = Date.now();
  const active: string[] = [];
  for (const [userId, ts] of m) {
    if (now - ts > TTL) m.delete(userId);
    else if (userId !== exclude) active.push(userId);
  }
  return active;
}
