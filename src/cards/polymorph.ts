import { CardCategory, UnitType } from '../types/commonTypes';
import { oneOffImage, playDefaultSpellSFX } from './cardUtils';
import { EffectState, Spell, addTarget, allModifiers, getCurrentTargets, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as Image from '../graphics/Image';
import { UnitSource, allUnits } from '../entity/units';
import { isModActive } from '../registerMod';
import Underworld from '../Underworld';
import { IPickup, isPickup, pickups } from '../entity/Pickup';
import floatingText from '../graphics/FloatingText';
import seedrandom from 'seedrandom';
import { chooseObjectWithProbability, chooseOneOfSeeded, getUniqueSeedString } from '../jmath/rand';
import { containerProjectiles } from '../graphics/PixiUtils';
import * as config from '../config';

export const polymorphId = 'Polymorph';
const spell: Spell = {
  card: {
    id: polymorphId,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconPolymorph.png',
    sfx: 'purify',
    description: ['spell_polymorph'],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = getCurrentTargets(state);
      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No valid targets. Cost refunded.');
        return state;
      }

      // Play FX
      playDefaultSpellSFX(card, prediction);
      if (!prediction) {
        const promises = [];
        for (const target of targets) {
          promises.push(new Promise<void>(resolve => {
            const animatingSpell = oneOffImage(target, 'spellPurify', containerProjectiles, resolve);
            if (animatingSpell) {
              animatingSpell.sprite.tint = 0x643B9F;
            }
          }));
        }
        await Promise.all(promises);
      }


      // We have to get targets again here, to prevent polymorphing old units
      for (const target of getCurrentTargets(state)) {
        if (Unit.isUnit(target)) {
          // Replace current unit with new unit
          polymorphUnit(target, underworld, prediction, undefined, state, quantity);
        } else if (isPickup(target)) {
          // Replace current pickup with new pickup
          polymorphPickup(target, underworld, prediction, undefined, state, quantity);
        }
      };

      return state;
    },
  },
};

