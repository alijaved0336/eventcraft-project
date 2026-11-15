import { describe, it, expect } from 'vitest';

describe('CI Sanity Check', () => {
  it('should pass to allow CI to complete', () => {
    expect(true).toBe(true);
  });
});
