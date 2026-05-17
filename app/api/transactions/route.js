import { supabase, SUPABASE_MISSING } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const guard = () =>
  !supabase
    ? NextResponse.json({ error: SUPABASE_MISSING }, { status: 503 })
    : null;

// GET /api/transactions   — returns ALL transactions
export async function GET() {
  const err = guard(); if (err) return err;

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date')
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/transactions  — create a deposit or withdrawal
export async function POST(request) {
  const err = guard(); if (err) return err;

  const body = await request.json();
  const { date, type, amount, time, note } = body;

  if (!date || !type || !amount) {
    return NextResponse.json(
      { error: 'date, type, and amount are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({ date, type, amount, time: time || null, note: note || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/transactions?id=42
export async function DELETE(request) {
  const err = guard(); if (err) return err;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}