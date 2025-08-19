import seedrandom from "seedrandom";
import { bountyId } from "../modifierBounty";
import { registerEvents } from "../cards";
import * as Unit from '../entity/Unit';
import floatingText from "../graphics/FloatingText";
import Underworld from '../Underworld';
import { getUniqueSeedString, chooseObjectWithProbability } from "../jmath/rand";
import { bountyPotionId } from "../modifierBountyPotion";
import * as Pickup from '../entity/Pickup';


export const alwaysBounty = 'Always Bounty';
export default function registerAlwaysBounty() {
    registerEvents(alwaysBounty, {
        onDeath: async (killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean, sourceUnit?: Unit.IUnit): Promise<void> => {
            // Only drop a potion if the killed unit has a bounty
            if (killedUnit.modifiers[bountyId]) {
                const random = seedrandom(`${getUniqueSeedString(underworld)}-${killedUnit.id}`);
                const coords = underworld.DEPRECIATED_findValidSpawnInRadius(killedUnit, prediction, { allowLiquid: killedUnit.inLiquid });
                if (coords) {
                    const pickupChoice = chooseObjectWithProbability(Pickup.pickups.map((p, index) => {
                        return { index, probability: p.name.includes('Potion') ? p.probability : 0 }
                    }), random);

                    if (pickupChoice && pickupChoice.index) {
                        const pickup = underworld.spawnPickup(pickupChoice.index, coords, prediction);
                        if (pickup) {
                            if (!prediction) {
                                playSFXKey('spawnPotion');
                                floatingText({ coords, text: bountyPotionId });
                            }
                        }
                    } else {
                        console.warn(`Could not choose valid pickup for ${bountyPotionId}`);
                    }
                } else {
                    console.log("Bount: Potion could not find valid spawn");
                }
            }
        }
    });
}