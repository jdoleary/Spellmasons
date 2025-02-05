import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Image from '../graphics/Image';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { apply } from '../cards/purify';
import { animateSpell } from "../cards/cardUtils";
import floatingText from "../graphics/FloatingText";

export const curseimmunityId = 'CurseImmunity';
const subspriteId = 'curseImmunity';
function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
  Image.addSubSprite(unit.image, subspriteId);
}
export default function registerCurseImmunity() {
  registerModifiers(curseimmunityId, {
    description: 'curseimmunity_description',
    probability: 100,
    addModifierVisuals,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, curseimmunityId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, curseimmunityId);
      });
    },
    subsprite: {
      imageName: subspriteId,
      alpha: 1.0,
      anchor: {
        x: 0.5,
        y: 0.5,
      },
      scale: {
        x: 1,
        y: 1,
      },
    },
  });
  registerEvents(curseimmunityId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      runCurseImmunity(unit, underworld);
    },
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      runCurseImmunity(unit, underworld);
    }
  });
}

function runCurseImmunity(unit: Unit.IUnit, underworld: Underworld) {
  if (Object.values(unit.modifiers).some(m => m.isCurse)) {
    animateSpell(unit, 'spellPurify');
    playSFXKey('purify');
    apply(unit, underworld);
    floatingText({ coords: unit, text: curseimmunityId });
  }

}