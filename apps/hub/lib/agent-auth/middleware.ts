import { NextRequest, NextResponse } from 'next/server';

interface AgentAuthResult {
  agentName: string;
  scopes: string[];
}

export function authenticateAgent(request: NextRequest): AgentAuthResult | NextResponse {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'missing_token', message: 'Bearer token required' },
      { status: 401 },
    );
  }

  // Placeholder: extract agent name from a simple token format
  // Real JWT validation will replace this in a later iteration
  const token = authHeader.slice(7);

  if (!token) {
    return NextResponse.json(
      { error: 'missing_token', message: 'Bearer token required' },
      { status: 401 },
    );
  }

  // For now, accept any non-empty token and use a default agent name
  // In production, this decodes the JWT and extracts sub, scopes, etc.
  return {
    agentName: 'placeholder_agent',
    scopes: ['proposals:write', 'tasks:write', 'companies:read', 'activity:write'],
  };
}

export function requireScope(auth: AgentAuthResult, scope: string): NextResponse | null {
  if (!auth.scopes.includes(scope)) {
    return NextResponse.json(
      { error: 'insufficient_scope', message: `Scope '${scope}' required` },
      { status: 403 },
    );
  }
  return null;
}
