import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Image from '../graphics/Image';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { getUniqueSeedString, seedrandom } from "../jmath/rand";
import { teleport } from "../effects/teleport";
import { skyBeam } from "../VisualEffects";

export const unstableId = 'Unstable';
const subspriteId = 'spellUnstable';
function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
  Image.addSubSprite(unit.image, subspriteId);
}
export default function registerUnstable() {
  registerModifiers(unstableId, {
    description: 'unstable_description',
    probability: 100,
    addModifierVisuals,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, unstableId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, unstableId);
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
  registerEvents(unstableId, {
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (!unit.alive) {
        return;
      }
      const seed = seedrandom(`${getUniqueSeedString(underworld)}-${unit.id}`);
      const displaceLocation = underworld.findValidSpawnInWorldBounds(prediction, seed, { allowLiquid: false });
      if (displaceLocation) {
        playSFXKey('swap');
        skyBeam(unit);
        teleport(unit, displaceLocation, underworld, prediction, false, unit);
      }
    }
  });
}
