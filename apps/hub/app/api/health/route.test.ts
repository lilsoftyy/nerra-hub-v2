import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('returns status ok with required fields', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: 'ok',
      version: '0.0.0',
      checks: {
        database: 'ok',
        storage: 'ok',
      },
    });
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('commit');
    expect(body).toHaveProperty('min_supported_sdk_version');
  });
});