function polymorphUnit(fromUnit: Unit.IUnit, underworld: Underworld, prediction: boolean, toUnitId?: string, state?: EffectState, quantity: number = 1): Unit.IUnit | undefined {
  // If a specific ID isn't passed in, choose a random one
  if (!toUnitId) {
    let possibleUnitTypes = getPossibleUnitPolymorphs(fromUnit.unitSourceId, underworld);

    // We have to seed this to prevent multiplayer desync
    let seed = undefined;
    if (fromUnit.unitType == UnitType.PLAYER_CONTROLLED) {
      // @ts-ignore polymorphCount - Special case for player seeding
      seed = seedrandom(`${getUniqueSeedString(underworld)} - ${fromUnit.id} - ${fromUnit.polymorphCount || 0}`);
    } else {
      seed = seedrandom(`${getUniqueSeedString(underworld)} - ${fromUnit.id}`);
    }
    const lastUnitChosen = allUnits[fromUnit.unitSourceId];
    for (let i = 0; i < quantity; i++) {
      toUnitId = chooseObjectWithProbability(possibleUnitTypes.map(p => {
        return { unitSource: p, probability: getPolymorphProbabilityFromBudget(lastUnitChosen?.spawnParams?.budgetCost, p.spawnParams?.budgetCost) }
      }), seed)?.unitSource.id;
    }

    if (isNullOrUndef(toUnitId)) {
      console.error("Polymorph failed to choose a new unit type.");
      return undefined;
    }
  }
  const toSourceUnit = allUnits[toUnitId];
  if (!toSourceUnit) {
    console.error('Unit with id', toUnitId, 'does not exist. Have you registered it in src/units/index.ts?');
    return undefined;
  }

  // Cases for polymorphing AI / Player
  if (fromUnit.unitType != UnitType.PLAYER_CONTROLLED) {
    // Copy quantity scaling from summon generic:
    const unitSummonQuantity = fromUnit.isMiniboss ? fromUnit.strength / config.MINIBOSS_STRENGTH_MULTIPLIER : fromUnit.strength;

    let unit: Unit.IUnit = Unit.create(
      toSourceUnit.id,
      fromUnit.x,
      fromUnit.y,
      fromUnit.faction,
      toSourceUnit.info.image,
      UnitType.AI,
      toSourceUnit.info.subtype,
      {
        ...toSourceUnit.unitProps,
        isMiniboss: fromUnit.isMiniboss,
        originalLife: fromUnit.originalLife,
        healthMax: (toSourceUnit.unitProps.healthMax || config.UNIT_BASE_HEALTH) * unitSummonQuantity,
        health: (toSourceUnit.unitProps.health || config.UNIT_BASE_HEALTH) * unitSummonQuantity,
        damage: (toSourceUnit.unitProps.damage || 0) * unitSummonQuantity,
        strength: unitSummonQuantity,
      },
      underworld,
      prediction,
      state?.casterUnit
    );

    if (exists(unit)) {
      // Persist death state: We shouldn't use Unit.die here because we dont want to 
      // play sfx, invoke death events, log enemy killed, or use much other die() logic
      if (!fromUnit.alive) {
        unit.health = 0;
        unit.mana = 0;
        unit.alive = false;
        // Polymorphing a dead unit shouldn't change soul fragments
        unit.soulFragments = fromUnit.soulFragments;
        if (unit.image) {
          Unit.changeToDieSprite(unit);
        }

        // In case a unit is created with a modifier that would be removed on death
        for (let [modifier, modifierProperties] of Object.entries(unit.modifiers)) {
          if (!modifierProperties.keepOnDeath) {
            Unit.removeModifier(unit, modifier, underworld);
          }
        }
      } else {
        // A unit at half health should remain at half health after polymorphing
        const healthRatio = fromUnit.health / fromUnit.healthMax;
        unit.health = Math.max(1, unit.healthMax * healthRatio);
      }

      // Keep Modifiers from fromUnit
      for (const modifierKey of Object.keys(fromUnit.modifiers)) {
        const modifier = allModifiers[modifierKey];
        const modifierInstance = fromUnit.modifiers[modifierKey];
        if (modifier && modifierInstance) {
          if (modifier.add) {
            modifier.add(unit, underworld, prediction, modifierInstance.quantity, modifierInstance);
          }
        } else {
          console.error("Modifier doesn't exist? This shouldn't happen.");
        }
      }

      // Cleanup old unit
      Unit.cleanup(fromUnit, false);
      if (state) {
        // Targets: Remove old, add new
        state.targetedUnits = state.targetedUnits.filter(u => u != fromUnit);
        addTarget(unit, state, underworld, prediction);
      }
    }
    return unit;
  } else {
    // Polymorph count changes the seed used for future polymorphing,
    // ensuring the player visual can change to multiple units
    // @ts-ignore polymorphCount
    if (fromUnit.polymorphCount) {
      // @ts-ignore polymorphCount
      fromUnit.polymorphCount++;
    } else {
      // @ts-ignore polymorphCount
      fromUnit.polymorphCount = 1;
    }
    visualPolymorphPlayerUnit(fromUnit, toSourceUnit)

    return fromUnit;
  }
}
export function visualPolymorphPlayerUnit(targetUnit: Unit.IUnit, toSourceUnit: UnitSource) {
  // Only change vfx/sfx for player since when npc units polymorph they ACTUALLY change which unit they are
  if (targetUnit.unitType == UnitType.PLAYER_CONTROLLED) {
    if (targetUnit.animations == toSourceUnit.animations) {
      // short circuit, already the correct sprite
      return;
    }
    targetUnit.defaultImagePath = toSourceUnit.unitProps.defaultImagePath || toSourceUnit.animations.idle || targetUnit.defaultImagePath;
    targetUnit.animations = toSourceUnit.animations || targetUnit.animations;
    targetUnit.sfx = toSourceUnit.sfx || targetUnit.sfx;
    targetUnit.bloodColor = toSourceUnit.unitProps.bloodColor || targetUnit.bloodColor;

    Image.changeSprite(
      targetUnit.image,
      targetUnit.animations.idle,
      targetUnit.image?.sprite.parent,
      undefined,
    );
  }
}

