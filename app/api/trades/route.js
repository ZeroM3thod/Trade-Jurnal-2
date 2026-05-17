import { supabase, SUPABASE_MISSING } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const guard = () =>
  !supabase
    ? NextResponse.json({ error: SUPABASE_MISSING }, { status: 503 })
    : null;

// GET /api/trades            — returns ALL trades (for stats)
// GET /api/trades?year=2025&month=5  — returns trades for that month
export async function GET(request) {
  const err = guard(); if (err) return err;
  const { searchParams } = new URL(request.url);
  const year  = searchParams.get('year');
  const month = searchParams.get('month');

  let query = supabase.from('trades').select('*').order('date');

  if (year && month) {
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

// POST /api/trades  — upsert (insert or update by date)
export async function POST(request) {
  const err = guard(); if (err) return err;

  const body = await request.json();
  const {
    date, traded, pnl, amount, note, status,
    account_id, asset_name, lots, margin,
    entry_price, exit_price, direction,
    trade_reason, screenshot_url,
  } = body;

  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

  const payload = {
    date,
    traded,
    pnl:            traded ? pnl            : null,
    amount:         traded ? amount         : 0,
    note:           traded ? note           : null,
    status:         traded ? (status || 'closed') : 'closed',
    account_id:     traded ? (account_id    || null) : null,
    asset_name:     traded ? (asset_name    || null) : null,
    lots:           traded ? (lots          ?? null) : null,
    margin:         traded ? (margin        ?? null) : null,
    entry_price:    traded ? (entry_price   ?? null) : null,
    exit_price:     traded ? (exit_price    ?? null) : null,
    direction:      traded ? (direction     || null) : null,
    trade_reason:   traded ? (trade_reason  || null) : null,
    screenshot_url: traded ? (screenshot_url || null) : null,
  };

  const { data, error } = await supabase
    .from('trades')
    .upsert(payload, { onConflict: 'date' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/trades?date=2025-05-12
export async function DELETE(request) {
  const err = guard(); if (err) return err;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

  const { error } = await supabase.from('trades').delete().eq('date', date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}