import { addTarget, EffectState, ICard, Spell } from './index';
import { drawUICirclePrediction } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { makeNova } from '../graphics/ParticleCollection';
import { IUnit, takeDamage } from '../entity/Unit';
import Underworld from '../Underworld';
import { IPickup } from '../entity/Pickup';
import { animate } from './target_circle';
import { raceTimeout } from '../Promise';
import { Vec2 } from '../jmath/Vec';
import { easeOutCubic } from '../jmath/Easing';
import * as config from '../config';

const id = 'Nova';

const baseNovaRadius = 100;
interface Nova {
  colorStart: number;
  colorEnd: number;
  card: Partial<ICard>;
  effect: (targetUnit: IUnit, state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean) => Promise<void>;
  pickup_effect?: (pickup: IPickup, state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean) => void;
}
const novas: Nova[] = [
  {
    colorStart: 0x000000,
    colorEnd: 0xFF0000,
    card: {
      id: 'Pain Nova',
      category: CardCategory.Damage,
      supportQuantity: true,
      manaCost: 30,
      healthCost: 0,
      expenseScaling: 1,
      sfx: 'nova',
      probability: probabilityMap[CardRarity.UNCOMMON],
      thumbnail: 'spellIconNovaPain.png',
      description: ['spell_nova'],
      allowNonUnitTarget: true,
    },
    effect: async (targetUnit: IUnit, state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean) => {
      // Deal damage to units
      takeDamage({
        unit: targetUnit,
        amount: 30,
        sourceUnit: state.casterUnit,
        fromVec2: state.casterUnit,
      }, underworld, prediction);
    }
  },
  {
    colorStart: 0x000000,
    colorEnd: 0x00FF00,
    card: {
      id: 'Target Nova',
      category: CardCategory.Targeting,
      supportQuantity: false,
      manaCost: 30,
      healthCost: 0,
      expenseScaling: 1,
      sfx: 'nova',
      probability: probabilityMap[CardRarity.UNCOMMON],
      thumbnail: 'spellIconNovaTarget.png',
      description: ['spell_nova'],
      allowNonUnitTarget: true,
    },
    pickup_effect: (targetPickup: IPickup, state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean) => {
      addTarget(targetPickup, state, underworld, prediction);
    },
    effect: async (targetUnit: IUnit, state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean) => {
      if (!prediction)
        console.log('jtest', targetUnit.x, targetUnit.y);
      addTarget(targetUnit, state, underworld, prediction);
      // playSFXKey('targetAquired');
      // globalThis.predictionGraphicsGreen?.drawCircle(targetUnit.x, targetUnit.y, config.COLLISION_MESH_RADIUS);
      await animateTargetCircle(targetUnit, underworld, prediction);
      // if (!prediction) {
      //   await new Promise((res) => {
      //     setTimeout(res, 2000);
      //   });
      // }
    }
  }
];

function getAdjustedRadius(radiusBoost: number = 0) {
  // +50% radius per radius boost
  return baseNovaRadius * (1 + (0.5 * radiusBoost));
}

export default novas.map(n => {
  const spell: Spell = {
    card: {
      ...{
        id,
        category: CardCategory.Damage,
        supportQuantity: true,
        manaCost: 30,
        healthCost: 0,
        expenseScaling: 1,
        sfx: 'nova',
        probability: probabilityMap[CardRarity.COMMON],
        thumbnail: 'spellIconNovaPain.png',
        description: ['spell_nova'],
        allowNonUnitTarget: true,
        effect: async (state, card, quantity, underworld, prediction) => {
          const radiusBoost = state.aggregator.radiusBoost;
          const radius = getAdjustedRadius(radiusBoost);
          const location = state.casterUnit;
          if (prediction) {
            drawUICirclePrediction(location, radius, n.colorEnd, 'Nova Radius');
          } else {
            playDefaultSpellSFX(card, prediction);
            makeNova(location, radius / baseNovaRadius, n.colorStart, n.colorEnd, prediction);
          }

          if (n.pickup_effect) {
            const pickups = underworld.getPickupsWithinDistanceOfTarget(location, radius, prediction);
            pickups.forEach(p => {
              if (n.pickup_effect)
                n.pickup_effect(p, state, card, quantity, underworld, prediction);
            });
          }
          const units = underworld.getUnitsWithinDistanceOfTarget(location, radius, prediction);
          const promises: Promise<void>[] = [];
          units.forEach(u => {
            // Exclude self
            if (u == state.casterUnit) {
              return;
            }
            promises.push(n.effect(u, state, card, quantity, underworld, prediction));
          });
          await raceTimeout(2000, 'nova ' + id, Promise.all(promises));
          return state;
        },
      }, ...n.card
    },
    modifiers: {
    },
    events: {}
  };
  return spell;
});

const timeoutMsAnimation = 1000;
async function animateTargetCircle(pos: Vec2, underworld: Underworld, prediction: boolean) {
  if (globalThis.headless || prediction) {
    // Animations do not occur on headless, so resolve immediately or else it
    // will just waste cycles on the server
    return Promise.resolve();
  }

  // Keep track of which entities have been targeted so far for the sake
  // of making a new sfx when a new entity gets targeted
  playSFXKey('targeting');
  return raceTimeout(timeoutMsAnimation, 'animatedExpand', new Promise<void>(resolve => {
    animateFrame(pos, Date.now(), underworld, resolve)();
  })).then(() => {
    globalThis.predictionGraphicsGreen?.clear();
  });
}

const millisToGrow = 1000;
function animateFrame(pos: Vec2, startTime: number, underworld: Underworld, resolve: (value: void | PromiseLike<void>) => void) {
  return function animateFrameInner() {
    if (globalThis.predictionGraphicsGreen) {
      globalThis.predictionGraphicsGreen.clear();
      globalThis.predictionGraphicsGreen.lineStyle(2, 0xffffff, 1.0)
      const now = Date.now();
      const timeDiff = now - startTime;


      const animatedRadius = 64 * easeOutCubic(Math.min(1, timeDiff / millisToGrow));
      // globalThis.predictionGraphicsGreen.drawCircle(pos.x, pos.y, animatedRadius);
      globalThis.predictionGraphicsGreen.endFill();
      playSFXKey('targetAquired');
      globalThis.predictionGraphicsGreen?.drawCircle(pos.x, pos.y, config.COLLISION_MESH_RADIUS);

      if (timeDiff > millisToGrow) {
        resolve();
        return;
      } else {
        requestAnimationFrame(animateFrame(pos, startTime, underworld, resolve));
      }
    } else {
      resolve();
    }

  }
}