export function getPossibleUnitPolymorphs(unitSourceId: string, underworld?: Underworld): UnitSource[] {
  if (unitSourceId.toLowerCase() == 'altar' || unitSourceId.toLowerCase() == 'pillar') {
    return Object.values(allUnits).filter(u => u.id != unitSourceId && ['altar', 'pillar'].includes(u.id.toLowerCase()));
  }
  // Start with all units except self
  let possibleUnitTypes = Object.values(allUnits).filter(u => u.id != unitSourceId);

  // Remove modded units that aren't enabled
  if (underworld) {
    possibleUnitTypes.filter(u => isModActive(u, underworld));
  }

  if (Unit.isBoss(unitSourceId)) {
    // Filter to all boss units
    possibleUnitTypes = possibleUnitTypes
      .filter(u => Unit.isBoss(u.id));
  } else {
    // Filter to all units with budget and spawn chance
    possibleUnitTypes = possibleUnitTypes
      .filter(u => u.spawnParams && u.spawnParams.probability > 0 && u.spawnParams.budgetCost);
  }

  return possibleUnitTypes;
}

export function getPolymorphProbabilityFromBudget(budget1: number = 1, budget2: number = 1): number {
  // Clamp budget to positive number, and dont divide by 0
  budget1 = Math.max(budget1, 1);
  budget2 = Math.max(budget2, 1);

  // Units are weighted by their % difference in budget.
  let budgetDiff = budget1 / budget2;
  budgetDiff = (budgetDiff >= 1) ? budgetDiff : 1 / budgetDiff;

  // Exponent controls how steep the curve is. Higher = more predictable outcome.
  // 0 = all outcomes equally likely
  // 1 = Default - Units with twice the budget are half as likely as units with the same budget
  // 2 = likely outcomes much more likely, unlikely outcomes much more unlikely
  const exponent = 1.5;
  budgetDiff = Math.pow(budgetDiff, exponent);
  return Math.ceil(1000 / budgetDiff);
}

function polymorphPickup(fromPickup: IPickup, underworld: Underworld, prediction: boolean, toPickupSource?: Pickup.IPickupSource, state?: EffectState, quantity: number = 1): IPickup | undefined {
  // If a specific ID isn't passed in, choose a random one
  if (!toPickupSource) {
    // Don't polymorph purple portals
    if (fromPickup.name == Pickup.PORTAL_PURPLE_NAME || fromPickup.name == Pickup.RECALL_POINT) return undefined;

    let possiblePickupTypes = pickups.filter(p => isModActive(p, underworld) && p.name != fromPickup.name
      && p.name != Pickup.PORTAL_PURPLE_NAME && p.name != Pickup.RECALL_POINT);

    // We have to seed this to prevent multiplayer desync
    const seed = seedrandom(`${getUniqueSeedString(underworld)} - ${fromPickup.id}`);
    for (let i = 0; i < quantity; i++) {
      toPickupSource = chooseOneOfSeeded(possiblePickupTypes, seed);
    }

    if (isNullOrUndef(toPickupSource)) {
      console.error("Polymorph failed to choose a new pickup type.");
      return undefined;
    }
  }

  const pickup = Pickup.create({ pos: fromPickup, pickupSource: toPickupSource, logSource: 'spawnPickup' }, underworld, prediction);
  if (exists(pickup)) {
    Pickup.setPower(pickup, fromPickup.power);
    if (!prediction) {
      playSFXKey('spawnPotion');
      floatingText({ coords: fromPickup, text: toPickupSource.name });
    }
    // Cleanup old pickup and remove it from targets
    Pickup.removePickup(fromPickup, underworld, prediction);
    if (state) {
      // Targets: Remove old, add new
      state.targetedPickups = state.targetedPickups.filter(p => p != fromPickup);
      addTarget(pickup, state, underworld, prediction);
    }
  }
  return pickup;
}

export default spell;