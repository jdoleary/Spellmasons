import type * as Player from './Player';
import * as Unit from './Unit';
// import * as Pickup from './Pickup';
import type { Coords } from './commonTypes';
import { modifiersSource } from './Modifiers';
// import * as math from './math';

// Guiding rules for designing card effects:
// Follow the Priciple of Least Surpise
// Every card should be designed to respond well to potentially more than one target

export interface EffectState {
  caster: Player.IPlayer;
  targets: Coords[];
  cards: string[];
  // aggregator carries extra information that can be passed
  // between card effects.
  // For example, "Vampiric" adds all damage taken
  // to the caster, this damage taken needs to be aggregated
  // for "Vampiric" to know how much to apply
  aggregator: any;
}
export type EffectFn = {
  (state: EffectState): EffectState;
};

export interface ICard {
  id: string;
  thumbnail: string;
  probability: number;
  effect: EffectFn;
  onlyChangesTarget?: boolean;
  isDark?: boolean;
}
export const allCards: ICard[] = [
  //   {
  //     id: 'obliterate',
  //     thumbnail: 'images/spell/obliterate.png',
  //     probability: 1,
  //     isDark: true,
  //   },
  {
    id: 'damage',
    thumbnail: 'images/spell/damage.png',
    probability: 120,
    effect: (state) => {
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          const damage = 1;
          Unit.takeDamage(unit, damage);
          state.aggregator.damageDealt =
            (state.aggregator.damageDealt || 0) + damage;
        }
      }
      return state;
    },
  },
  {
    id: 'heal',
    thumbnail: 'images/spell/heal.png',
    probability: 50,
    effect: (state) => {
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          const damage = -1;
          Unit.takeDamage(unit, damage);
          state.aggregator.damageDealt =
            (state.aggregator.damageDealt || 0) + damage;
        }
      }
      return state;
    },
  },
  {
    id: 'area_of_effect',
    thumbnail: 'images/spell/aoe.png',
    probability: 10,
    onlyChangesTarget: true,
    effect: (state) => {
      console.log('aoe');
      let updatedTargets = [...state.targets];
      for (let target of state.targets) {
        const withinRadius = window.game.getCoordsWithinDistanceOfTarget(
          target.x,
          target.y,
          1,
        );
        updatedTargets = updatedTargets.concat(withinRadius);
      }
      // deduplicate
      updatedTargets.filter((coord, index) => {
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
  {
    id: 'chain',
    thumbnail: 'images/spell/chain.png',
    probability: 10,
    onlyChangesTarget: true,
    effect: (state) => {
      console.log('chain');
      let updatedTargets = [...state.targets];
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          // Find all units touching the spell origin
          const chained_units = window.game.getTouchingUnitsRecursive(
            target.x,
            target.y,
            updatedTargets,
          );
          updatedTargets = updatedTargets.concat(chained_units);
        }
      }
      // deduplicate
      updatedTargets.filter((coord, index) => {
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
  {
    id: 'freeze',
    thumbnail: 'images/spell/freeze.png',
    probability: 20,
    effect: (state) => {
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          modifiersSource.freeze.add(unit);
        }
        return state;
      }
    },
  },
  {
    id: 'shield',
    thumbnail: 'images/spell/shield.png',
    probability: 10,
    effect: (state) => {
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          modifiersSource.shield.add(unit);
        }
        return state;
      }
      return state;
    },
  },

  {
    id: 'swap',
    thumbnail: 'images/spell/swap.png',
    probability: 3,
    effect: (state) => {
      return state;
    },
    // effect: {
    //   preSpell: (caster, cardTally, target) => {
    //     const unitToSwapWith = window.game.getUnitAt(target.x, target.y);
    //     // Physically swap with target
    //     if (unitToSwapWith) {
    //       Unit.setLocation(unitToSwapWith, caster.unit);
    //     }
    //     // Physically swap with pickups
    //     const pickupToSwapWith = window.game.getPickupAt(target.x, target.y);
    //     if (pickupToSwapWith) {
    //       Pickup.setPosition(pickupToSwapWith, caster.unit.x, caster.unit.y);
    //     }
    //     const newTargetX = caster.unit.x;
    //     const newTargetY = caster.unit.y;
    //     Unit.setLocation(caster.unit, target).then(() => {
    //       // Disable swap so it doesn't recurse forever
    //       delete cardTally.swap;
    //       window.game.castCards(caster, cardTally, {
    //         x: newTargetX,
    //         y: newTargetY,
    //       });
    //     });
    //     // Do not continue with casting the spell
    //     return true;
    //   },
    // },
  },
  {
    id: 'push',
    thumbnail: 'images/spell/push.png',
    probability: 5,
    effect: (state) => {
      return state;
    },
    // effect: {
    //   singleTargetEffect: (caster, target, magnitude) => {
    //     for (let i = 0; i < magnitude; i++) {
    //       const unit = window.game.getUnitAt(target.x, target.y);
    //       if (unit) {
    //         const moveTo = math.oneCellAwayFromCell(unit, caster.unit);
    //         Unit.moveTo(unit, moveTo);
    //       }
    //     }
    //   },
    // },
  },
];
