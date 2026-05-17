import { supabase, SUPABASE_MISSING } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const guard = () =>
  !supabase ? NextResponse.json({ error: SUPABASE_MISSING }, { status: 503 }) : null;

// GET /api/trades                    — all trades
// GET /api/trades?year=2025&month=5  — trades for month
// GET /api/trades?date=2025-05-12    — trades for specific date
export async function GET(request) {
  const err = guard(); if (err) return err;
  const { searchParams } = new URL(request.url);
  const year  = searchParams.get('year');
  const month = searchParams.get('month');
  const date  = searchParams.get('date');

  let query = supabase.from('trades').select('*').order('date').order('created_at');

  if (date) {
    query = query.eq('date', date);
  } else if (year && month) {
    const y = String(year);
    const m = String(month).padStart(2, '0');
    const from = `${y}-${m}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const to = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    query = query.gte('date', from).lte('date', to);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/trades — always INSERT a new trade row
export async function POST(request) {
  const err = guard(); if (err) return err;

  const body = await request.json();
  const {
    date, traded, pnl, amount, note, status,
    account_id, asset_name, lots, margin,
    entry_price, exit_price, direction,
    trade_reason, screenshot_url,
    entry_time, exit_time,
  } = body;

  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

  const payload = {
    date,
    traded,
    pnl:            traded ? (pnl            || null) : null,
    amount:         traded ? (amount         || 0)    : 0,
    note:           traded ? (note           || null) : null,
    status:         traded ? (status         || 'pending') : 'closed',
    account_id:     traded ? (account_id     || null) : null,
    asset_name:     traded ? (asset_name     || null) : null,
    lots:           traded ? (lots           ?? null) : null,
    margin:         traded ? (margin         ?? null) : null,
    entry_price:    traded ? (entry_price    ?? null) : null,
    exit_price:     traded ? (exit_price     ?? null) : null,
    direction:      traded ? (direction      || null) : null,
    trade_reason:   traded ? (trade_reason   || null) : null,
    screenshot_url: traded ? (screenshot_url || null) : null,
    entry_time:     traded ? (entry_time     || null) : null,
    exit_time:      traded ? (exit_time      || null) : null,
  };

  const { data, error } = await supabase
    .from('trades')
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/trades?id=123 — update a specific trade by id
export async function PATCH(request) {
  const err = guard(); if (err) return err;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const body = await request.json();
  // Remove id from body if present (not a column)
  const { id: _id, ...updateData } = body;

  const { data, error } = await supabase
    .from('trades')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/trades?id=123   — delete one trade by id
// DELETE /api/trades?date=... — delete ALL trades for a date (bulk, legacy)
export async function DELETE(request) {
  const err = guard(); if (err) return err;
  const { searchParams } = new URL(request.url);
  const id   = searchParams.get('id');
  const date = searchParams.get('date');

  if (!id && !date)
    return NextResponse.json({ error: 'id or date is required' }, { status: 400 });

  const { error } = id
    ? await supabase.from('trades').delete().eq('id', id)
    : await supabase.from('trades').delete().eq('date', date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}