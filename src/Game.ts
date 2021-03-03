import { Spell, effect } from './Spell';
import type { IPlayer } from './Player';
import * as config from './config';
import * as Unit from './Unit';
import { generateCards, clearCards } from './cards';
import {
  clearSpellIndex,
  hasAtLeastOneCastableSpell,
  updateSelectedSpellUI,
} from './SpellPool';
import { MESSAGE_TYPES } from './MessageTypes';

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
interface Coords {
  x: number;
  y: number;
}
const elPlayerTurnIndicator = document.getElementById('player-turn-indicator');
const elTurnTimeRemaining = document.getElementById('turn-time-remaining');
export default class Game {
  state: game_state;
  turn_phase: turn_phase;
  height: number = config.BOARD_HEIGHT;
  width: number = config.BOARD_WIDTH;
  players: IPlayer[] = [];
  units: Unit.IUnit[] = [];
  // The index of which player's turn it is
  playerTurnIndex: number;
  secondsLeftForTurn: number;
  yourTurn: boolean;
  // A set of clientIds who have ended their turn
  // Being a Set prevents a user from ending their turn more than once
  endedTurn = new Set<string>();
  constructor() {
    this.setGameState(game_state.Lobby);
    window.game = this;
    setInterval(() => {
      if (this.turn_phase === turn_phase.Cast) {
        // Limit turn duration during Cast phase
        this.secondsLeftForTurn--;
        elTurnTimeRemaining.innerText = `0:${
          this.secondsLeftForTurn < 10
            ? '0' + this.secondsLeftForTurn
            : this.secondsLeftForTurn
        }`;
        // Skip your turn if you run out of time
        if (this.yourTurn && this.secondsLeftForTurn <= 0) {
          console.log('Out of time, turn ended');
          this.endMyTurn();
        }
      } else {
        elTurnTimeRemaining.innerText = '';
      }
    }, 1000);
  }
  goToNextPhaseIfAppropriate() {
    if (this.turn_phase === turn_phase.PickCards) {
      const chosenCards = document.querySelectorAll('.card.disabled').length;
      // Once six cards have been chosen
      if (chosenCards === config.CHOSEN_CARDS_TILL_NEXT_PHASE) {
        // Advance the game phase
        this.setTurnPhase(turn_phase.NPC);
        // Remove the remaining unselected cards
        clearCards();
      }
    } else if (this.turn_phase === turn_phase.Cast) {
      if (this.endedTurn.size >= this.players.length) {
        // Reset the endedTurn set so both players can take turns again next Cast phase
        this.endedTurn.clear();
        // Ensure the other player picks first
        // (This alternates which player picks first)
        this.incrementPlayerTurn();
        // Move onto next phase
        this.setTurnPhase(turn_phase.PickCards);
      }
    }
  }
  incrementPlayerTurn() {
    this.playerTurnIndex = (this.playerTurnIndex + 1) % this.players.length;
    this.secondsLeftForTurn = config.MAX_SECONDS_PER_TURN;
    if (this.players[this.playerTurnIndex].clientId === window.clientId) {
      elPlayerTurnIndicator.innerText = 'Your turn';
      document.body.classList.add('your-turn');
      this.yourTurn = true;
      if (this.turn_phase === turn_phase.Cast) {
        if (!hasAtLeastOneCastableSpell()) {
          this.endMyTurn();
        }
      }
    } else {
      elPlayerTurnIndicator.innerText = 'Opponents turn';
      document.body.classList.remove('your-turn');
      this.yourTurn = false;
    }
    this.goToNextPhaseIfAppropriate();
  }
  endMyTurn() {
    // Turns can only be manually ended during the cast phase
    // player turn is incremented automatically during the PickCard phase
    if (this.turn_phase === turn_phase.Cast) {
      window.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
    }
  }
  setTurnPhase(p: turn_phase) {
    this.turn_phase = p;

    // Remove all phase classes from body
    for (let phaseClass of document.body.classList.values()) {
      if (phaseClass.includes('phase-')) {
        document.body.classList.remove(phaseClass);
      }
    }

    const phase = turn_phase[this.turn_phase];
    // Add current phase class to body
    document.body.classList.add('phase-' + phase.toLowerCase());
    switch (phase) {
      case 'PickCards':
        generateCards(8);
        // Clean up DOM of dead units
        // Note: This occurs in the first phase so that "dead" units can animate to death
        // after they take mortally wounding damage without their html elements being removed before
        // the animation takes place
        for (let u of this.units) {
          if (!u.alive) {
            // Remove image from DOM
            u.image.cleanup();
          }
        }
        // Remove dead units
        this.units = this.units.filter((u) => u.alive);
        break;
      case 'NPC':
        for (let i = 0; i < config.NUMBER_OF_UNITS_SPAWN_PER_TURN; i++) {
          // Extra "-1" is because board width is 0 indexed
          const x = window.random.integer(0, config.BOARD_WIDTH - 1);
          // Spawn equal amount of Golems per Player side:
          const y =
            i % 2 == 0 ? config.BOARD_HEIGHT / 2 - 1 : config.BOARD_HEIGHT / 2;

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

        window.animationManager.startAnimate().then(() => {
          this.setTurnPhase(turn_phase.Cast);
        });
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
  getTargetsOfSpell(spell: Spell): Coords[] {
    let units = [];
    if (spell.aoe_radius) {
      const withinRadius = this.getUnitsWithinDistanceOfPoint(
        spell.x,
        spell.y,
        spell.aoe_radius,
      );
      units = units.concat(withinRadius);
    }
    if (spell.chain) {
      if (units.length === 0) {
        const origin_units = this.getUnitsAt(spell.x, spell.y);
        // Only chain if the spell is cast directly on a unit
        // otherwise the chain will reach too far (1 distance away from empty cell)
        if (origin_units.length) {
          // Find all units touching the spell origin
          const chained_units = this.getTouchingUnitsRecursive(
            spell.x,
            spell.y,
          );
          units = units.concat(chained_units);
        }
      } else {
        // Find all units touching targeted units
        // This supports AOE + chain combo for example where all units within the AOE blast will
        // chain to units touching them
        for (let alreadyTargetedUnit of units) {
          const chained_units = this.getTouchingUnitsRecursive(
            alreadyTargetedUnit.x,
            alreadyTargetedUnit.y,
            units,
          );
          units = units.concat(chained_units);
        }
      }
    }
    let coords = units.map((u) => ({ x: u.x, y: u.y }));
    if (coords.length == 0) {
      coords = [
        {
          x: spell.x,
          y: spell.y,
        },
      ];
    }
    return coords;
  }
  getUnitsWithinDistanceOfPoint(
    x: number,
    y: number,
    distance: number,
  ): Unit.IUnit[] {
    return this.units.filter((u) => {
      return (
        u.alive &&
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
    ignore: Unit.IUnit[] = [],
  ): Unit.IUnit[] {
    const touchingDistance = 1;
    let touching = this.units.filter((u) => {
      return (
        u.alive &&
        u.x <= x + touchingDistance &&
        u.x >= x - touchingDistance &&
        u.y <= y + touchingDistance &&
        u.y >= y - touchingDistance &&
        !ignore.includes(u)
      );
    });
    ignore = ignore.concat(touching);
    for (let u of touching) {
      touching = touching.concat(
        this.getTouchingUnitsRecursive(u.x, u.y, ignore),
      );
    }
    return touching;
  }
  getUnitsAt(x?: number, y?: number): Unit.IUnit[] {
    return this.units.filter((u) => u.alive && u.x === x && u.y === y);
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
    const { x, y, index, caster } = spell;
    // If you are casting the spell, clear the spell in the spell pool that was just cast
    if (caster.clientId === window.clientId) {
      clearSpellIndex(index);
      updateSelectedSpellUI();
    }
    // Get all units targeted by spell
    const targetCoords = this.getTargetsOfSpell(spell);
    // Convert targets to list of units
    let unitsAtTargets = [];
    for (let t of targetCoords) {
      const { x, y } = t;
      unitsAtTargets = unitsAtTargets.concat(this.getUnitsAt(x, y));
    }

    window.animationManager.startGroup('spell-effects');
    if (unitsAtTargets.length) {
      // Cast on each unit targeted
      for (let unit of unitsAtTargets) {
        effect(spell, { unit });
      }
    }
    window.animationManager.endGroup('spell-effects');
  }
}
