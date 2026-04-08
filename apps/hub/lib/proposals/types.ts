export interface ExecutionContext {
  proposal_id: string;
  proposal: {
    id: string;
    agent_name: string;
    action_type: string;
    payload: Record<string, unknown>;
    company_id: string | null;
  };
  user_id: string;
  request_id: string;
}

export interface ExecutionResult {
  ok: boolean;
  error?: string;
  details?: string;
  side_effects?: string[];
}

export class ExecutionError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ExecutionError';
  }
}
