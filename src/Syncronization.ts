import * as Unit from "./entity/Unit"
import { UnitType } from "./types/commonTypes";

// syncUnits should:
// NOT remove any existing player's units (even if there are discrepancies)
// Sync the state of player units
// Sync the state of identical non player units
// Remove units not in the serialized units array (so long as they are not player units)
// Create missing units from the serialized array (careful not to overwrite ids of existing units)
interface UnitSubType {
    id: number;
    unitSourceId: string;
    unitType: UnitType;
}
export function syncUnits(current: Unit.IUnit[], syncFrom: Unit.IUnitSerialized[]): Unit.IUnit[] {
    // TODO maybe use a subtype so it's testable without constructing a whole underworld
    return [];

}