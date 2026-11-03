import { randomInt } from 'node:crypto';
import type { EventState } from './event-types.ts';

export class StoreUnavailable extends Error {}

// Atomic across serverless instances: retries cannot reroll or consume two slots.
export const eventScript = `
local action, device, name = ARGV[1], ARGV[2], ARGV[3]
local entry = redis.call('HGET', KEYS[1], device)
if action == 'enter' and not entry then
  entry = cjson.encode({id=ARGV[4], name=name, played=0, win=0})
  redis.call('HSET', KEYS[1], device, entry)
end
if action == 'reveal' and entry then
  local card = cjson.decode(entry)
  if card.played == 0 then
    redis.call('SET', KEYS[4], ARGV[5], 'NX')
    local positions = cjson.decode(redis.call('GET', KEYS[4]))
    local position = redis.call('INCR', KEYS[2])
    card.played = 1
    for _, winningPosition in ipairs(positions) do
      if position == winningPosition then card.win = 1 end
    end
    if card.win == 1 then redis.call('INCR', KEYS[3]) end
    entry = cjson.encode(card)
    redis.call('HSET', KEYS[1], device, entry)
  end
end
return cjson.encode({entry=entry and cjson.decode(entry) or cjson.null,
  winnerCount=tonumber(redis.call('GET', KEYS[3]) or '0')})
`;

export function winningPositions(pool: number): number[] {
  if (!Number.isSafeInteger(pool) || pool < 3 || pool > 100000) {
    throw new Error('DIWALI_CARD_POOL must be an integer from 3 to 100000.');
  }
  const positions = new Set<number>();
  while (positions.size < 3) positions.add(randomInt(1, pool + 1));
  return [...positions].sort((a, b) => a - b);
}

export async function eventCommand(action: 'state' | 'enter' | 'reveal', device: string, name = ''): Promise<EventState> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new StoreUnavailable('Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
  const prefix = `diwali:{${process.env.DIWALI_EVENT_ID || 'diwali-2026'}}`;
  const positions = action === 'reveal' ? winningPositions(Number(process.env.DIWALI_CARD_POOL || 30)) : [];
  const response = await fetch(url, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', eventScript, '4', `${prefix}:entries`, `${prefix}:scratches`,
      `${prefix}:winners`, `${prefix}:positions`, action, device, name, crypto.randomUUID(), JSON.stringify(positions)]),
  });
  if (!response.ok) throw new Error(`Event storage returned HTTP ${response.status}.`);
  const data = await response.json() as { result?: string; error?: string };
  if (data.error || typeof data.result !== 'string') throw new Error('Event storage could not complete the request.');
  return JSON.parse(data.result) as EventState;
}
