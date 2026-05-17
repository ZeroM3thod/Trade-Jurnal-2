import { NextResponse } from 'next/server';

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const GITHUB_OWNER  = process.env.GITHUB_OWNER;
const GITHUB_REPO   = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

export async function POST(request) {
  try {
    // ── Validate GitHub env vars ──────────────────────────────────────────────
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return NextResponse.json(
        { error: 'GitHub env vars not configured. Add GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO.' },
        { status: 503 }
      );
    }

    // ── Read uploaded file ────────────────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // ── Build a unique filename ───────────────────────────────────────────────
    const ext      = (file.name || 'jpg').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || 'jpg'}`;
    const repoPath = `public/trade/${safeName}`;   // path inside the repo
    const publicUrl = `/trade/${safeName}`;         // URL served by Next.js

    // ── Push to GitHub via Contents API ──────────────────────────────────────
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}`;

    const ghRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept:        'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: `upload trade screenshot: ${safeName}`,
        content: base64,
        branch:  GITHUB_BRANCH,
      }),
    });

    if (!ghRes.ok) {
      const err = await ghRes.json().catch(() => ({}));
      console.error('[upload] GitHub API error:', err);
      return NextResponse.json(
        { error: err.message || `GitHub API returned ${ghRes.status}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: publicUrl });

  } catch (e) {
    console.error('[upload]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}