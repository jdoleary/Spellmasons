
// To prevent servers from crashing, public community servers will have limits on the max number of units and pickups that
// can exist.
// To provide the best User Experience, if a unit is created beyond the max units limit:
// 1. Dead units will be removed to make space
// 2. If there are no dead units, units will be merged to make space
// If there are too many pickups:
// 1. Potions will be merged to make space

import * as Vec from "./jmath/Vec";
import { getUniqueSeedString, seedrandom, shuffle } from "./jmath/rand";
import { UnitType } from "./types/commonTypes";
import * as Unit from './entity/Unit';
import * as Pickup from './entity/Pickup';
import Underworld from "./Underworld";
import { animateMerge, merge_id, mergePickups, mergeUnits } from "./cards/merge";
import floatingText from "./graphics/FloatingText";
import { raceTimeout } from "./Promise";
import { distance } from "./jmath/math";
// once cleanup happens, it should clean up to a buffer beyond the limit so it doesn't have to clean up each time
const buffer = 10;
export async function mergeExcessPickups(underworld: Underworld) {
    const promises = [];
    if (underworld.serverStabilityMaxPickups && underworld.pickups.length > underworld.serverStabilityMaxPickups) {
        const numberOfItemsToCleanup = underworld.pickups.length - underworld.serverStabilityMaxPickups + buffer;
        console.log(`Server Stability: cleanup ${numberOfItemsToCleanup} pickups`);
        let mergeCount = 0;
        const seed = seedrandom(getUniqueSeedString(underworld));
        const potionPickups = shuffle([...underworld.pickups.filter(p => !p.flaggedForRemoval && p.name.includes('Potion'))], seed);
        // Make sure a pickup isn't used twice for merging
        const merging: Pickup.IPickup[] = [];
        for (let p of potionPickups) {
            if (merging.includes(p)) {
                continue;
            }
            const neighbor = potionPickups.find(p2 => p2 !== p && p.name == p2.name && distance(p, p2) < 200 && !merging.includes(p2));
            if (neighbor) {
                merging.push(neighbor, p);
                promises.push(animateMerge((neighbor).image, p).then(() => {
                    mergePickups(p, [neighbor], underworld, false);
                    floatingText({ coords: p, text: merge_id })
                }));
                mergeCount++;
            }
            if (mergeCount >= numberOfItemsToCleanup) {
                break;
            }
        }
        await raceTimeout(5000, 'runServerStability_mergePickups', Promise.all(promises));


        // Clean up flagged pickups
        const keepPickups: Pickup.IPickup[] = [];
        for (let p of underworld.pickups) {
            if (!p.flaggedForRemoval) {
                keepPickups.push(p);
            }
        }
        underworld.pickups = keepPickups;
    }
}
export async function mergeExcessUnits(underworld: Underworld) {
    const promises = [];
    if (underworld.serverStabilityMaxUnits && underworld.units.length > underworld.serverStabilityMaxUnits) {
        let numberOfItemsToCleanup = underworld.units.length - underworld.serverStabilityMaxUnits + buffer;
        console.log(`Server Stability: cleanup ${numberOfItemsToCleanup} units`);
        const seed = seedrandom(getUniqueSeedString(underworld));
        const deadNonPlayerUnits = shuffle(underworld.units.filter(u => !u.flaggedForRemoval && !u.alive && u.unitType !== UnitType.PLAYER_CONTROLLED), seed);
        // #1: Remove dead, non-player units to make space for new units
        const deadPlayersToCleanUp = Math.min(numberOfItemsToCleanup, deadNonPlayerUnits.length);
        for (let i = 0; i < deadPlayersToCleanUp; i++) {
            const u = deadNonPlayerUnits[i];
            if (u) {
                floatingText({
                    coords: Vec.clone(u), text: `corpse decayed`,
                });
                Unit.cleanup(u);
            }
        }
        // There may not be enough dead players to clean up, so if there is cleanup needed left over 
        // after removing dead players, update `numberOfItemsToCleanup` for upcoming merge of units
        numberOfItemsToCleanup -= deadPlayersToCleanUp;
        // #2: Merge non-player units to make space for new units
        // --
        // Merge only units with matching sourceIds
        if (numberOfItemsToCleanup > 0) {
            let mergeCount = 0;
            // Make sure a Unit isn't used twice for merging
            const merging: Unit.IUnit[] = [];
            const nonPlayerUnits = shuffle([...underworld.units.filter(u => !u.flaggedForRemoval && u.alive && u.unitType !== UnitType.PLAYER_CONTROLLED)], seed);
            for (let u of nonPlayerUnits) {
                if (merging.includes(u)) {
                    continue;
                }
                const neighbor = nonPlayerUnits.find(p2 => p2 !== u && u.unitSourceId === p2.unitSourceId && u.faction == p2.faction && distance(u, p2) < 200 && !merging.includes(p2));
                if (neighbor) {
                    merging.push(neighbor, u);
                    promises.push(animateMerge((neighbor).image, u).then(() => {
                        mergeUnits(u, [neighbor], underworld, false);
                        floatingText({ coords: u, text: merge_id })
                    }));
                    mergeCount++;
                }
                if (mergeCount >= numberOfItemsToCleanup) {
                    break;
                }
            }
            await raceTimeout(5000, 'runServerStability_mergeUnits', Promise.all(promises));
            // Clean up flagged units
            const keepUnits: Unit.IUnit[] = [];
            for (let u of underworld.units) {
                if (!u.flaggedForRemoval) {
                    keepUnits.push(u);
                }
            }
            underworld.units = keepUnits;
        }
    }
}