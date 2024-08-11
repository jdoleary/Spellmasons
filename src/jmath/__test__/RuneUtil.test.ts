import { presentRunes } from '../RuneUtil';
describe('presentRunes', () => {
    it('should return numOfRunesNeeded', () => {
        const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
        const numOfRunesNeeded = 3;
        const actual = presentRunes(allRunes, numOfRunesNeeded, 0, []);
        expect(actual).toEqual(['0', '1', '2']);
    });
    it('should return numOfRunesNeeded starting at start index', () => {
        const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
        const numOfRunesNeeded = 3;
        const actual = presentRunes(allRunes, numOfRunesNeeded, 1, []);
        expect(actual).toEqual(['1', '2', '3']);
    });
    it('should loop once it reaches the end', () => {
        const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
        const numOfRunesNeeded = 3;
        const actual = presentRunes(allRunes, numOfRunesNeeded, 4, []);
        expect(actual).toEqual(['4', '5', '0']);
    });
    describe('locked runes', () => {
        it('should return locked runes in the index they were locked in', () => {
            const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
            const numOfRunesNeeded = 3;
            const actual = presentRunes(allRunes, numOfRunesNeeded, 0, [{ key: '1', index: 1 }]);
            expect(actual).toEqual(['0', '1', '2']);
        });
        it('should return locked runes in the index they were locked in; B', () => {
            const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
            const numOfRunesNeeded = 3;
            const actual = presentRunes(allRunes, numOfRunesNeeded, 1, [{ key: '1', index: 1 }]);
            expect(actual).toEqual(['2', '1', '3']);
        });
        it('should return locked runes in the index they were locked in; when looping', () => {
            const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
            const numOfRunesNeeded = 3;
            const actual = presentRunes(allRunes, numOfRunesNeeded, 4, [{ key: '1', index: 1 }]);
            expect(actual).toEqual(['4', '1', '5']);
        });
        it('should return locked runes in the index they were locked in; when looping and with multiple runes locked', () => {
            const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
            const numOfRunesNeeded = 5;
            const actual = presentRunes(allRunes, numOfRunesNeeded, 4, [{ key: '1', index: 1 }, { key: '3', index: 3 }]);
            expect(actual).toEqual(['4', '1', '5', '3', '0']);
        });


    });
});