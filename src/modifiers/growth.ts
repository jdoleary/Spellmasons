import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Image from '../graphics/Image';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import floatingText from "../graphics/FloatingText";
import { allUnits } from "../entity/units";
import * as config from '../config';

export const growthId = 'Growth';
const subspriteId = 'growth';
const increase_proportion = 0.2;
function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
  Image.addSubSprite(unit.image, subspriteId);
}
export default function registerGrowth() {
  registerModifiers(growthId, {
    description: 'growth_description',
    probability: 100,
    unavailableUntilLevelIndex: 7,
    addModifierVisuals,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, growthId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, growthId);
      });
    },
    subsprite: {
      imageName: subspriteId,
      alpha: 1.0,
      anchor: {
        x: 0.7,
        y: 0.5,
      },
      scale: {
        x: 0.8,
        y: 0.8,
      },
    },
  });

  registerEvents(growthId, {
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (!unit.alive) {
        return;
      }
      floatingText({ coords: unit, text: growthId, prediction });
      unit.strength++;
      const sourceUnit = allUnits[unit.unitSourceId];
      const { healthMax: sourceHealthMax, damage: sourceDamage } = Object.assign({ healthMax: config.UNIT_BASE_HEALTH, damage: config.UNIT_BASE_DAMAGE }, sourceUnit?.unitProps || {});
      Image.setScaleFromModifiers(unit.image, unit.strength);
      const addHealth = sourceHealthMax * increase_proportion;
      unit.healthMax += addHealth;
      unit.health += addHealth;
      unit.damage += sourceDamage * increase_proportion;

    }
  });
}
