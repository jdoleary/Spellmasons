import * as PIXI from 'pixi.js';

import { Spell, effect } from './Spell';
import type { IPlayer } from './Player';
import * as config from './config';
import * as Unit from './Unit';
import * as Card from './cards';
import { updateSelectedSpellUI } from './SpellPool';
import { MESSAGE_TYPES } from './MessageTypes';
import { addPixiSprite, app } from './PixiUtils';

export enum game_state {
  Lobby,
  WaitingForPlayerReconnect,
  Playing,
  GameOver,
}
export enum turn_phase {
  PlayerTurns,
  NPC,
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
  boardContainer: PIXI.Container;
  turn_phase: turn_phase;
  height: number = config.BOARD_HEIGHT;
  width: number = config.BOARD_WIDTH;
  portal: Unit.IUnit;
  players: IPlayer[] = [];
  units: Unit.IUnit[] = [];
  // The number of the current level
  level = 1;
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

    // Visuals:
    this.boardContainer = new PIXI.Container();
    this.boardContainer.x = 0;
    this.boardContainer.y = 0;
    app.stage.addChild(this.boardContainer);
    // Make sprites for the board tiles
    let cell;
    for (let x = 0; x < config.BOARD_WIDTH; x++) {
      for (let y = 0; y < config.BOARD_HEIGHT; y++) {
        cell = addPixiSprite('images/cell.png', this.boardContainer);
        cell.x = x * config.CELL_SIZE;
        cell.y = y * config.CELL_SIZE;
      }
    }

    setInterval(() => {
      if (this.turn_phase === turn_phase.PlayerTurns) {
        // Limit turn duration
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
  moveToNextLevel() {
    // Clear all units
    for (let u of this.units) {
      u.image.cleanup();
    }
    this.units = [];
    this.level++;
    this.initLevel();
  }

  initLevel() {
    const portalPos = this.getRandomCell();
    this.portal = Unit.create(portalPos.x, portalPos.y, 'images/portal.png');
    // Spawn units at the start of the level
    for (
      let i = 0;
      i < config.NUMBER_OF_UNITS_SPAWN_PER_LEVEL * this.level;
      i++
    ) {
      const { x, y } = this.getRandomCell();
      Unit.create(x, y, 'images/units/golem.png');
    }
    window.animationManager.startAnimate();
  }
  getCellFromCurrentMousePos() {
    const { x, y } = this.boardContainer.toLocal(
      app.renderer.plugins.interaction.mouse.global,
    );
    return {
      x: Math.floor(x / config.CELL_SIZE),
      y: Math.floor(y / config.CELL_SIZE),
    };
  }
  goToNextPhaseIfAppropriate() {
    if (this.turn_phase === turn_phase.PlayerTurns) {
      if (this.endedTurn.size >= this.players.length) {
        // Reset the endedTurn set so both players can take turns again next Cast phase
        this.endedTurn.clear();
        // Move onto next phase
        this.setTurnPhase(turn_phase.NPC);
      }
    }
  }
  setYourTurn(yourTurn: boolean, message: string) {
    elPlayerTurnIndicator.innerText = message;
    document.body.classList.toggle('your-turn', yourTurn);
    this.yourTurn = yourTurn;
  }
  incrementPlayerTurn() {
    this.playerTurnIndex = (this.playerTurnIndex + 1) % this.players.length;
    this.secondsLeftForTurn = config.MAX_SECONDS_PER_TURN;
    if (this.players[this.playerTurnIndex].clientId === window.clientId) {
      this.setYourTurn(true, 'Your Turn');
    } else {
      this.setYourTurn(false, "Other Player's Turn");
    }
    this.goToNextPhaseIfAppropriate();
  }
  endMyTurn() {
    // Turns can only be manually ended during the PlayerTurns phase
    if (this.turn_phase === turn_phase.PlayerTurns) {
      window.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
    }
  }
  // Clean up resources of dead units
  bringOutYerDead() {
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
  }
  getRandomCell() {
    const x = window.random.integer(0, config.BOARD_WIDTH - 1);
    const y = window.random.integer(0, config.BOARD_HEIGHT - 1);
    return { x, y };
  }
  canUnitMoveIntoCell(cell_x: number, cell_y: number): boolean {
    for (let u of this.units) {
      if (u.x === cell_x && u.y === cell_y) {
        return false;
      }
    }
    return true;
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
      case 'PlayerTurns':
        // Add cards to hand
        for (let i = 0; i < 3; i++) {
          const card = Card.generateCard();
          Card.addCardToHand(card);
        }
        this.bringOutYerDead();
        break;
      case 'NPC':
        this.setYourTurn(false, "NPC's Turn");
        // Move units
        for (let u of this.units) {
          Unit.moveAI(u);
          u.justSpawned = false;
        }

        // Unfreeze frozen units
        for (let u of this.units) {
          if (u.frozen) {
            u.frozen = false;
            u.image.removeSubImage('frozen');
          }
        }

        window.animationManager.startAnimate().then(() => {
          this.setTurnPhase(turn_phase.PlayerTurns);
          // After NPC's are done, setup the next player to take their turn
          this.incrementPlayerTurn();
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
        this.setTurnPhase(turn_phase.PlayerTurns);
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
  addUnitToArray(unit: Unit.IUnit) {
    this.units.push(unit);
  }
  cast(spell: Spell) {
    const { x, y, caster } = spell;
    // If you are casting the spell, clear the spell in the spell pool that was just cast
    if (caster.clientId === window.clientId) {
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
