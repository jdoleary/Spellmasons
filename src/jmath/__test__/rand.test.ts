import { _chooseObjectWithProbability } from "../rand";

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