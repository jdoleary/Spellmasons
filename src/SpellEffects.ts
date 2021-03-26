// TODO: This file is intended to fully replace Spell.ts by allowing
// cards to associate with highly flexible Hooks (husky style but for game events)
// that allow card effects to be highly composable

import type { CardTally } from './Card';
import type { Coords } from './commonTypes';
import type { IPlayer } from './Player';
import type { IUnit } from './Unit';

export interface Effect {
  // Returns true if the rest of the spell should be aborted
  preSpell?: (caster: IPlayer, cardTally: CardTally, target: Coords) => boolean;
  modifyTargets?: (
    caster: IPlayer,
    targets: Coords[],
    magnitude: number,
  ) => Coords[];
  singleTargetEffect?: (
    caster: IPlayer,
    target: Coords,
    magnitude: number,
  ) => void;
  postSpell?: (caster: IPlayer, target: Coords[]) => void;
}
