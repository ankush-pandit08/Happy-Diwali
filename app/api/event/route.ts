import { NextRequest, NextResponse } from 'next/server';
import { eventCommand, StoreUnavailable } from '@/lib/event-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const cookieName = 'diwali_card';
const validId = (value: string) => /^[a-f0-9-]{36}$/.test(value);
function reply(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
function failure(error: unknown) {
  console.error('Diwali event request failed:', error instanceof Error ? error.message : 'Unknown error');
  return reply({ error: error instanceof StoreUnavailable
    ? 'The celebration is being set up. Please try again shortly.'
    : 'We could not save your card. Please try again.' }, 503);
}
export async function GET(request: NextRequest) {
  const device = request.cookies.get(cookieName)?.value ?? '';
  try { return reply(await eventCommand('state', validId(device) ? device : '')); }
  catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    if (!origin || new URL(origin).host !== request.nextUrl.host) return reply({ error: 'Please use the form on this website.' }, 403);
  } catch { return reply({ error: 'Invalid origin.' }, 403); }
  let body: { name?: unknown; action?: unknown };
  try { body = await request.json(); }
  catch { return reply({ error: 'Invalid request.' }, 400); }
  if (!body || typeof body !== 'object') return reply({ error: 'Invalid request.' }, 400);
  const existing = request.cookies.get(cookieName)?.value ?? '';
  const device = validId(existing) ? existing : crypto.randomUUID();
  try {
    if (body.action === 'reveal') {
      if (!validId(existing)) return reply({ error: 'Please enter your name first.' }, 400);
      const result = await eventCommand('reveal', device);
      if (!result.entry) return reply({ error: 'Please enter your name first.' }, 400);
      return reply(result);
    }
    if (body.action !== undefined) return reply({ error: 'Invalid action.' }, 400);
    const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
    if (name.length < 2 || name.length > 60 || /[\u0000-\u001f<>]/.test(name)) return reply({ error: 'Please enter a name between 2 and 60 characters.' }, 400);
    const result = await eventCommand('enter', device, name);
    const response = reply(result);
    response.cookies.set(cookieName, device, { httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 31536000 });
    return response;
  } catch (error) { return failure(error); }
}
