import * as Unit from "../entity/Unit"
import playerUnit from "../entity/units/playerUnit";
import { Faction, UnitSubType, UnitType } from "../types/commonTypes";
import golem from '../entity/units/golem';
import { getSyncActions } from '../Syncronization';
import { registerUnit } from "../entity/units";

interface testSyncObject {
    id: number;
    type: string;
    value: number;
}
function findMatchIndex(current: testSyncObject, potentialMatches: testSyncObject[]): number {
    return potentialMatches.findIndex(x => x.id == current.id);
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
        const current = [
            makeTestSyncObject(0, 'player', 1),
            makeTestSyncObject(1, 'unit', 10),
        ];
        const from = [
            makeTestSyncObject(1, 'unit', 11),
        ];
        const actual = getSyncActions(current, from, findMatchIndex, ignoreSync);
        expect(actual).toEqual({
            sync: [[current[1], from[0]]],
            remove: [],
            syncToServer: [current[0]],
            create: []
        });
    });
});