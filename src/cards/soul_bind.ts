import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { jitter, lerpVec2 } from '../jmath/Vec';
import { HasSpace } from '../entity/Type';

const soulBindId = 'Soul Bind';
const soulBindLineColor = 0x371f76;
const spell: Spell = {
  card: {
    id: soulBindId,
    category: CardCategory.Curses,
    sfx: 'soulBind',
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconSoulBind.png',
    animationPath: 'spell-effects/spellDebilitate',
    description: ['spell_soul_bind'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        for (let unit of targets) {
          Unit.addModifier(unit, soulBindId, underworld, prediction, quantity);
        }
        if (!prediction) {
          // Animate beam for all Soul Bound Units
          playDefaultSpellSFX(card, prediction);
          await animate(getSoulBoundUnits(underworld, prediction));
        }
      }
      return state;
    },
  },
  modifiers: {
    stage: 'Soul Bind',
    add,
  },
  events: {
    onTakeDamage: (unit, amount, underworld, prediction, damageDealer) => {
      // Soul Bind splits damage/healing across all soul bound units
      const boundUnits = getSoulBoundUnits(underworld, prediction);
      for (let i = 0; i < boundUnits.length; i++) {
        const boundUnit = boundUnits[i];
        // This unit is already running the take damage event, so exclude it
        if (boundUnit && boundUnit != unit) {
          // Exception: Temporarily remove the bound unit's Soul Bind event to prevent infinite loop
          boundUnit.events = boundUnit.events.filter(x => x !== soulBindId);

          // Unit.TakeDamage, it's important to preserve all damage args
          Unit.takeDamage({
            unit: boundUnit,
            amount: Math.ceil(amount / boundUnits.length),
            sourceUnit: damageDealer,
          }, underworld, prediction);

          // Restore the Soul Bind event if the boundUnit still has the Soul Bind modifier
          if (boundUnit.modifiers[soulBindId]) {
            Unit.addEvent(boundUnit, soulBindId);
          }
        }
      }

      // Soul Bind modifies incoming damage/healing
      return Math.ceil(amount / boundUnits.length);
    },
    onDrawSelected: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[soulBindId];
      if (modifier) {
        const soulBoundUnits = getSoulBoundUnits(underworld, prediction);
        if (soulBoundUnits.length) {
          const graphics = globalThis.selectedUnitGraphics;
          if (graphics) {
            for (let soulBoundUnit of soulBoundUnits) {
              graphics.lineStyle(3, soulBindLineColor, 0.7);
              graphics.moveTo(soulBoundUnit.x, soulBoundUnit.y);
              graphics.lineTo(unit.x, unit.y);
            }
          }
        }
      }
    }
  },
};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  getOrInitModifier(unit, soulBindId, { isCurse: true, quantity }, () => {
    Unit.addEvent(unit, soulBindId);
  });
}
export default spell;
function getSoulBoundUnits(underworld: Underworld, prediction: boolean): Unit.IUnit[] {
  return (prediction ? underworld.unitsPrediction : underworld.units).filter(u => !!u.modifiers[soulBindId] && u.alive && !u.flaggedForRemoval);
}
async function animate(targets: HasSpace[]) {
  // Animations do not occur on headless
  if (!globalThis.headless) {
    return new Promise<void>((resolve) => {
      doDraw(resolve, targets, Date.now() + 700);
    }).then(() => {
      globalThis.predictionGraphics?.clear();
    });
  }
}
function doDraw(resolve: (value: void | PromiseLike<void>) => void, targets: HasSpace[], endTime: number) {
  const didDraw = drawLineBetweenTargets(targets);
  if (didDraw) {
    // Show the electricity for a moment
    if (Date.now() > endTime) {
      resolve();
    } else {
      requestAnimationFrame(() => doDraw(resolve, targets, endTime))
    }
  } else {
    resolve();
  }
}
// Returns true if it did draw
function drawLineBetweenTargets(targets: HasSpace[]): boolean {
  // Animations do not occur on headless
  if (!globalThis.headless) {
    if (globalThis.predictionGraphics) {
      if (targets[0] === undefined) {
        return false;
      }
      globalThis.predictionGraphics.clear();
      globalThis.predictionGraphics.lineStyle(4, soulBindLineColor, 1.0);
      globalThis.predictionGraphics.moveTo(targets[0].x, targets[0].y);
      let from = targets[0];
      for (let target of targets) {
        for (let i = 0; i < 5; i++) {
          const intermediaryPoint = jitter(lerpVec2(from, target, 0.2 * i), 1);
          globalThis.predictionGraphics.lineTo(intermediaryPoint.x, intermediaryPoint.y);
        }
        globalThis.predictionGraphics.lineTo(target.x, target.y);
        from = target;
      }
      return true;
    }
  }
  return false;
}