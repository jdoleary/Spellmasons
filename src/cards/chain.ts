import { containerSpells } from '../PixiUtils';
import * as Image from '../Image';
import type { Spell } from '.';

const id = 'chain';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'images/spell/chain.png',
    probability: 10,
    effect: async (state, dryRun) => {
      let updatedTargets = [...state.targets];
      const animationPromises = [];
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          // Find all units touching the spell origin
          const chained_units = window.game.getTouchingUnitsRecursive(
            target.x,
            target.y,
            updatedTargets,
          );
          // Animate in new targets:
          for (let target of chained_units) {
            const image = Image.create(
              target.x,
              target.y,
              'images/spell/target.png',
              containerSpells,
            );
            if (!dryRun) {
              image.sprite.scale.set(0.0);
              animationPromises.push(
                Image.scale(image, 1.0).then(() => {
                  Image.cleanup(image);
                }),
              );
            }
          }
          updatedTargets = updatedTargets.concat(chained_units);
        }
      }
      await Promise.all(animationPromises);
      // deduplicate
      updatedTargets = updatedTargets.filter((coord, index) => {
        return (
          updatedTargets.findIndex(
            (findCoords) => findCoords.x == coord.x && findCoords.y === coord.y,
          ) === index
        );
      });
      // Update targets
      state.targets = updatedTargets;

      return state;
    },
  },
};
export default spell;
