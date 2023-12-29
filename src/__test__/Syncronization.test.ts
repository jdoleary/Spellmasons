import * as Unit from "../entity/Unit"
import playerUnit from "../entity/units/playerUnit";
import { Faction, UnitSubType, UnitType } from "../types/commonTypes";
import golem from '../entity/units/golem';
import { syncUnits } from '../Syncronization';
import { registerUnit } from "../entity/units";
function makePlayerUnit(): Unit.IUnit {
    return Unit.create(
        playerUnit.id,
        // x,y of NaN denotes that the player unit is
        // inPortal.  See the function inPortal for more
        NaN,
        NaN,
        Faction.ALLY,
        playerUnit.info.image,
        UnitType.PLAYER_CONTROLLED,
        playerUnit.info.subtype,
        undefined,
        // @ts-ignore no underworld in tests
        undefined
    );
}
function makeGolem(): Unit.IUnit {
    const sourceUnit = golem;
    return Unit.create(
        sourceUnit.id,
        0,
        0,
        Faction.ENEMY,
        sourceUnit.info.image,
        UnitType.AI,
        sourceUnit.info.subtype,
        sourceUnit.unitProps,
        // @ts-ignore no underworld in tests
        undefined
    );

}
registerUnit(playerUnit);
registerUnit(golem);
describe('Syncronization', () => {
    it('should NOT remove any existing player units', () => {
        const playerUnit1 = makePlayerUnit();
        const golem = makeGolem();
        const golem2 = makeGolem();
        golem2.id = 3;
        const actual = syncUnits([playerUnit1, golem], [Unit.serialize(golem2)]);
        expect(actual).toEqual([playerUnit1, golem2]);


    });
});