import seedrandom from "seedrandom";
import { shuffle, _chooseObjectWithProbability } from "../rand";

describe('probability', () => {
    const objects = [
        // Won't be selected because roll will never be 0 see chooseObjectWithProbability randome.integer(1...
        {
            id: 1,
            probability: 0
        },
        // Selected if roll is 1
        {
            id: 2,
            probability: 1
        },
        // Selected if roll is 2-6
        {
            id: 3,
            probability: 5
        },
        // Wont be selected
        {
            id: 4,
            probability: 0
        },
        // Selected if roll is 7-8
        {

            id: 5,
            probability: 2
        },
    ]
    describe('should never choose an object with probability of 0', () => {
        it("should choose id 2 for roll of 1", () => {
            const choice = _chooseObjectWithProbability(1, objects);
            expect(choice?.id).toEqual(2);
        });
        it("should choose id 3 for roll of 2-6", () => {
            let choice = _chooseObjectWithProbability(2, objects);
            expect(choice?.id).toEqual(3);
            choice = _chooseObjectWithProbability(3, objects);
            expect(choice?.id).toEqual(3);
            choice = _chooseObjectWithProbability(4, objects);
            expect(choice?.id).toEqual(3);
            choice = _chooseObjectWithProbability(5, objects);
            expect(choice?.id).toEqual(3);
            choice = _chooseObjectWithProbability(6, objects);
            expect(choice?.id).toEqual(3);
        });
        it("should choose id 5 for roll of 7-8 because it skips id 4 with a probability of 0", () => {
            let choice = _chooseObjectWithProbability(7, objects);
            expect(choice?.id).toEqual(5);
            choice = _chooseObjectWithProbability(8, objects);
            expect(choice?.id).toEqual(5);
        });
    });

});
describe('shuffle', () => {
    it('should return an empty array when input is empty', () => {
        const input: number[] = [];
        const result = shuffle(input, seedrandom('seedstring'));
        expect(result).toEqual([]);
    });

    it('should return the same array when input has only one element', () => {
        const input = [42];
        const result = shuffle(input, seedrandom('seedstring'));
        expect(result).toEqual([42]);
    });

    it('should return a shuffled array with the same elements', () => {
        const input = [0, 1, 2, 3, 4];
        // Shallow clone so it doesn't mutate
        const result = shuffle([...input], seedrandom('a seed2'));
        expect(result).toContain(0);
        expect(result).toContain(1);
        expect(result).toContain(2);
        expect(result).toContain(3);
        expect(result).toContain(4);
        expect(result).not.toEqual(input); // Usually not equal due to shuffling
    });

    it('should handle an array of strings', () => {
        const input = ['a', 'b', 'c', 'd'];
        const result = shuffle([...input], seedrandom('seedstring'));
        expect(result).toContain('a');
        expect(result).toContain('b');
        expect(result).toContain('c');
        expect(result).toContain('d');
        expect(result).not.toEqual(input);
    });

    it('should handle an array of objects', () => {
        const input = [{ id: 1 }, { id: 2 }, { id: 3 }];
        // Clone so 
        const result = shuffle([...input], seedrandom('seedstring'));
        expect(result).toHaveLength(input.length);
        expect(result).toEqual(expect.arrayContaining(input));
        expect(result).not.toEqual(input);
    });

    it('should handle a large array efficiently', () => {
        const input = Array.from({ length: 1000 }, (_, i) => i);
        const result = shuffle([...input], seedrandom('seedstring'));
        expect(result).toHaveLength(input.length);
        expect(result).toEqual(expect.arrayContaining(input));
        expect(result).not.toEqual(input);
    });

    it('should produce the same output given the same seed and input', () => {
        const input = [1, 2, 3, 4, 5];
        const firstShuffle = shuffle([...input], seedrandom('same-seed'));
        const secondShuffle = shuffle([...input], seedrandom('same-seed'));
        expect(firstShuffle).toEqual(secondShuffle);
    });

    it('should produce different outputs with different seeds', () => {
        const input = [1, 2, 3, 4, 5];
        const firstShuffle = shuffle([...input], seedrandom('seed-one'));
        const secondShuffle = shuffle([...input], seedrandom('seed-two'));
        expect(firstShuffle).not.toEqual(secondShuffle);
    });

});