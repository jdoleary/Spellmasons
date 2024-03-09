import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { oneOffImage, playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { Spell, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { distance } from '../jmath/math';
import { makeManaTrail } from '../graphics/Particles';
import { containerUnits, startBloodParticleSplatter } from '../graphics/PixiUtils';

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
      const targets = state.targetedUnits.filter(u => u.alive && u.faction == state.casterUnit.faction);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
        await playDefaultSpellAnimation(card, targets, prediction);
        for (let unit of targets) {
          Unit.addModifier(unit, soulShardId, underworld, prediction, quantity, { shardOwnerId: state.casterUnit.id });
        }
      } else {
        refundLastSpell(state, prediction, "Must target an ally");
      }
      return state;
    },
  },
  modifiers: {
    add,
  },
  events: {
    onDamage: (unit, amount, underworld, prediction) => {
      // Redirect all damage to the modifier's source unit
      const modifier = unit.modifiers[soulShardId];
      // != undefined because the ID could be 0
      if (modifier && modifier.shardOwnerId != undefined) {
        const shardOwner = unitById(modifier.shardOwnerId, underworld, prediction);
        if (shardOwner) {
          // Prevents an infinite loop in the case of multiple
          // shard owners redirecting to eachother
          if (!modifier.hasRedirectedDamage) {
            modifier.hasRedirectedDamage = true;
            Unit.takeDamage(shardOwner, amount, undefined, underworld, prediction, undefined);
            modifier.hasRedirectedDamage = false;
            return 0;
          } else {
            //console.log("Breaking infinite Soul Shard loop: ", modifier.hasRedirectedDamage);
          }
        }
        modifier.hasRedirectedDamage = false;
      }
      return amount;
    },
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      // Find nearest unit with a matching Soul Shard
      const units = prediction ? underworld.unitsPrediction : underworld.units;
      const nearestShardBearer = units.filter(u =>
        u.alive &&
        u.modifiers[soulShardId] &&
        u.modifiers[soulShardId].shardOwnerId == unit.id)
        .sort((a, b) => distance(a, unit) - distance(b, unit))[0];

      // Resurrect in place of the nearestShardBearer
      if (nearestShardBearer) {
        //console.log("Resurrect unit at soul shard bearer: ", nearestShardBearer);
        // Prevent game over screen from coming up while the soul is travelling
        unit.alive = true;

        if (!prediction) {
          // Trail VFX
          // await new Promise<void>(resolve => oneOffImage(unit, 'units/summonerMagic', containerUnits, resolve))
          // await makeManaTrail(unit, nearestShardBearer, underworld, '#774772', '#5b3357')
          // await new Promise<void>(resolve => oneOffImage(nearestShardBearer, 'units/summonerMagic', containerUnits, resolve));
          startBloodParticleSplatter(underworld, unit, nearestShardBearer, { maxRotationOffset: Math.PI * 2, numberOfParticles: 300 });
        }

        Unit.die(nearestShardBearer, underworld, prediction);
        Unit.cleanup(nearestShardBearer, true);
        Unit.setLocation(unit, nearestShardBearer);
        Unit.resurrect(unit, underworld);
        unit.health = 1;
      } else {
        console.log("Unit had soul shard death event, but no shard bearers were left: ", unit);
      }
    },
  },
};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1, extra?: any) {
  const modifier = getOrInitModifier(unit, soulShardId, { isCurse: true, quantity }, () => {
    unit.onDamageEvents.push(soulShardId);

    // != undefined because the ID could be 0
    if (extra.shardOwnerId != undefined) {
      const soulSource = unitById(extra.shardOwnerId, _underworld, _prediction);
      if (soulSource) {
        if (!soulSource.onDeathEvents.includes(soulShardId)) {
          soulSource?.onDeathEvents.push(soulShardId);
        }
      }
    }
  });

  modifier.shardOwnerId = extra.shardOwnerId;
}

function unitById(id: number, underworld: Underworld, prediction: boolean): Unit.IUnit | undefined {
  const units = prediction ? underworld.unitsPrediction : underworld.units;
  return units.find(u => u.id == id);
}

export default spell;