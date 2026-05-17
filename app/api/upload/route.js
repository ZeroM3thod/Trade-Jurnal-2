import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'trade');
    await mkdir(uploadDir, { recursive: true });

    const ext      = (file.name || 'jpg').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || 'jpg'}`;
    await writeFile(path.join(uploadDir, safeName), buffer);

    return NextResponse.json({ url: `/trade/${safeName}` });
  } catch (e) {
    console.error('[upload]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const config = { api: { bodyParser: false } };