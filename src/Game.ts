import { Spell, effect, getImage } from './Spell';
import type { IPlayer } from './Player';
import * as config from './config';
import * as Unit from './Unit';
import * as SpellPool from './SpellPool';
import { generateCards } from './cards';

SpellPool.create();

export enum game_state {
  Lobby,
  WaitingForPlayerReconnect,
  Playing,
  GameOver,
}
export enum turn_phase {
  PickCards,
  NPC,
  Cast,
}
const debugInfo = {};
const debugEl = document.getElementById('debug');
window.setDebug = function setDebug(json) {
  if (debugEl) {
    debugEl.innerHTML = JSON.stringify(Object.assign(debugInfo, json), null, 2);
  }
};
const elPlayerTurnIndicator = document.getElementById('player-turn-indicator');
export default class Game {
  state: game_state;
  turn_phase: turn_phase;
  height: number = config.BOARD_HEIGHT;
  width: number = config.BOARD_WIDTH;
  players: IPlayer[] = [];
  units: Unit.IUnit[] = [];
  // The index of which player's turn it is
  playerTurnIndex: number;
  yourTurn: boolean;
  constructor() {
    this.setGameState(game_state.Lobby);
    window.game = this;
  }
  incrementPlayerTurn() {
    this.playerTurnIndex = (this.playerTurnIndex + 1) % this.players.length;
    if (this.players[this.playerTurnIndex].clientId === window.clientId) {
      elPlayerTurnIndicator.innerText = 'Your turn';
      document.body.classList.add('your-turn');
      this.yourTurn = true;
    } else {
      elPlayerTurnIndicator.innerText = 'Opponents turn';
      document.body.classList.remove('your-turn');
      this.yourTurn = false;
    }
  }
  setTurnPhase(p: turn_phase) {
    this.turn_phase = p;
    const phase = turn_phase[this.turn_phase];
    switch (phase) {
      case 'PickCards':
        generateCards(8);
        break;
      case 'NPC':
        const TEMP_NUMBER_OF_UNITS = 2;
        for (let i = 0; i < TEMP_NUMBER_OF_UNITS; i++) {
          // Extra "-1" is because board width is 0 indexed
          const x = window.random.integer(0, config.BOARD_WIDTH - 1);
          // Extra "-1" is because board height is 0 indexed
          const y = window.random.integer(
            config.BOARD_HEIGHT / 2 - 1,
            config.BOARD_HEIGHT / 2,
          );
          const unit = Unit.create(
            x,
            y,
            0,
            y < config.BOARD_HEIGHT / 2 ? -1 : 1,
            'crocodile.png',
          );
          this.summon(unit);
        }
        // Move units
        for (let u of this.units) {
          Unit.move(u);
          u.justSpawned = false;
        }

        // Unfreeze frozen units
        for (let u of this.units) {
          if (u.frozen) {
            u.frozen = false;
          }
        }

        window.animationManager.startAnimate();
        break;
      default:
        break;
    }
    window.setDebug({ phase });
  }
  setGameState(g: game_state) {
    this.state = g;
    const state = game_state[this.state];
    const elBoard = document.getElementById('board');
    switch (state) {
      case 'Playing':
        if (elBoard) {
          elBoard.style.visibility = 'visible';
        }
        // Choose a random player index to start and immediately
        // increment to setup the turn state properly
        this.playerTurnIndex = window.random.integer(
          0,
          this.players.length - 1,
        );
        // Initialize the player turn state
        this.incrementPlayerTurn();
        // Set the first turn phase
        this.setTurnPhase(turn_phase.PickCards);
        break;
      default:
        if (elBoard) {
          elBoard.style.visibility = 'hidden';
        }
    }
    window.setDebug({ state });
  }
  getUnitsWithinDistanceOfPoint(
    x: number,
    y: number,
    distance: number,
  ): Unit.IUnit[] {
    return this.units.filter((u) => {
      return (
        u.x <= x + distance &&
        u.x >= x - distance &&
        u.y <= y + distance &&
        u.y >= y - distance
      );
    });
  }
  getTouchingUnitsRecursive(
    x: number,
    y: number,
    distance: number,
    ignore: Unit.IUnit[] = [],
  ): Unit.IUnit[] {
    let touching = this.units.filter((u) => {
      return (
        u.x <= x + distance &&
        u.x >= x - distance &&
        u.y <= y + distance &&
        u.y >= y - distance &&
        !ignore.includes(u)
      );
    });
    ignore = ignore.concat(touching);
    for (let u of touching) {
      touching = touching.concat(
        this.getTouchingUnitsRecursive(u.x, u.y, distance, ignore),
      );
    }
    return touching;
  }
  getUnitsAt(x?: number, y?: number): Unit.IUnit[] {
    return this.units.filter((u) => u.x === x && u.y === y);
  }
  getPlayerAt(heart_x: number, heart_y: number): IPlayer | undefined {
    for (let p of this.players) {
      // Only one has to match
      // Example heart postions are
      // p.heart_x = -1; p.heart_y = undefined;
      // p.heart_y = 8; p.heart_x = undefined;
      if (p.heart_x === heart_x || p.heart_y === heart_y) {
        return p;
      }
    }
  }
  summon(unit: Unit.IUnit) {
    this.units.push(unit);
  }
  cast(spell: Spell) {
    const { x, y } = spell;
    const targets = this.getUnitsAt(x, y);
    if (targets.length) {
      // If there are multiple targets, group their animations together
      window.animationManager.startGroup('spell-effects');
      for (let unit of targets) {
        effect(spell, { unit, game: this });
      }
      window.animationManager.endGroup('spell-effects');
    } else {
      window.animationManager.startGroup('spell-effects');
      effect(spell, { game: this });
      window.animationManager.endGroup('spell-effects');
    }
  }
}
