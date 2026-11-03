import assert from 'node:assert/strict';
import { test } from 'node:test';
import { eventCommand, StoreUnavailable, winningPositions } from '../lib/event-store.ts';

test('three distinct winning positions stay within the configured pool', () => {
  assert.deepEqual(winningPositions(3), [1, 2, 3]);
  for (const pool of [30, 50, 100, 100000]) {
    for (let trial = 0; trial < 100; trial++) {
      const positions = winningPositions(pool);
      assert.equal(new Set(positions).size, 3);
      assert.ok(positions.every(position => position >= 1 && position <= pool));
    }
  }
  for (const pool of [0, 2, -1, 3.5, NaN, 100001]) assert.throws(() => winningPositions(pool));
});

test('storage requires configuration and uses an atomic server-side EVAL', async () => {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const previousPool = process.env.DIWALI_CARD_POOL;
  const realFetch = globalThis.fetch;
  try {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    await assert.rejects(eventCommand('enter', 'device', 'Ankush'), StoreUnavailable);
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-secret';
    process.env.DIWALI_CARD_POOL = '3';
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'https://example.upstash.io');
      assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer test-secret');
      const command = JSON.parse(init?.body as string);
      assert.equal(command[0], 'EVAL'); assert.equal(command[2], '4');
      assert.deepEqual(command.slice(7, 10), ['reveal', 'device', '']);
      assert.deepEqual(JSON.parse(command[11]), [1, 2, 3]);
      return Response.json({ result: JSON.stringify({ entry: { id: 'card', name: 'Ankush', played: 1, win: 1 }, winnerCount: 3 }) });
    };
    assert.equal((await eventCommand('reveal', 'device')).entry?.win, 1);
    globalThis.fetch = async () => Response.json({ error: 'storage failure' });
    await assert.rejects(eventCommand('reveal', 'device'), /could not complete/);
    globalThis.fetch = async () => new Response('', { status: 503 });
    await assert.rejects(eventCommand('state', 'device'), /HTTP 503/);
  } finally {
    globalThis.fetch = realFetch;
    for (const [key, value] of Object.entries({ UPSTASH_REDIS_REST_URL: previousUrl, UPSTASH_REDIS_REST_TOKEN: previousToken, DIWALI_CARD_POOL: previousPool })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
