import { describe, it, expect } from "vitest";
import { getSyncActions } from '../Syncronization';

interface testSyncObject {
    id: number;
    type: string;
    value: number;
}
function findMatch(current: testSyncObject, potentialMatches: testSyncObject[]): testSyncObject | undefined {
    return potentialMatches.find(x => x.id == current.id);
}
function sync(current: testSyncObject, from: testSyncObject) {
    current.type = from.type;
    current.value = from.value;
}
function ignoreSync(current: testSyncObject): boolean {
    return current.type == 'player';
}
function makeTestSyncObject(id: number, type: string, value: number): testSyncObject {
    return {
        id,
        type,
        value
    }
}

describe('Syncronization', () => {
    it('should NOT remove any existing player units', () => {
        const player = makeTestSyncObject(0, 'player', 1);
        const unitCurrent = makeTestSyncObject(1, 'unit', 10);
        const current = [
            unitCurrent,
            player,
        ];
        const from = [
            makeTestSyncObject(unitCurrent.id, 'unit', 11),
        ];
        const actual = getSyncActions(current, from, findMatch, ignoreSync);
        expect(actual.remove).toEqual([]);
    });
    it('should sync the state of identity matched units', () => {
        const player = makeTestSyncObject(0, 'player', 1);
        const unitCurrent = makeTestSyncObject(1, 'unit', 10);
        const current = [
            unitCurrent,
            player,
        ];
        const from = [
            makeTestSyncObject(unitCurrent.id, 'unit', 11),
        ];
        const actual = getSyncActions(current, from, findMatch, ignoreSync);
        expect(actual.sync).toEqual([[unitCurrent, from[0]]]);
    });
    it('should remove current units not in the serialized array', () => {
        const player = makeTestSyncObject(0, 'player', 1);
        const unitCurrent = makeTestSyncObject(1, 'unit', 10);
        const fromUnit = makeTestSyncObject(2, 'unit', 11);
        const current = [
            unitCurrent,
            player,
        ];
        const from = [
            player,
            fromUnit,
        ];
        const actual = getSyncActions(current, from, findMatch, ignoreSync);
        expect(actual.remove).toEqual([unitCurrent]);
    });
    it('should create missing units', () => {
        const player = makeTestSyncObject(0, 'player', 1);
        const unitCurrent = makeTestSyncObject(1, 'unit', 10);
        const fromUnit = makeTestSyncObject(2, 'unit', 11);
        const current = [
            unitCurrent,
            player,
        ];
        const from = [
            player,
            fromUnit,
        ];
        const actual = getSyncActions(current, from, findMatch, ignoreSync);
        expect(actual.create).toEqual([fromUnit]);
    });
});