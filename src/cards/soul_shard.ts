import type * as PIXI from 'pixi.js';
import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { distance } from '../jmath/math';
import { makeManaTrail } from '../graphics/Particles';
import { Vec2, jitter, lerpVec2 } from '../jmath/Vec';
import { soulShardOwnerModifierId } from '../modifierSoulShardOwner';
import { HasSpace } from '../entity/Type';

export const soulShardId = 'Soul Shard';
const spell: Spell = {
  card: {
    id: soulShardId,
    category: CardCategory.Curses,
    sfx: 'sacrifice',
    supportQuantity: false,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconSoulShard.png',
    description: ['spell_soul_shard'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive && u.faction == state.casterUnit.faction && u != state.casterUnit);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
        unitTakeDamageFX(state.casterUnit, underworld, prediction);
        if (prediction) {
          // Prediction circles to show affected targets
          const graphics = globalThis.predictionGraphicsBlue;
          if (graphics) {
            for (let target of targets) {
              drawDiamond(target, graphics);
            }
          }
        } else {
          // VFX Trails
          let promises = [];
          for (let unit of targets) {
            promises.push(makeManaTrail(state.casterUnit, unit, underworld,
              colors.convertToHashColor(colors.healthDarkRed), colors.convertToHashColor(colors.healthBrightRed)));
          }
          await Promise.all(promises);
        }

        // Effect
        for (let unit of targets) {
          Unit.addModifier(unit, soulShardId, underworld, prediction, quantity, { shardOwnerId: state.casterUnit.id });
          unitTakeDamageFX(unit, underworld, prediction);
        }
      } else {
        refundLastSpell(state, prediction, "Target an ally unit!");
      }
      return state;
    },
  },
  modifiers: {
    stage: 'Soul Shard',
    add,
    remove,
  },
  events: {
    onTakeDamage: (unit, amount, underworld, prediction) => {
      // Redirect all damage to the modifier's source unit
      const modifier = unit.modifiers[soulShardId];
      if (modifier) {
        const shardOwner = underworld.getUnitById(modifier.shardOwnerId, prediction);
        if (shardOwner && shardOwner.alive) {

          // Do lightning effect
          if (!prediction) animateDamageRedirection(shardOwner, unit);
          Unit.takeDamage({
            unit: shardOwner,
            amount: amount,
          }, underworld, prediction);

          return 0;
        }
      }
      return amount;
    },
    onDrawSelected: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[soulShardId];
      if (modifier) {
        const shardOwner = underworld.getUnitById(modifier.shardOwnerId, prediction);
        if (shardOwner) {
          const graphics = globalThis.selectedUnitGraphics;
          if (graphics) {
            const lineColor = colors.healthDarkRed;
            graphics.lineStyle(3, lineColor, 0.7);
            graphics.moveTo(unit.x, unit.y);
            graphics.lineTo(shardOwner.x, shardOwner.y);
            graphics.drawCircle(shardOwner.x, shardOwner.y, 3);
          }
        }
      }
    }
  },
};

function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1, extra?: any) {
  if (unit.modifiers[soulShardOwnerModifierId]) {
    // Cannot soul shard a unit that already has soul shard owner
    return;
  }
  if (isNullOrUndef(extra.shardOwnerId)) {
    console.log("Cannot add soul shard modifier without a shard owner id");
    return;
  }

  const modifier = getOrInitModifier(unit, soulShardId, { isCurse: true, quantity }, () => {
    Unit.addEvent(unit, soulShardId);
  });

  if (modifier.shardOwnerId != extra.shardOwnerId) {
    // If we're changing to a new shard owner, remove the modifier from the old one
    if (exists(modifier.shardOwnerId)) {
      removeShardOwner(modifier.shardOwnerId, underworld, prediction);
    }

    const newShardOwner = underworld.getUnitById(extra.shardOwnerId, prediction);
    if (newShardOwner) {
      Unit.addModifier(newShardOwner, soulShardOwnerModifierId, underworld, prediction);
    }
  }

  modifier.shardOwnerId = extra.shardOwnerId;
  modifier.quantity = 1;
}
function remove(unit: Unit.IUnit, underworld: Underworld) {
  const soulShardModifier = unit.modifiers[soulShardId];
  if (soulShardModifier) {
    removeShardOwner(soulShardModifier.shardOwnerId, underworld, !!unit.isPrediction);
  }
}

