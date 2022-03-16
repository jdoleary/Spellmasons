import { removeBetweenIndexAtoB } from '../Pathfinding';
describe('Pathfinding', () => {
    describe('removeBetweenIndexAtoB', () => {
        it('should remove all the indices between A and B', () => {
            const array = [0, 1, 2, 3, 4, 5]
            const actual = removeBetweenIndexAtoB(array, 1, 3);
            const expected = [0, 1, 3, 4, 5];
            expect(actual).toEqual(expected);
        });
        it('should remove all the indices between A and B; 2', () => {
            const array = [0, 1, 2, 3, 4, 5]
            const actual = removeBetweenIndexAtoB(array, 1, 4);
            const expected = [0, 1, 4, 5];
            expect(actual).toEqual(expected);
        });
        it('should remove all the indices between A and B; 3', () => {
            const array = [0, 1, 2, 3, 4, 5]
            const actual = removeBetweenIndexAtoB(array, 1, array.length);
            const expected = [0, 1];
            expect(actual).toEqual(expected);
        });
        it('should not remove any values if indexB is only one greater than indexA', () => {
            const array = [0, 1, 2, 3, 4, 5]
            const actual = removeBetweenIndexAtoB(array, 1, 2);
            const expected = array;
            expect(actual).toEqual(expected);
        });
        describe('corner cases', () => {
            it('should return the array unaltered if B is < A', () => {
                const array = [0, 1, 2, 3, 4, 5]
                const actual = removeBetweenIndexAtoB(array, 3, 1);
                const expected = array;
                expect(actual).toEqual(expected);
            });
            it('should return the array unaltered if B == A', () => {
                const array = [0, 1, 2, 3, 4, 5]
                const actual = removeBetweenIndexAtoB(array, 3, 3);
                const expected = array;
                expect(actual).toEqual(expected);
            });
        });
    });
});