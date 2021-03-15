import * as PIXI from 'pixi.js';

import { Spell, effect } from './Spell';
import * as config from './config';
import * as Unit from './Unit';
import * as Pickup from './Pickup';
import * as Player from './Player';
import * as Card from './cards';
import * as math from './math';
import { MESSAGE_TYPES } from './MessageTypes';
import { addPixiSprite, app, containerBoard } from './PixiUtils';
import type { Random } from 'random';
import makeSeededRandom from './rand';

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
const elPlayerTurnIndicatorHolder = document.getElementById(
  'player-turn-indicator-holder',
);
const elPlayerTurnIndicator = document.getElementById('player-turn-indicator');
const elTurnTimeRemaining = document.getElementById('turn-time-remaining');
export default class Game {
  state: game_state;
  seed: string;
  random: Random;
  turn_phase: turn_phase;
  height: number = config.BOARD_HEIGHT;
  width: number = config.BOARD_WIDTH;
  players: Player.IPlayer[] = [];
  units: Unit.IUnit[] = [];
  pickups: Pickup.IPickup[] = [];
  // The number of the current level
  level = 1;
  // The index of which player's turn it is
  playerTurnIndex: number;
  secondsLeftForTurn: number = config.SECONDS_PER_TURN;
  yourTurn: boolean;
  turnInterval: any;
  hostClientId: string;
  // A set of clientIds who have ended their turn
  // Being a Set prevents a user from ending their turn more than once
  endedTurn = new Set<string>();
  constructor(seed: string) {
    this.seed = seed;
    this.random = makeSeededRandom(this.seed);
    this.setGameState(game_state.Lobby);
    window.game = this;

    // Make sprites for the board tiles
    let cell;
    for (let x = 0; x < config.BOARD_WIDTH; x++) {
      for (let y = 0; y < config.BOARD_HEIGHT; y++) {
        cell = addPixiSprite('images/tiles/ground.png', containerBoard);
        cell.x = x * config.CELL_SIZE;
        cell.y = y * config.CELL_SIZE;
      }
    }

    this.turnInterval = setInterval(() => {
      if (this.turn_phase === turn_phase.PlayerTurns) {
        // Limit turn duration
        this.secondsLeftForTurn--;
        if (this.secondsLeftForTurn <= 10) {
          elPlayerTurnIndicatorHolder.classList.add('low-time');
        }
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
  cleanup() {
    clearInterval(this.turnInterval);
    for (let u of this.units) {
      u.image.cleanup();
    }
    for (let x of this.pickups) {
      x.image.cleanup();
    }
  }
  moveToNextLevel() {
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      // Clear all remaining AI units
      if (u.unitType === 'AI') {
        u.image.cleanup();
        this.units.splice(i, 1);
      }
    }
    for (let p of this.players) {
      p.inPortal = false;
      p.unit.image.show();
      p.unit.alive = true;
      // Return to spawn
      Unit.moveTo(p.unit, 0, 0);
      window.animationManager.startAnimate();
    }
    // Clear all pickups
    for (let p of this.pickups) {
      Pickup.removePickup(p);
    }
    this.level++;
    this.initLevel();
  }

  initLevel() {
    // Add cards to hand
    for (let i = 0; i < config.GIVE_NUM_CARDS_PER_LEVEL; i++) {
      const card = Card.generateCard();
      Card.addCardToHand(card);
    }
    for (let i = 0; i < config.NUM_PICKUPS_PER_LEVEL; i++) {
      const coords = this.getRandomEmptyCell();
      if (coords) {
        const randomPickupIndex = this.random.integer(
          0,
          Object.values(Pickup.pickups).length - 1,
        );
        const pickup = Pickup.pickups[randomPickupIndex];
        Pickup.create(
          coords.x,
          coords.y,
          true,
          pickup.imagePath,
          pickup.effect,
        );
      } else {
        console.error('Pickup not spawned due to no empty cells');
      }
    }
    const portalPickup = Pickup.specialPickups['images/portal.png'];
    Pickup.create(
      config.BOARD_WIDTH - 1,
      Math.floor(config.BOARD_HEIGHT / 2),
      false,
      portalPickup.imagePath,
      portalPickup.effect,
    );
    // Spawn units at the start of the level
    for (
      let i = 0;
      i < config.NUMBER_OF_UNITS_SPAWN_PER_LEVEL * this.level;
      i++
    ) {
      const coords = this.getRandomEmptyCell();
      if (coords) {
        Unit.create(coords.x, coords.y, 'images/units/golem.png', 'AI');
      } else {
        console.error('Unit not spawned due to no empty cells');
      }
    }
    window.animationManager.startAnimate();
  }
  restorePlayerCardsInHand() {
    // Temporarily just regenerate cards
    // TODO actually restore player cards after disconnect
    // Add cards to hand
    for (let i = 0; i < config.GIVE_NUM_CARDS_PER_LEVEL; i++) {
      const card = Card.generateCard();
      Card.addCardToHand(card);
    }
  }
  checkPickupCollisions(player: Player.IPlayer) {
    for (let pu of this.pickups) {
      if (player.unit.x == pu.x && player.unit.y == pu.y) {
        Pickup.triggerPickup(pu, player);
      }
    }
  }
  getCellFromCurrentMousePos() {
    const { x, y } = containerBoard.toLocal(
      app.renderer.plugins.interaction.mouse.global,
    );
    return {
      x: Math.floor(x / config.CELL_SIZE),
      y: Math.floor(y / config.CELL_SIZE),
    };
  }
  goToNextPhaseIfAppropriate() {
    if (this.turn_phase === turn_phase.PlayerTurns) {
      // If all players that CAN take turns HAVE taken turns, then...
      if (
        this.endedTurn.size >=
        this.players.filter((p) => Player.ableToTakeTurn(p)).length
      ) {
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
    // Set current player actions used back to 0 now that their turn has ended
    const currentTurnPlayer = this.players[this.playerTurnIndex];
    currentTurnPlayer.actionsUsed = 0;

    // If no players are living, it's game over
    if (!this.players.filter((p) => p.unit.alive).length) {
      this.setGameState(game_state.GameOver);
    } else {
      // If there are players who are able to take their turns, increment to the next
      this.playerTurnIndex = (this.playerTurnIndex + 1) % this.players.length;
      const nextTurnPlayer = this.players[this.playerTurnIndex];
      if (Player.ableToTakeTurn(nextTurnPlayer)) {
        this.secondsLeftForTurn = config.SECONDS_PER_TURN;
        elPlayerTurnIndicatorHolder.classList.remove('low-time');
        this.syncYourTurnState();
        this.goToNextPhaseIfAppropriate();
      } else {
        // current player is unable to take turn, skip
        this.incrementPlayerTurn();
      }
    }
  }
  syncYourTurnState() {
    if (this.players[this.playerTurnIndex].clientId === window.clientId) {
      this.setYourTurn(true, 'Your Turn');
    } else {
      this.setYourTurn(false, "Other Player's Turn");
    }
  }
  endMyTurn() {
    // Turns can only be manually ended during the PlayerTurns phase
    if (this.turn_phase === turn_phase.PlayerTurns) {
      window.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
    }
  }
  checkForEndOfLevel() {
    // Advance the level if all living players have entered the portal:
    const doIncrementLevel =
      this.players.filter((p) => p.unit.alive && p.inPortal).length ===
      this.players.filter((p) => p.unit.alive).length;
    if (doIncrementLevel) {
      this.moveToNextLevel();
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
  // Generate an array of indices cooresponding to board cells in shuffled order
  _getShuffledCellIndicies() {
    const numberOfIndices = config.BOARD_WIDTH * config.BOARD_HEIGHT;
    const indices = [];
    // Populate an array with the 1-dimentional indices of the board
    // so if the board is 2x2, the array will be [0,1,2,3]
    for (let i = 0; i < numberOfIndices; i++) {
      indices.push(i);
    }
    // Now randomly remove indicies from that array and add them to a new array
    const shuffledIndices = [];
    for (let i = 0; i < numberOfIndices; i++) {
      const index = this.random.integer(0, indices.length);
      shuffledIndices.push(indices.splice(index, 1));
    }
    // Resulting in an array of shuffled indicies (e.g. [2,1,0,3])
    // This new array can now be used to randomly access cell coordinates
    // using (math.indexToXY) multiple times without getting the same index more than once
    return shuffledIndices;
  }
  _isCellEmpty({ x, y }: Coords): boolean {
    // Test for units in cell
    for (let u of this.units) {
      if (u.alive && u.x === x && u.y === y) {
        return false;
      }
    }
    // Test for pickups
    for (let u of this.pickups) {
      if (u.x === x && u.y === y) {
        return false;
      }
    }
    return true;
  }
  getRandomEmptyCell(): Coords | undefined {
    const shuffledIndices = this._getShuffledCellIndicies();
    for (let index of shuffledIndices) {
      const coords = math.indexToXY(index, config.BOARD_WIDTH);
      const isEmpy = this._isCellEmpty(coords);
      if (isEmpy) {
        return coords;
      }
    }
    // Returns undefined if there are no empty cells
    return undefined;
  }
  canUnitMoveIntoCell(cellX: number, cellY: number): boolean {
    for (let u of this.units) {
      // If a living unit is obstructing, do not allow movement
      if (u.alive && u.x === cellX && u.y === cellY) {
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
        this.syncYourTurnState();
        this.bringOutYerDead();
        break;
      case 'NPC':
        this.setYourTurn(false, "NPC's Turn");
        // Move units
        for (let u of this.units.filter((u) => u.unitType === 'AI')) {
          Unit.moveAI(u);
        }

        // If units are frozen, decrement the number of turns that they are frozen for
        // since a turn has passed
        for (let u of this.units) {
          if (u.frozenForTurns > 0) {
            u.frozenForTurns--;
            if (u.frozenForTurns <= 0) {
              u.image.removeSubSprite('frozen');
            }
          }
        }

        window.animationManager.startAnimate().then(() => {
          this.setTurnPhase(turn_phase.PlayerTurns);
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
      case 'GameOver':
        alert('GameOver');
        break;
      case 'Playing':
        if (elBoard) {
          elBoard.style.visibility = 'visible';
        }
        // Choose a random player index to start and immediately
        // increment to setup the turn state properly
        this.playerTurnIndex = this.random.integer(0, this.players.length - 1);
        // Initialize the player turn state
        this.syncYourTurnState();
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
  addUnitToArray(unit: Unit.IUnit) {
    this.units.push(unit);
  }
  removePickupFromArray(pickup: Pickup.IPickup) {
    this.pickups = this.pickups.filter((p) => p !== pickup);
  }
  addPickupToArray(pickup: Pickup.IPickup) {
    this.pickups.push(pickup);
  }
  cast(spell: Spell) {
    const { caster } = spell;
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
  sanitizeForSaving(): Game {
    return {
      ...this,
      players: this.players.map((p) => ({
        ...p,
        unit: {
          ...p.unit,
          image: {
            ...p.unit.image,
            subSprites: {
              // TODO, restore subSprites on load
            },
            sprite: null,
          },
        },
      })),
      units: this.units.map((u) => ({
        ...u,
        image: {
          ...u.image,
          subSprites: {
            // TODO, restore subSprites on load
          },
          sprite: null,
        },
      })),
      pickups: this.pickups.map((p) => ({
        ...p,
        image: {
          ...p.image,
          sprite: null,
        },
      })),
    };
  }
}
