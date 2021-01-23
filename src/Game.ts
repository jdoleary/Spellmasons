import type Unit from './Unit';
import type {Spell} from './Spell';
import type Player from './Player'

enum game_state {
    GameOver,
    Setup,
    Playing,
}

export default class Game {
    state: game_state = game_state.Setup;
    players: Player[] = [];
    units: Unit[] = [];
    traps: Spell[] = [];
}