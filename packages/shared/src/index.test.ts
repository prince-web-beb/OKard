import { describe, expect, it } from 'vitest';
import { CARD_FAMILIES, CARD_SIDES, isCardSide, SCENE_SCHEMA_VERSION } from './index.js';

describe('OKard shared contracts', () => {
  it('exposes unique card family identifiers', () => {
    const ids = CARD_FAMILIES.map((family) => family.id);
    expect(ids.length).toBeGreaterThanOrEqual(18);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('supports two independent card sides', () => {
    expect(CARD_SIDES).toEqual(['front', 'back']);
    expect(isCardSide('front')).toBe(true);
    expect(isCardSide('back')).toBe(true);
    expect(isCardSide('government')).toBe(false);
  });
  it('uses versioned serialization', () => expect(SCENE_SCHEMA_VERSION).toBe(1));
});
