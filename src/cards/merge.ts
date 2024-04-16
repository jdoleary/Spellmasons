import { addUnitTarget, allModifiers, EffectState, getCurrentTargets, refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as colors from '../graphics/ui/colors';
import { CardCategory, Faction, UnitType } from '../types/commonTypes';
import floatingText from '../graphics/FloatingText';
import { IImageAnimated } from '../graphics/Image';
import { raceTimeout } from '../Promise';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { findSimilar } from './target_similar';
import { hasSpace, HasSpace } from '../entity/Type';
import Underworld from '../Underworld';
import { makeManaTrail } from '../graphics/Particles';
import { spellmasonUnitId } from '../entity/units/playerUnit';
import { findRandomGroundLocation } from '../entity/units/summoner';
import { findRandomDisplaceLocation } from './displace';
import { allUnits } from '../entity/units';
import { skyBeam } from '../VisualEffects';
import { changeStatWithCap } from './split';
import { jitter } from '../jmath/Vec';
import { isOutOfBounds } from '../graphics/PlanningView';

const merge_id = 'merge';
const spell: Spell = {
  card: {
    id: merge_id,
    category: CardCategory.Soul,
    manaCost: 60,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 1,
    supportQuantity: false,
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
            mergeUnits(target, similarUnits, underworld, prediction, state);
          } else if (Pickup.isPickup(target)) {
            const similarPickups = similarThings as Pickup.IPickup[];
            mergePickups(target, similarPickups, underworld, prediction);
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

export function mergeUnits(target: Unit.IUnit, unitsToMerge: Unit.IUnit[], underworld: Underworld, prediction: boolean, state?: EffectState) {
  let storedModifiers = [];
  for (const unit of unitsToMerge) {
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

    // Combine Stats
    if (target.unitType == UnitType.PLAYER_CONTROLLED) {
      // Players don't gain any permanent stat boosts
      target.health += unit.health;
      target.stamina += unit.stamina;
      target.mana += unit.mana;
    } else {
      target.healthMax += unit.healthMax;
      target.health += unit.health;
      //target.staminaMax += unit.staminaMax
      //target.stamina += unit.stamina;
      target.manaMax += unit.manaMax;
      target.mana += unit.mana;

      target.damage += unit.damage;
      target.manaCostToCast += unit.manaCostToCast;
      target.manaPerTurn += unit.manaPerTurn;
    }

    // Store Modifiers
    for (const modifierKey of Object.keys(unit.modifiers)) {
      const modifier = allModifiers[modifierKey];
      const modifierInstance = unit.modifiers[modifierKey];
      storedModifiers.push({ modifier, modifierInstance });
    }

    // Kill/Delete the unit that got merged
    if (unit.unitType == UnitType.PLAYER_CONTROLLED) {
      // Players die instead of being deleted
      Unit.die(unit, underworld, prediction);
    } else {
      // Give XP
      // This gives xp immediately when something gets merged, but ideally:
      // - Would be stored in an OnDeathEvent on the primary target instead of being immediate
      // - Would run the rest of the reportEnemyKilled() logic, for stat tracking and whatever else
      if (unit.originalLife) {
        underworld.enemiesKilled++;
      }

      if (state) {
        state.targetedUnits = state.targetedUnits.filter(u => u != unit);
      }

      Unit.cleanup(unit);
    }
  }

  // Modifiers are stored and added at the end to prevent weird scenarios
  // such as suffocate killing the primary target mid-merge
  for (const { modifier, modifierInstance } of storedModifiers) {
    if (modifier && modifierInstance) {
      if (modifier?.add) {
        modifier.add(target, underworld, prediction, modifierInstance.quantity, modifierInstance);
      }
    } else {
      console.error("Modifier doesn't exist? This shouldn't happen.");
    }
  }
}

export function mergePickups(target: Pickup.IPickup, pickupsToMerge: Pickup.IPickup[], underworld: Underworld, prediction: boolean, state?: EffectState) {
  for (const pickup of pickupsToMerge) {
    Pickup.setPower(target, target.power + pickup.power);

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

    if (state) {
      state.targetedPickups = state.targetedPickups.filter(p => p != pickup);
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
