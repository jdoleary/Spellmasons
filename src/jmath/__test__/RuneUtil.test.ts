import { incrementPresentedRunesIndex, presentRunes } from '../RuneUtil';
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
            const actual = presentRunes(allRunes, numOfRunesNeeded, 4, [{ key: '3', index: 3 }, { key: '1', index: 1 }]);
            expect(actual).toEqual(['4', '1', '5', '3', '0']);
        });
    });
});
describe('showNextSetOfRunes', () => {
    it('should increment to next set of X runes', () => {
        const X = 3;
        // const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
        const startIndex = 0;
        const actual = incrementPresentedRunesIndex(startIndex, X, [], []);
        expect(actual).toEqual(startIndex + X);
    });
    it('should increment to next set of X runes; 2', () => {
        const X = 3;
        // const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
        const startIndex = 11;
        const actual = incrementPresentedRunesIndex(startIndex, X, [], []);
        expect(actual).toEqual(startIndex + X);
    });
    it('should not increment for every locked rune that would NOT be natrually presented', () => {
        const X = 3;
        const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
        const startIndex = 0;
        // was 4,0,1
        const actual = incrementPresentedRunesIndex(startIndex, X, allRunes, [{ key: '4', index: 0 }]);
        // now 4,2,3
        expect(actual).toEqual(2);
    });
    it('should not increment for every locked rune that would NOT be natrually presented; with 2 locked runes', () => {
        const X = 4;
        const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
        const startIndex = 1;
        // was 5,1,3,2
        const actual = incrementPresentedRunesIndex(startIndex, X, allRunes, [{ key: '5', index: 0 }, { key: '2', index: 3 }]);
        // now 5,4,0,2
        expect(actual).toEqual(4);
    });
    it('should increment for every locked rune that would be natrually presented', () => {
        const X = 3;
        const allRunes = [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' }];
        const startIndex = 0;
        // was 0,1,2
        const actual = incrementPresentedRunesIndex(startIndex, X, allRunes, [{ key: '0', index: 0 }]);
        // now 0,3,4
        expect(actual).toEqual(3);
    });

});
describe('integration', () => {
    it('locked runes should not cause runes in allRunes to be skipped', () => {
        const allRunes = [
            { key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' },
            { key: '6' }, { key: '7' }, { key: '8' }, { key: '9' }, { key: '10' }, { key: '11' }
        ];
        let lockedRunes: { index: number, key: string, runePresentedIndexWhenLocked?: number }[] = [];
        const showRuneCount = 6;
        let startIndex = 0;
        const step1 = presentRunes(allRunes, showRuneCount, startIndex, lockedRunes);
        expect(step1).toEqual(allRunes.slice(0, 6).map(x => x.key));
        lockedRunes = [
            { index: 1, key: '1' },
        ];
        startIndex = incrementPresentedRunesIndex(startIndex, showRuneCount, allRunes, lockedRunes);
        expect(startIndex).toEqual(6);
        const step2 = presentRunes(allRunes, showRuneCount, startIndex, lockedRunes);
        expect(step2).toEqual([
            "6", "1", "7", "8", "9", "10"
        ]);

    })

});

