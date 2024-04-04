import { allModifiers, getCurrentTargets, refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as colors from '../graphics/ui/colors';
import { CardCategory, UnitType } from '../types/commonTypes';
import floatingText from '../graphics/FloatingText';
import { IImageAnimated } from '../graphics/Image';
import { raceTimeout } from '../Promise';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { findSimilar } from './target_similar';
import { hasSpace, HasSpace } from '../entity/Type';
import Underworld from '../Underworld';
import { makeManaTrail } from '../graphics/Particles';

const merge_id = 'merge';
const spell: Spell = {
  card: {
    id: merge_id,
    category: CardCategory.Soul,
    manaCost: 60,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 1,
    thumbnail: 'spellIconMerge.png',
    description: 'spell_merge',
    effect: async (state, card, quantity, underworld, prediction) => {
      // Batch find targets that should be merged
      // Note: They need to be batched because the list will be changed as units are merged
      const targets = getCurrentTargets(state);
      let mergedTargets: HasSpace[] = [];

      // We have to loop by target instead of unit type here,
      // because there is other criteria to consider:
      // we don't want to merge living units into dead ones, for example
      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        if (!target || mergedTargets.includes(target)) continue;

        // if target has not been merged already
        // find similar and merge those into target
        const potentialTargets = targets.filter(t => !mergedTargets.includes(t));
        const similarThings = findSimilar(target, underworld, prediction, potentialTargets);

        if (similarThings.length) {
          if (!prediction) {
            playSFXKey('clone');
            for (const thing of similarThings) {
              makeManaTrail(thing, target, underworld,
                colors.convertToHashColor(colors.manaBrightBlue),
                colors.convertToHashColor(colors.manaDarkBlue),
                1);
            }
            await animateMerge((target as any).image);
          }

          mergedTargets = mergedTargets.concat(similarThings);
          if (Unit.isUnit(target)) {
            const similarUnits = similarThings as Unit.IUnit[];
            mergeUnit(target, similarUnits, underworld, prediction);
          } else if (Pickup.isPickup(target)) {
            const similarPickups = similarThings as Pickup.IPickup[];
            mergePickup(target, similarPickups, underworld, prediction);
            mergedTargets.concat(similarPickups);
          }
        }
      }

      if (!mergedTargets.length) {
        refundLastSpell(state, prediction, 'Target things of the same type!')
      }
      return state;
    },
  },
};

export function mergeUnit(target: Unit.IUnit, unitsToMerge: Unit.IUnit[], underworld: Underworld, prediction: boolean) {
  // TODO - I forsee a bug that causes modifier addition to change game state before merge is complete
  // I.E. Target gets a few stacks of suffocate and dies, bloat triggers, bunch of stuff changes.
  // Loop keeps going and reaches some undefined value, or tries to add modifiers to dead target, etc.
  for (const unit of unitsToMerge) {
    // Never merge a player controlled unit
    if (unit.unitType == UnitType.PLAYER_CONTROLLED) continue;

    // HP / Stam / Mana
    target.healthMax += unit.healthMax;
    target.health += unit.health;
    //target.staminaMax += unit.staminaMax
    //target.stamina += unit.stamina;
    target.manaMax += unit.manaMax;
    target.mana += unit.mana;
    // Damage / Other
    target.damage += unit.damage;
    target.manaCostToCast += unit.manaCostToCast;
    target.manaPerTurn += unit.manaPerTurn;

    // Modifiers
    for (const modifierKey of Object.keys(unit.modifiers)) {
      const modifier = allModifiers[modifierKey];
      const modifierInstance = unit.modifiers[modifierKey];
      if (modifier && modifierInstance) {
        if (modifier?.add) {
          modifier.add(target, underworld, prediction, modifierInstance.quantity, modifierInstance);
        }
      } else {
        console.error("Modifier doesn't exist? This shouldn't happen.");
      }
    }

    // Give XP
    // Should be done via an OnDeathEvent that merge adds to the target
    // which calls reportEnemyKilled() once per merged unit
    if (unit.originalLife) {
      underworld.enemiesKilled++;
    }

    // Prediction Lines
    if (prediction) {
      const graphics = globalThis.predictionGraphics;
      if (graphics) {
        const lineColor = colors.manaBlue;
        graphics.lineStyle(3, lineColor, 0.7);
        graphics.moveTo(unit.x, unit.y);
        graphics.lineTo(target.x, target.y);
        graphics.drawCircle(target.x, target.y, 3);
      }
    }

    Unit.cleanup(unit);
  }
}


export function mergePickup(target: Pickup.IPickup, pickupsToMerge: Pickup.IPickup[], underworld: Underworld, prediction: boolean) {
  console.log("TODO - Merge Pickups");
  for (const pickup of pickupsToMerge) {
    // TODO - Pickup Merging
    // Will require pickup rewrite

    // Combine pickup effects / strength?

    // Prediction Lines
    if (prediction) {
      const graphics = globalThis.predictionGraphics;
      if (graphics) {
        const lineColor = colors.manaBlue;
        graphics.lineStyle(3, lineColor, 0.7);
        graphics.moveTo(pickup.x, pickup.y);
        graphics.lineTo(target.x, target.y);
        graphics.drawCircle(target.x, target.y, 3);
      }
    }

    Pickup.removePickup(pickup, underworld, prediction);
  }
}

// TODO - Merge VFX - Trails/Lines to main unit + Similar mitosis stretch
// export async function animateMerge(image?: IImageAnimated) {
//   if (!image) {
//     return;
//   }
//   return;
// }

export async function animateMerge(image?: IImageAnimated) {
  if (!image) {
    return;
  }
  const iterations = 100;
  const millisBetweenIterations = 3;
  const startScaleX = image.sprite.scale.x || 1.0;
  const startScaleY = image.sprite.scale.y || 1.0;
  // "iterations + 10" gives it a little extra time so it doesn't timeout right when the animation would finish on time
  return raceTimeout(millisBetweenIterations * (iterations + 10), 'animatedMitosis', new Promise<void>(resolve => {
    for (let i = 0; i < iterations; i++) {
      setTimeout(() => {
        // Stretch
        if (image) {
          image.sprite.scale.x *= 1.01;
          image.sprite.scale.y -= 0.001;
          if (i >= iterations - 1) {
            resolve();
          }

        }
      }, millisBetweenIterations * i)
    }
  })).then(() => {
    // Restore scale
    image.sprite.scale.x = startScaleX;
    image.sprite.scale.y = startScaleY;
  });
}
export default spell;