function removeShardOwner(shardOwnerId: number, underworld: Underworld, prediction: boolean) {
  const shardOwner = underworld.getUnitById(shardOwnerId, prediction);
  if (shardOwner) {
    const shardOwnerModifier = shardOwner.modifiers[soulShardOwnerModifierId];
    if (shardOwnerModifier) {
      shardOwnerModifier.quantity -= 1;
    } else {
      console.error("Shard owner does not have the shard owner modifier. This should never happen\n", shardOwner);
    }
  } else {
    console.error("Shard owner with ID does not exist. This should never happen\n", shardOwnerId);
  }
}

export function getAllShardBearers(unit: Unit.IUnit, underworld: Underworld, prediction: boolean): Unit.IUnit[] {
  // Find nearest unit with a matching Soul Shard
  const units = prediction ? underworld.unitsPrediction : underworld.units;

  return units.filter(u =>
    u.alive &&
    u.modifiers[soulShardId] &&
    u.modifiers[soulShardId].shardOwnerId == unit.id)
    .sort((a, b) => distance(a, unit) - distance(b, unit));
}

function unitTakeDamageFX(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  if (prediction) return;

  playSFXKey(unit.sfx.damage);
  Unit.playAnimation(unit, unit.animations.hit, { loop: false, animationSpeed: 0.2 });
}

function drawDiamond(target: Unit.IUnit, graphics: PIXI.Graphics) {
  const lineColor = colors.healthDarkRed;
  const fillColor = colors.manaBlue;
  const diamondSize = 3.5;

  const points: Vec2[] =
    [{ x: target.x, y: target.y + diamondSize * 3 },
    { x: target.x - diamondSize * 2, y: target.y },
    { x: target.x, y: target.y - diamondSize * 3 },
    { x: target.x + diamondSize * 2, y: target.y }]

  //Draw Border
  graphics.lineStyle(diamondSize + 1, colors.trueBlack, 1);
  graphics.drawPolygon(points as PIXI.Point[]);

  //Draw Fill
  graphics.lineStyle(diamondSize, lineColor, 1);
  graphics.beginFill(fillColor).drawPolygon(points as PIXI.Point[]).endFill();
}

// Copied and modified from bolt.ts
async function animateDamageRedirection(shardOwner: HasSpace, shardBearer: HasSpace) {
  // Animations do not occur on headless
  if (!globalThis.headless) {
    return new Promise<void>((resolve) => {
      doDraw(resolve, shardOwner, shardBearer, Date.now() + 400);
    });
  }
}
function doDraw(resolve: (value: void | PromiseLike<void>) => void, shardOwner: HasSpace, shardBearer: HasSpace, endTime: number) {
  const didDraw = drawLineBetweenTargest(shardOwner, shardBearer);
  if (didDraw) {
    // Show the electricity for a moment
    if (Date.now() > endTime) {
      resolve();
    } else {
      requestAnimationFrame(() => doDraw(resolve, shardOwner, shardBearer, endTime))
    }
  } else {
    resolve();
  }
}
// Returns true if it did draw
function drawLineBetweenTargest(shardOwner: HasSpace, shardBearer: HasSpace): boolean {
  // Animations do not occur on headless
  if (!globalThis.headless) {
    const graphics = globalThis.projectileGraphics;
    if (graphics) {
      if (isNullOrUndef(shardOwner) || isNullOrUndef(shardBearer)) {
        return false;
      }
      graphics.lineStyle(1, colors.healthDarkRed, 0.8);
      graphics.moveTo(shardBearer.x, shardBearer.y);
      for (let i = 0; i < 5; i++) {
        const intermediaryPoint = jitter(lerpVec2(shardOwner, shardBearer, 0.2 * i), 12);
        graphics.lineTo(intermediaryPoint.x, intermediaryPoint.y);
      }
      graphics.lineTo(shardBearer.x, shardBearer.y);
      return true;
    }
  }
  return false;
}

export default spell;