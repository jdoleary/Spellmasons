import { refundLastSpell, Spell } from './index';
import floatingText from '../graphics/FloatingText';
import { addPixiSpriteAnimated } from '../graphics/PixiUtils';
import { makeManaTrail } from '../graphics/Particles';
import { CardCategory, UnitSubType } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';
import { explain, EXPLAIN_OVERFILL } from '../graphics/Explain';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { die } from '../entity/Unit';
import * as Image from '../graphics/Image';

const damage = config.UNIT_BASE_HEALTH; //40 at time of writing
export const consumeAllyCardId = 'Sacrifice';
const spell: Spell = {
  card: {
    id: consumeAllyCardId,
    category: CardCategory.Soul,
    sfx: 'sacrifice',
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconSacrifice.png',
    description: ['spell_sacrifice', damage.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      const caster = state.casterUnit;
      // .filter: only target living units of the same faction
      const targets = state.targetedUnits.filter(u => u.alive && u.health > 0 && u.faction == caster.faction);
      let promises = [];
      let totalHealthStolen = 0;
      for (let unit of targets) {
        const unitHealthStolen = Math.min(unit.health, damage * quantity);
        // This instead of takeDamage() -> ignores shield, not modified by damage mitigation/prevention, doesn't trigger onDamage event
        unit.health -= unitHealthStolen;
        totalHealthStolen += unitHealthStolen;
        if (unit.health <= 0) die(unit, underworld, prediction, state.casterUnit);
        const healthTrailPromises = [];
        if (!prediction) {
          const NUMBER_OF_ANIMATED_TRAILS = Math.min(6, unitHealthStolen / 10);
          for (let i = 0; i < quantity * NUMBER_OF_ANIMATED_TRAILS; i++) {
            healthTrailPromises.push(makeManaTrail(unit, caster, underworld, '#ff6767n', '#ff0000', targets.length * quantity * NUMBER_OF_ANIMATED_TRAILS).then(() => {
              if (!prediction) {
                playDefaultSpellSFX(card, prediction);
                Image.addOneOffAnimation(state.casterUnit, 'spell-effects/potionPickup', {}, { loop: false });
                explain(EXPLAIN_OVERFILL);
              }
            })
            );
          }
        }
        promises.push((prediction ? Promise.resolve() : Promise.all(healthTrailPromises)));
      }
      await Promise.all(promises);

      state.casterUnit.health += totalHealthStolen;

      playDefaultSpellSFX(card, prediction);
      if (totalHealthStolen > 0) {
        if (!prediction) {
          floatingText({
            coords: caster,
            text: `+ ${totalHealthStolen} Health`,
            style: { fill: 'red', ...config.PIXI_TEXT_DROP_SHADOW }
          });
        }
      } else {
        refundLastSpell(state, prediction, 'No targets have health to steal\nMana cost refunded')
      }
      return state;
    },
  },
};
export default spell;
