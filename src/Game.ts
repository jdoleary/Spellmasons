import type Unit from './Unit';
import type { SpellMeta } from './Spell';
import type Player from './Player';

export enum game_state {
  Playing,
  GameOver,
}

export default class Game {
  state: game_state = game_state.Playing;
  players: Player[] = [];
  units: Unit[] = [];
  spellMetas: SpellMeta[] = [];
  nextTurn() {}
}
