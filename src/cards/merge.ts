import { allModifiers, EffectState, getCurrentTargets, refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as colors from '../graphics/ui/colors';
import { CardCategory, UnitType } from '../types/commonTypes';
import { IImageAnimated, setScaleFromModifiers } from '../graphics/Image';
import { raceTimeout } from '../Promise';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { findSimilar } from './target_similar';
import { HasSpace } from '../entity/Type';
import Underworld from '../Underworld';
import { clone, lerpVec2, Vec2 } from '../jmath/Vec';

const merge_id = 'merge';
const spell: Spell = {
  card: {
    id: merge_id,
    category: CardCategory.Soul,
    manaCost: 40,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 2,
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
        const mergePromises = []
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
              mergePromises.push(animateMerge((thing as any).image, target));
            }
          }
          await raceTimeout(1000, 'merge animage', Promise.all(mergePromises));

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

    if (target.unitType == UnitType.PLAYER_CONTROLLED) {
      // Players only gain current stats, for balance purposes
      target.health += unit.health;
      target.mana += unit.mana;
      // Allows player to grow in size
      target.strength += unit.strength;
    } else {
      // Combine Stats
      target.healthMax += unit.healthMax;
      target.health += unit.health;
      target.manaMax += unit.manaMax;
      target.mana += unit.mana;

      target.damage += unit.damage;
      target.manaCostToCast += unit.manaCostToCast;
      target.manaPerTurn += unit.manaPerTurn;
      target.strength += unit.strength;
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

  setScaleFromModifiers(target.image, target.strength);
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

export async function animateMerge(image: IImageAnimated | undefined, target: Vec2) {
  if (!image) {
    return;
  }
  const iterations = 160;
  const millisBetweenIterations = 3;
  const startPos = clone(image.sprite);
  // "iterations + 10" gives it a little extra time so it doesn't timeout right when the animation would finish on time
  return raceTimeout(millisBetweenIterations * (iterations + 10), 'animateMerge', new Promise<void>(resolve => {
    for (let i = 0; i < iterations; i++) {
      setTimeout(() => {
        if (image) {
          const t = i / iterations;
          // Just move the sprite for this animation since the merged unit will
          // get cleaned up anyway and we don't want any collisions on the way to merging
          const lerped = lerpVec2(startPos, target, t * t);
          image.sprite.x = lerped.x;
          image.sprite.y = lerped.y;

          if (i >= iterations - 1) {
            resolve();
          }

        }
      }, millisBetweenIterations * i)
    }
  }));
}
export default spell;
