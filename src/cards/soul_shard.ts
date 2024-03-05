import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

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
  },
  events: {
    onDamage: (unit, amount, underworld, prediction) => {
      //@ts-ignore Redirect all damage to the modifier's source unit
      const shardOwnerId = unit.modifiers[soulShardId].shardOwnerId;
      // != undefined because the ID could be 0
      if (shardOwnerId != undefined) {
        const shardOwner = unitById(shardOwnerId, underworld, prediction);
        if (shardOwner) {
          Unit.takeDamage(shardOwner, amount, undefined, underworld, prediction, undefined)
        }
      }
      return 0;
    },
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      // Resurrect in place of the nearest shard haver
      console.warn("Soul Source On Death");
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

      const oldSoulSource = unitById(modifier.shardOwnerId, _underworld, _prediction);
      // Remove the on death event
      if (oldSoulSource) {
        const index = oldSoulSource.onDeathEvents.indexOf(soulShardId, 0);
        if (index > -1) {
          oldSoulSource.onDeathEvents.splice(index, 1);
        }
      }
    }
    const soulSource = unitById(extra.shardOwnerId, _underworld, _prediction);
    soulSource?.onDeathEvents.push(soulShardId);
  }

  modifier.shardOwnerId = extra.shardOwnerId;
}

function unitById(id: number, underworld: Underworld, prediction: boolean): Unit.IUnit | undefined {
  const units = prediction ? underworld.unitsPrediction : underworld.units;
  return units.find(u => u.id == id);
}

export default spell;