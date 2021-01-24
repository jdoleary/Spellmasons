import { describe, it, expect } from '@jest/globals';
import { normalizeDegrees } from '../Image';

describe('Units', () => {
  describe('normalizeDegrees', () => {
    it('should normalize 360 to 0', () => {
      const actual = normalizeDegrees(360);
      const expected = 0;
      expect(actual).toEqual(expected);
    });
    it('should normalize 370 to 10', () => {
      const actual = normalizeDegrees(370);
      const expected = 10;
      expect(actual).toEqual(expected);
    });
    it('should normalize -10 to 350', () => {
      const actual = normalizeDegrees(-10);
      const expected = 350;
      expect(actual).toEqual(expected);
    });
    it('should leave numbers between 0 inclusive and 360 exclusive as they are', () => {
      const actual = normalizeDegrees(170);
      const expected = 170;
      expect(actual).toEqual(expected);
    });
  });
});
