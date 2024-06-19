import { describe, it, expect } from "vitest";
import { calculateMaxParticles } from '../Particles';

describe('particles', () => {
    describe('calculateMaxParticles', () => {
        it('should never return a number lower than 2 for max particles', () => {
            const actual = calculateMaxParticles(100, 100_000_000).maxParticles;
            const expected = 2;
            expect(actual).toEqual(expected);
        });
        it('should never return a number greater than supplied default for max particles', () => {
            const def = 100;
            const actual = calculateMaxParticles(def, 1).maxParticles;
            const expected = def;
            expect(actual).toEqual(expected);
        });
        it('should reduce the max particles as the number of trails increases', () => {
            const def = 100;
            const actual = calculateMaxParticles(def, 40).maxParticles;
            const expected = 50;
            expect(actual).toEqual(expected);
        });
        it('should reduce the max particles as the number of trails increases; 2', () => {
            const def = 100;
            const actual = calculateMaxParticles(def, 60).maxParticles;
            const expected = 33;
            expect(actual).toEqual(expected);
        });
        it('should return the ratio of the returned max particles to the default max particles', () => {
            const def = 100;
            const actual = calculateMaxParticles(def, 40).ratioToDefault;
            const expected = 0.5;
            expect(actual).toEqual(expected);
        });

    });

});