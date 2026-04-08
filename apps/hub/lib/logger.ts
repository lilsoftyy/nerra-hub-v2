type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const REDACTED_FIELDS = new Set([
  'email',
  'phone',
  'token',
  'secret',
  'password',
  'seed',
  'hmac',
  'api_key',
  'refresh_token',
  'access_token',
  'authorization',
  'from_address',
  'to_addresses',
  'body_markdown',
  'credit_card',
  'bank_account',
  'org_number',
]);

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_FIELDS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redact(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function log(level: LogLevel, action: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    action,
    ...(data ? redact(data) : {}),
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const safeLogger = {
  debug: (action: string, data?: Record<string, unknown>) => log('debug', action, data),
  info: (action: string, data?: Record<string, unknown>) => log('info', action, data),
  warn: (action: string, data?: Record<string, unknown>) => log('warn', action, data),
  error: (action: string, data?: Record<string, unknown>) => log('error', action, data),
};
