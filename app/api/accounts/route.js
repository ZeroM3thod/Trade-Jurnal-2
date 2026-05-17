import { supabase, SUPABASE_MISSING } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const guard = () =>
  !supabase ? NextResponse.json({ error: SUPABASE_MISSING }, { status: 503 }) : null;

// GET /api/accounts
export async function GET() {
  const err = guard(); if (err) return err;
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/accounts
export async function POST(request) {
  const err = guard(); if (err) return err;
  const body = await request.json();
  const { name, broker, type, currency, initial_balance, note } = body;
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      name,
      broker:          broker          || null,
      type:            type            || 'forex',
      currency:        currency        || 'USD',
      initial_balance: initial_balance || 0,
      note:            note            || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/accounts?id=1  (partial update)
export async function PATCH(request) {
  const err = guard(); if (err) return err;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('accounts')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/accounts?id=1
export async function DELETE(request) {
  const err = guard(); if (err) return err;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}