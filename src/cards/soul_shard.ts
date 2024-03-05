import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { distance } from '../jmath/math';

const soulShardId = 'Soul Shard';
const spell: Spell = {
  card: {
    id: soulShardId,
    category: CardCategory.Curses,
    sfx: 'debilitate',
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconSoulShard.png',
    animationPath: 'spell-effects/spellDebilitate',
    description: ['spell_soul_shard'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
        await playDefaultSpellAnimation(card, targets, prediction);
        for (let unit of targets) {
          Unit.addModifier(unit, soulShardId, underworld, prediction, quantity, { shardOwnerId: state.casterUnit.id });
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
  },
  events: {
    onDamage: (unit, amount, underworld, prediction) => {
      // Redirect all damage to the modifier's source unit
      const shardOwnerId = unit.modifiers[soulShardId]?.shardOwnerId;
      // != undefined because the ID could be 0
      if (shardOwnerId != undefined) {
        const shardOwner = unitById(shardOwnerId, underworld, prediction);
        if (shardOwner) {
          Unit.takeDamage(shardOwner, amount, undefined, underworld, prediction, undefined);
        }
      }
      return 0;
    },
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      // Find nearest unit with a matching Soul Shard
      const units = prediction ? underworld.unitsPrediction : underworld.units;
      const nearestShardBearer = units.filter(u =>
        u.modifiers[soulShardId] &&
        u.modifiers[soulShardId].shardOwnerId == unit.id)
        .sort((a, b) => distance(a, unit) - distance(b, unit))[0];

      // Resurrect in place of the nearestShardBearer
      if (nearestShardBearer) {
        //console.log("Resurrect unit at soul shard bearer: ", nearestShardBearer);

        // TODO - Await death?
        Unit.die(nearestShardBearer, underworld, prediction);
        Unit.setLocation(unit, nearestShardBearer);
        Unit.resurrect(unit, underworld);
      } else {
        console.log("Unit had soul shard death event, but no shard bearers were left: ", unit);
      }
    },
  },
};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1, extra?: any) {
  const modifier = getOrInitModifier(unit, soulShardId, { isCurse: true, quantity }, () => { });

  unit.onDamageEvents.push(soulShardId);

  // != undefined because the ID could be 0
  if (extra.shardOwnerId != undefined) {
    // If there was already a different SoulSource
    if (modifier.shardOwnerId && modifier.shardOwnerId != extra.shardOwnerId) {

      const oldShardOwner = unitById(modifier.shardOwnerId, _underworld, _prediction);
      // Remove the on death event
      removeSoulShardOnDeathEvent(oldShardOwner);
    }
    const soulSource = unitById(extra.shardOwnerId, _underworld, _prediction);
    soulSource?.onDeathEvents.push(soulShardId);
  }

  modifier.shardOwnerId = extra.shardOwnerId;
}

function remove(unit: Unit.IUnit, underworld: Underworld) {
  if (!unit.modifiers[soulShardId]) {
    console.error(`Missing modifier object for ${soulShardId}; cannot remove.  This should never happen`);
    return;
  }

  // Better to pass prediction boolean through remove function?
  const prediction = underworld.unitsPrediction.includes(unit);

  const shardOwnerId = unit.modifiers[soulShardId].shardOwnerId;
  const shardOwner = unitById(shardOwnerId, underworld, prediction);
  removeSoulShardOnDeathEvent(shardOwner);
}

function unitById(id: number, underworld: Underworld, prediction: boolean): Unit.IUnit | undefined {
  const units = prediction ? underworld.unitsPrediction : underworld.units;
  return units.find(u => u.id == id);
}

function removeSoulShardOnDeathEvent(unit: Unit.IUnit | undefined) {
  if (unit) {
    const index = unit.onDeathEvents.indexOf(soulShardId, 0);
    if (index > -1) {
      unit.onDeathEvents.splice(index, 1);
    }
  }
}

export default spell;