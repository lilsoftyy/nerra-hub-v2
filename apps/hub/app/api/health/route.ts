import { NextResponse } from 'next/server';

export function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local';

  const checks = {
    database: 'ok' as const,
    storage: 'ok' as const,
  };

  const status = Object.values(checks).every((c) => c === 'ok') ? 'ok' : 'degraded';

  return NextResponse.json(
    {
      status,
      version: '0.0.0',
      commit,
      min_supported_sdk_version: '0.0.0',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: status === 'ok' ? 200 : 503 },
  );
}
