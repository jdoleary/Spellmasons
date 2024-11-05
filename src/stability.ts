
// To prevent servers from crashing, public community servers will have limits on the max number of units and pickups that
// can exist.
// To provide the best User Experience, if a unit is created beyond the max units limit:
// 1. Dead units will be removed to make space
// 2. If there are no dead units, units will be merged to make space
// If there are too many pickups:
// 1. Potions will be merged to make space

import { allUnits } from "./entity/units";
import * as Vec from "./jmath/Vec";
import { groupIntoClusters } from "./jmath/math";
import { getUniqueSeedString, seedrandom, shuffle } from "./jmath/rand";
import { UnitType } from "./types/commonTypes";
import * as Unit from './entity/Unit';
import * as Pickup from './entity/Pickup';
import Underworld from "./Underworld";
import { animateMerge, merge_id, mergePickups, mergeUnits } from "./cards/merge";
import floatingText from "./graphics/FloatingText";
import { raceTimeout } from "./Promise";
interface ServerStabilityInstructions {
    cleanupDead: number[],
    mergeUnits: [number, number][],
    mergePickups: [number, number][],

}

// 2. Worst Case Scenario, the pickup will not be created.
export function runServerStability(underworld: Underworld): ServerStabilityInstructions {
    const result: ServerStabilityInstructions = {
        cleanupDead: [],
        mergeUnits: [],
        mergePickups: []
    }
    const removeNumberOfItemPerCleanup = 20;
    if (underworld.serverStabilityMaxUnits && underworld.units.length > underworld.serverStabilityMaxUnits) {
        // const playerUnits = underworld.units.filter(u => u.unitType === UnitType.PLAYER_CONTROLLED);
        const seed = seedrandom(getUniqueSeedString(underworld));
        const deadNonPlayerUnits = shuffle(underworld.units.filter(u => !u.flaggedForRemoval && !u.alive && u.unitType !== UnitType.PLAYER_CONTROLLED), seed);
        // #1: Remove dead, non-player units to make space for new units
        if (deadNonPlayerUnits.length > removeNumberOfItemPerCleanup) {
            for (let i = 0; i < removeNumberOfItemPerCleanup; i++) {
                const u = deadNonPlayerUnits[i];
                if (u) {
                    result.cleanupDead.push(u.id);
                }
            }
        } else {
            // #2: Merge non-player units to make space for new units
            // --
            // Merge only units with matching sourceIds
            let mergeCount = 0;
            for (let sourceId of Object.keys(allUnits)) {
                const nonPlayerUnits = underworld.units.filter(u => u.unitSourceId == sourceId && !u.flaggedForRemoval && u.alive && u.unitType !== UnitType.PLAYER_CONTROLLED);
                const clusteredUnits = groupIntoClusters(nonPlayerUnits);
                for (let cluster of clusteredUnits) {
                    mergeCount++;
                    if (mergeCount > removeNumberOfItemPerCleanup) {
                        break;
                    }
                    result.mergeUnits.push([cluster[0].id, cluster[1].id]);
                }
            }
        }
    }
    if (underworld.serverStabilityMaxPickups && underworld.pickups.length > underworld.serverStabilityMaxPickups) {
        let mergeCount = 0;
        for (let pickupId of underworld.pickups.map(p => p.name)) {
            const potionPickups = underworld.pickups.filter(p => p.name === pickupId && !p.flaggedForRemoval && p.name.includes('Potion'));
            const clustered = groupIntoClusters(potionPickups);
            for (let cluster of clustered) {
                mergeCount++;
                if (mergeCount > removeNumberOfItemPerCleanup) {
                    break;
                }
                result.mergePickups.push([cluster[0].id, cluster[1].id]);
            }
        }

    }
    return result;
}
export async function runServerStabilityInstructions(underworld: Underworld, instructions: ServerStabilityInstructions) {
    const cleanUpUnits = underworld.units.filter(u => instructions.cleanupDead.includes(u.id));
    cleanUpUnits.forEach(u => {
        floatingText({
            coords: Vec.clone(u), text: `corpse decayed`,
        });
        Unit.cleanup(u);
    });
    const promises = [];
    for (let cluster of instructions.mergePickups.map((x) => {
        return [underworld.pickups.find(p => p.id == x[0]), underworld.pickups.find(p => p.id == x[1])];
    })) {
        const one = cluster[1];
        const zero = cluster[0];
        if (zero && one) {
            promises.push(animateMerge((one).image, zero).then(() => {
                mergePickups(zero, [one], underworld, false);
                floatingText({ coords: zero, text: merge_id })
            }));
        }
    }

    for (let cluster of instructions.mergeUnits.map((x) => {
        return [underworld.units.find(u => u.id == x[0]), underworld.units.find(u => u.id == x[1])];
    })) {
        const one = cluster[1];
        const zero = cluster[0];
        if (zero && one) {
            promises.push(animateMerge((one).image, zero).then(() => {
                mergeUnits(zero, [one], underworld, false);
                floatingText({ coords: zero, text: merge_id })
            }));
        }
    }
    await raceTimeout(5000, 'runServerStabilityPromises', Promise.all(promises));

    // Clean up invalid units
    const keepUnits: Unit.IUnit[] = [];
    for (let u of underworld.units) {
        if (!u.flaggedForRemoval) {
            keepUnits.push(u);
        }
    }
    underworld.units = keepUnits;

    // Clean up invalid pickups
    const keepPickups: Pickup.IPickup[] = [];
    for (let p of underworld.pickups) {
        if (!p.flaggedForRemoval) {
            keepPickups.push(p);
        }
    }
    underworld.pickups = keepPickups;
    console.log('jtest merge pickups done:', underworld.pickups.length);
}
