import { addTarget, EffectState, ICard, Spell } from './index';
import { drawUICirclePrediction } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { makeNova } from '../graphics/ParticleCollection';
import { cleanup, IUnit, takeDamage } from '../entity/Unit';
import Underworld from '../Underworld';
import { IPickup } from '../entity/Pickup';
import { animateTargetCircle } from './target_circle';
import { raceTimeout } from '../Promise';
import { Vec2 } from '../jmath/Vec';
import { easeOutCubic } from '../jmath/Easing';
import * as config from '../config';
import { makeManaTrail } from '../graphics/Particles';


const baseNovaRadius = 100;

function getAdjustedRadius(radiusBoost: number = 0) {
  // +50% radius per radius boost
  return baseNovaRadius * (1 + (0.5 * radiusBoost));
}

const DAMAGE_NOVA_DAMAGE = 20;
const CORPSE_NOVA_STAMINA_PER_CORPSE = 20;
export const CORPSE_NOVA_STAMINA_ID = 'Corpse Nova: Stamina';
const novas: Spell[] = [
  {
    card: {
      id: 'Pain Nova',
      category: CardCategory.Damage,
      supportQuantity: true,
      manaCost: 15,
      healthCost: 0,
      expenseScaling: 1,
      sfx: 'nova',
      probability: probabilityMap[CardRarity.RARE],
      thumbnail: 'spellIconNovaPain.png',
      description: ['spell_nova_pain', DAMAGE_NOVA_DAMAGE.toString()],
      allowNonUnitTarget: true,
      effect: async (state, card, quantity, underworld, prediction) => {
        const colorStart = 0x000;
        const colorEnd = 0xFF0000;

        const radiusBoost = state.aggregator.radiusBoost;
        const radius = getAdjustedRadius(radiusBoost);
        const location = state.casterUnit;
        if (prediction) {
          drawUICirclePrediction(location, radius, colorEnd, 'Nova Radius');
        } else {
          playDefaultSpellSFX(card, prediction);
          makeNova(location, radius / baseNovaRadius, colorStart, colorEnd, prediction);
        }

        // if (n.pickup_effect) {
        //   const pickups = underworld.getPickupsWithinDistanceOfTarget(location, radius, prediction);
        //   pickups.forEach(p => {
        //     if (n.pickup_effect)
        //       n.pickup_effect(p, state, card, quantity, underworld, prediction);
        //   });
        // }
        const units = underworld.getUnitsWithinDistanceOfTarget(location, radius, prediction);
        units.forEach(u => {
          // Exclude self
          if (u == state.casterUnit) {
            return;
          }
          // Deal damage to units
          takeDamage({
            unit: u,
            amount: DAMAGE_NOVA_DAMAGE * quantity,
            sourceUnit: state.casterUnit,
            fromVec2: state.casterUnit,
          }, underworld, prediction);
        });
        // Wait for the nova to complete
        if (!prediction)
          await new Promise((res) => setTimeout(res, 1000));

        return state;
      },
    },
    modifiers: {},
    events: {}
  },
  {
    card: {
      id: 'Target Nova',
      category: CardCategory.Targeting,
      supportQuantity: true,
      manaCost: 15,
      healthCost: 0,
      expenseScaling: 1,
      sfx: 'nova',
      probability: probabilityMap[CardRarity.UNCOMMON],
      thumbnail: 'spellIconNovaTarget.png',
      description: ['spell_nova_target'],
      allowNonUnitTarget: true,
      effect: async (state, card, quantity, underworld, prediction) => {
        const colorStart = 0x000;
        const colorEnd = 0x00FF00;

        const radiusBoost = state.aggregator.radiusBoost;
        const radius = getAdjustedRadius(radiusBoost);
        const location = state.casterUnit;
        if (prediction) {
          drawUICirclePrediction(location, radius, colorEnd, 'Nova Radius');
        } else {
          playDefaultSpellSFX(card, prediction);
          // makeNova(location, radius / baseNovaRadius, colorStart, colorEnd, prediction);
        }

        const pickups = underworld.getPickupsWithinDistanceOfTarget(location, radius, prediction);
        pickups.forEach(p => {
          addTarget(p, state, underworld, prediction);
        });
        const units = underworld.getUnitsWithinDistanceOfTarget(location, radius, prediction);
        units.forEach(u => {
          // Exclude self
          if (u == state.casterUnit) {
            return;
          }
          addTarget(u, state, underworld, prediction);
        });
        await animateTargetCircle([{ pos: location, radius }], underworld, prediction, [state.casterUnit]);
        return state;
      },
    },
    modifiers: {},
    events: {}
  },
  {
    card: {
      id: CORPSE_NOVA_STAMINA_ID,
      category: CardCategory.Soul,
      supportQuantity: false,
      manaCost: 30,
      healthCost: 0,
      soulFragmentCostOverride: 1,
      expenseScaling: 1,
      sfx: 'nova',
      probability: probabilityMap[CardRarity.UNCOMMON],
      thumbnail: 'spellIconNovaCorpse.png',
      description: ['spell_nova_corpse_stamina', CORPSE_NOVA_STAMINA_PER_CORPSE.toString()],
      allowNonUnitTarget: true,
      effect: async (state, card, quantity, underworld, prediction) => {
        const colorStart = 0x153939;
        const colorEnd = 0x00aeae;

        const radiusBoost = state.aggregator.radiusBoost;
        const radius = getAdjustedRadius(radiusBoost);
        const location = state.casterUnit;
        if (prediction) {
          drawUICirclePrediction(location, radius, colorEnd, 'Nova Radius');
        } else {
          playDefaultSpellSFX(card, prediction);
          makeNova(location, radius / baseNovaRadius, colorStart, colorEnd, prediction);
        }


        const units = underworld.getUnitsWithinDistanceOfTarget(location, radius, prediction);
        const promises: Promise<void>[] = [];
        const corpsesInRange = units.filter(u => !u.alive);
        corpsesInRange.forEach(u => {
          // Exclude self
          if (u == state.casterUnit) {
            return;
          }
          state.casterUnit.stamina += CORPSE_NOVA_STAMINA_PER_CORPSE;
          if (!prediction)
            promises.push(makeManaTrail(u, state.casterUnit, underworld, `#d5b356`, `#d5b356`, corpsesInRange.length));
          cleanup(u, true);
        });
        // Wait for the nova to complete
        if (!prediction)
          await raceTimeout(2000, 'corpse nova', Promise.all(promises));

        return state;
      },
    },
    modifiers: {},
    events: {}
  },
];
export default novas;
