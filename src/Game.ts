import * as config from './config';
import * as Unit from './Unit';
import * as Pickup from './Pickup';
import * as Player from './Player';
import type * as Upgrade from './Upgrade';
import * as math from './math';
import * as Card from './CardUI';
import * as Cards from './Cards';
import * as GameBoardInput from './ui/GameBoardInput';
import { MESSAGE_TYPES } from './MessageTypes';
import { addPixiSprite, app, containerBoard } from './PixiUtils';
import type { Random } from 'random';
import makeSeededRandom from './rand';
import floatingText from './FloatingText';
import { enemySource, generateHardCodedLevelEnemies } from './EnemyUnit';
import { UnitType, Coords, Faction } from './commonTypes';
import { drawDangerOverlay } from './ui/UserInterface';
import { createUpgradeElement, generateUpgrades } from './Upgrade';
import { onTurnSource } from './Events';

export enum game_state {
  Lobby,
  WaitingForPlayerReconnect,
  Playing,
  Upgrade,
  GameOver,
}
export enum turn_phase {
  PlayerTurns,
  NPC,
}
interface Bounds {
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
}
const elPlayerTurnIndicatorHolder = document.getElementById(
  'player-turn-indicator-holder',
);
const elPlayerTurnIndicator = document.getElementById('player-turn-indicator');
const elTurnTimeRemaining = document.getElementById('turn-time-remaining');
const elLevelIndicator = document.getElementById('level-indicator');
export default class Game {
  state: game_state;
  seed: string;
  random: Random;
  turn_phase: turn_phase;
  // A count of which turn it is, this is useful for
  // governing AI actions that occur every few turns
  // instead of every turn.  A "turn" is a full cycle,
  // meaning, players take their turn, npcs take their
  // turn, then it resets to player turn, that is a full "turn"
  turn_number: number = 0;
  height: number = config.BOARD_HEIGHT;
  width: number = config.BOARD_WIDTH;
  players: Player.IPlayer[] = [];
  units: Unit.IUnit[] = [];
  pickups: Pickup.IPickup[] = [];
  // The number of the current level
  level = 1;
  // The index of which player's turn it is
  playerTurnIndex: number = 0;
  secondsLeftForTurn: number = config.SECONDS_PER_TURN;
  yourTurn: boolean;
  turnInterval: any;
  hostClientId: string;
  // A set of clientIds who have ended their turn
  // Being a Set prevents a user from ending their turn more than once
  endedTurn = new Set<string>();
  choseUpgrade = new Set<string>();
  constructor(seed: string) {
    window.game = this;
    this.seed = seed;
    this.random = makeSeededRandom(this.seed);
    this.setGameState(game_state.Lobby);

    // Make sprites for the board tiles
    let cell;
    for (let x = 0; x < config.BOARD_WIDTH; x++) {
      for (let y = 0; y < config.BOARD_HEIGHT; y++) {
        cell = addPixiSprite('images/tiles/ground.png', containerBoard);
        cell.x = x * config.CELL_SIZE;
        cell.y = y * config.CELL_SIZE;
      }
    }

    // Limit turn duration
    this.turnInterval = setInterval(() => {
      if (this.turn_phase === turn_phase.PlayerTurns) {
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
    // Reset the endedTurn set so both players can take turns again
    this.endedTurn.clear();
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      // Clear all remaining AI units
      if (u.unitType === UnitType.AI) {
        Unit.cleanup(u);
        this.units.splice(i, 1);
      }
    }
    for (let p of this.players) {
      Player.resetPlayerForNextLevel(p);
    }
    // Clear all pickups
    for (let p of this.pickups) {
      Pickup.removePickup(p);
    }
    this.level++;
    // Show text in center of screen for the new level
    floatingText({
      cellX: config.BOARD_WIDTH / 2 - 0.5,
      cellY: config.BOARD_HEIGHT / 2,
      text: `Level ${this.level}`,
      style: {
        fill: 'white',
        fontSize: '60px',
      },
    });
    this.initLevel();
    this.setGameState(game_state.Playing);
  }

  initLevel() {
    // Update level indicator UI at top of screen
    elLevelIndicator.innerText = `Level ${this.level}`;
    // Add cards to hand
    for (let p of this.players) {
      for (let i = 0; i < config.GIVE_NUM_CARDS_PER_LEVEL; i++) {
        const card = Card.generateCard();
        Card.addCardToHand(card, p);
      }
    }
    for (let i = 0; i < config.NUM_PICKUPS_PER_LEVEL; i++) {
      const coords = this.getRandomEmptyCell({ xMin: 2 });
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
          true,
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
      true,
      portalPickup.effect,
    );
    // Spawn units at the start of the level
    const enemyIndexes = generateHardCodedLevelEnemies(this.level);
    for (let index of enemyIndexes) {
      const coords = this.getRandomEmptyCell({ xMin: 2 });
      if (coords) {
        const sourceUnit = enemySource[index];
        const unit = Unit.create(
          coords.x,
          coords.y,
          Faction.ENEMY,
          sourceUnit.image,
          UnitType.AI,
          sourceUnit.subtype,
        );
        const roll = this.random.integer(0, 100);
        if (roll <= config.PERCENT_CHANCE_OF_HEAVY_UNIT) {
          unit.healthMax = config.UNIT_BASE_HEALTH * 2;
          unit.health = unit.healthMax;
          unit.image.scale(1.0);
        }
      } else {
        console.error('Unit not spawned due to no empty cells');
      }
    }
  }
  checkPickupCollisions(unit: Unit.IUnit) {
    for (let pu of this.pickups) {
      if (unit.x == pu.x && unit.y == pu.y) {
        Pickup.triggerPickup(pu, unit);
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
    // If there are players who are able to take their turn
    if (this.players.filter(Player.ableToTakeTurn).length) {
      // If there are players who are able to take their turns, increment to the next
      this.playerTurnIndex = (this.playerTurnIndex + 1) % this.players.length;
      const nextTurnPlayer = this.players[this.playerTurnIndex];
      // If this current player is NOT able to take their turn...
      if (!Player.ableToTakeTurn(nextTurnPlayer)) {
        // Skip them
        this.endPlayerTurn(nextTurnPlayer.clientId);
      } else {
        // Trigger onTurnStart Events
        const onTurnStartEventResults: boolean[] = nextTurnPlayer.unit.onTurnStartEvents.map(
          (eventName) => {
            const fn = onTurnSource[eventName];
            return fn ? fn(nextTurnPlayer.unit) : false;
          },
        );
        if (onTurnStartEventResults.some((b) => b)) {
          // If any onTurnStartEvents return true, skip the player
          this.endPlayerTurn(nextTurnPlayer.clientId);
        } else {
          // Start the nextTurnPlayer's turn
          this.secondsLeftForTurn = config.SECONDS_PER_TURN;
          elPlayerTurnIndicatorHolder.classList.remove('low-time');
          this.syncYourTurnState();
          this.goToNextPhaseIfAppropriate();
        }
      }
    } else {
      this.checkForEndOfLevel();
    }
  }
  syncYourTurnState() {
    if (this.players[this.playerTurnIndex].clientId === window.clientId) {
      this.setYourTurn(true, 'Your Turn');
      // In the event that it becomes your turn but the mouse hasn't moved,
      // syncMouseHoverIcon needs to be called so that the icon ("footprints" for example)
      // will be shown in the tile that the mouse is hovering over
      GameBoardInput.syncMouseHoverIcon();
    } else {
      this.setYourTurn(false, "Other Player's Turn");
    }
  }
  // Sends a network message to end turn
  endMyTurn() {
    // Turns can only be manually ended during the PlayerTurns phase
    if (this.turn_phase === turn_phase.PlayerTurns) {
      window.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
    }
  }
  endPlayerTurn(clientId: string) {
    // Turns can only be ended when the game is in Playing state
    // and not, for example, in Upgrade state
    if (this.state === game_state.Playing) {
      const currentTurnPlayer = this.players[this.playerTurnIndex];
      // Ensure players can only end the turn when it IS their turn
      if (currentTurnPlayer.clientId === clientId) {
        this.endedTurn.add(clientId);
        this.incrementPlayerTurn();
      }
    }
  }
  chooseUpgrade(player: Player.IPlayer, upgrade: Upgrade.IUpgrade) {
    console.log(
      'TODO implement how the player is modified when an upgrade is added',
    );
    player.upgrades.push(upgrade);
    this.choseUpgrade.add(player.clientId);

    if (this.choseUpgrade.size >= this.players.length) {
      this.moveToNextLevel();
      this.choseUpgrade.clear();
    }
  }
  checkForEndOfLevel() {
    const areAllPlayersDead =
      this.players.filter((p) => p.unit.alive).length === 0;
    if (areAllPlayersDead) {
      this.setGameState(game_state.GameOver);
      return;
    }
    // Advance the level if all living players have entered the portal:
    const areAllLivingPlayersInPortal =
      this.players.filter((p) => p.unit.alive && p.inPortal).length ===
      this.players.filter((p) => p.unit.alive).length;
    if (areAllLivingPlayersInPortal) {
      // Now that level is complete, move to the Upgrade gamestate where players can choose upgrades
      // before moving on to the next level
      this.setGameState(game_state.Upgrade);
    }
  }
  // Generate an array of cell coordinates in shuffled order
  // between optional boundaries
  _getShuffledCoordinates({ xMin, xMax, yMin, yMax }: Bounds): Coords[] {
    const numberOfIndices = config.BOARD_WIDTH * config.BOARD_HEIGHT;
    const indices: number[] = [];
    // Populate an array with the 1-dimentional indices of the board
    // so if the board is 2x2, the array will be [0,1,2,3]
    for (let i = 0; i < numberOfIndices; i++) {
      indices.push(i);
    }
    // Now randomly remove indicies from that array and add them to a new array
    const shuffledIndices: Coords[] = [];
    for (let i = 0; i < numberOfIndices; i++) {
      const metaIndex = this.random.integer(0, indices.length);
      // pull chosen index out of the indices array so that it wont be picked next loop
      const pluckedIndex = indices.splice(metaIndex, 1)[0];
      if (pluckedIndex === undefined) {
        continue;
      }
      const coords = math.indexToXY(pluckedIndex, config.BOARD_WIDTH);
      // If plucked index is not within specified bounds continue
      if (xMin !== undefined && coords.x < xMin) {
        continue;
      }
      if (xMax !== undefined && coords.x > xMax) {
        continue;
      }
      if (yMin !== undefined && coords.y < yMin) {
        continue;
      }
      if (yMax !== undefined && coords.y > yMax) {
        continue;
      }
      // If coordinates are within specified bounds, or if there are not specified bounds,
      // add it to the list of shuffled coordinates
      shuffledIndices.push(coords);
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
  getRandomEmptyCell(bounds: Bounds): Coords | undefined {
    const shuffledCoords = this._getShuffledCoordinates(bounds);
    for (let coords of shuffledCoords) {
      const isEmpy = this._isCellEmpty(coords);
      // if cell if empty return the coords, if it's not loop to the next coords that may be empty
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
        this.turn_number++;
        for (let u of this.units) {
          // Reset thisTurnMoved flag now that it is a new turn
          // Because no units have moved yet this turn
          u.thisTurnMoved = false;
          u.intendedNextMove = undefined;
        }
        this.syncYourTurnState();
        break;
      case 'NPC':
        this.setYourTurn(false, "NPC's Turn");
        const animationPromises = [];
        // Move units
        unitloop: for (let u of this.units.filter(
          (u) => u.unitType === UnitType.AI && u.alive,
        )) {
          // Trigger onTurnStart Events
          for (let eventName of u.onTurnStartEvents) {
            const fn = onTurnSource[eventName];
            if (fn) {
              const abortTurn = fn(u);
              if (abortTurn) {
                continue unitloop;
              }
            }
          }
          const promise = Unit.moveAI(u);
          animationPromises.push(promise);
        }
        this.initiateIntelligentAIMovement();
        // When all animations are done, set turn phase to player turn
        Promise.all(animationPromises).then(() => {
          this.setTurnPhase(turn_phase.PlayerTurns);
        });

        // Since NPC turn is over, update the danger overlay
        // They may have moved or unfrozen which would update
        // which cells they can attack next turn
        drawDangerOverlay();
        break;
      default:
        break;
    }
  }
  initiateIntelligentAIMovement() {
    // This function ensures that all units who can move, do move, in the proper order
    // so, for example, three units next to each other all trying to move left can
    // all do so, regardless of the order that they are in in the units array
    const AIUnits = this.units.filter((u) => u.unitType === UnitType.AI);
    // Move all units who intend to move
    // Units who are obstructed will not move due to collision checks in Unit.moveTo
    AIUnits.filter((u) => !!u.intendedNextMove).forEach((u) => {
      Unit.moveTo(u, u.intendedNextMove);
    });
    // While there are units who intend to move but havent yet
    let remainingUnitsWhoIntendToMove = [];
    let previousUnmovedUnitCount = 0;
    do {
      previousUnmovedUnitCount = remainingUnitsWhoIntendToMove.length;
      remainingUnitsWhoIntendToMove = AIUnits.filter(
        (u) => !!u.intendedNextMove && !u.thisTurnMoved,
      );
      // Try moving them again
      remainingUnitsWhoIntendToMove.forEach((u) => {
        Unit.moveTo(u, u.intendedNextMove);
      });
    } while (
      remainingUnitsWhoIntendToMove.length &&
      // So long as the number of units who intend to move continues to change on the loop,
      // keep looping.  This will ensure that units that CAN move do, and as they move
      // they may free up space for other units to move.  But once these numbers are equal,
      // the units left that intend to move truly cannot.
      remainingUnitsWhoIntendToMove.length !== previousUnmovedUnitCount
    );
  }
  setGameState(g: game_state) {
    this.state = g;
    const state = game_state[this.state];
    const elBoard = document.getElementById('board');
    const elUpgradePicker = document.getElementById('upgrade-picker');
    elUpgradePicker.classList.remove('active');
    switch (state) {
      case 'GameOver':
        alert('GameOver');
        break;
      case 'Playing':
        if (elBoard) {
          elBoard.style.visibility = 'visible';
        }
        // Initialize the player turn state
        this.syncYourTurnState();
        // Set the first turn phase
        this.setTurnPhase(turn_phase.PlayerTurns);
        break;
      case 'Upgrade':
        if (elBoard) {
          elBoard.style.visibility = 'hidden';
        }
        elUpgradePicker.classList.add('active');
        const upgrades = generateUpgrades(
          this.players.find((p) => p.clientId === window.clientId),
        );
        const elUpgrades = upgrades.map(createUpgradeElement);
        elUpgradePicker.innerHTML = '';
        for (let elUpgrade of elUpgrades) {
          elUpgradePicker.appendChild(elUpgrade);
        }
        break;
      default:
        if (elBoard) {
          elBoard.style.visibility = 'hidden';
        }
    }
  }

  getCoordsWithinDistanceOfTarget(
    targetX: number,
    targetY: number,
    distance: number,
  ): Coords[] {
    const coords: Coords[] = [];
    for (let cellX = 0; cellX < config.BOARD_WIDTH; cellX++) {
      for (let cellY = 0; cellY < config.BOARD_HEIGHT; cellY++) {
        if (
          cellX <= targetX + distance &&
          cellX >= targetX - distance &&
          cellY <= targetY + distance &&
          cellY >= targetY - distance
        ) {
          coords.push({ x: cellX, y: cellY });
        }
      }
    }
    return coords;
  }
  getTouchingUnitsRecursive(
    x: number,
    y: number,
    ignore: Coords[] = [],
  ): Unit.IUnit[] {
    const touchingDistance = 1;
    let touching = this.units.filter((u) => {
      return (
        u.alive &&
        u.x <= x + touchingDistance &&
        u.x >= x - touchingDistance &&
        u.y <= y + touchingDistance &&
        u.y >= y - touchingDistance &&
        !ignore.find((i) => i.x == u.x && i.y == u.y)
      );
    });
    ignore = ignore.concat(touching.map((u) => ({ x: u.x, y: u.y })));
    for (let u of touching) {
      touching = touching.concat(
        this.getTouchingUnitsRecursive(u.x, u.y, ignore),
      );
    }
    return touching;
  }
  getUnitAt(x: number, y: number): Unit.IUnit | undefined {
    return this.units.find((u) => u.alive && u.x === x && u.y === y);
  }
  getPickupAt(x: number, y: number): Pickup.IPickup | undefined {
    return this.pickups.find((p) => p.x === x && p.y === y);
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
  // A cell is statically blocked if it does not exist or is occupied by something immovable
  isCellStaticallyBlocked(coordinates: Coords): boolean {
    const { x, y } = coordinates;
    // Out of map bounds is considered "obstructed"
    if (x < 0 || y < 0 || x >= config.BOARD_WIDTH || y >= config.BOARD_HEIGHT) {
      return true;
    }
    return false;
  }
  isCellObstructed(coordinates: Coords): boolean {
    if (this.isCellStaticallyBlocked(coordinates)) {
      return true;
    }
    const { x, y } = coordinates;
    // Cell is obstructed if it is already occupied by a unit
    for (let unit of this.units) {
      if (unit.alive && unit.x === x && unit.y === y) {
        return true;
      }
    }
    return false;
  }
  getTargetsOfCards(
    caster: Player.IPlayer,
    cards: string[],
    target: Coords,
  ): Coords[] {
    let targetOnlyCards = [];
    // TODO: optimize.  This converts from string to card back to string, just to filter for
    // card.onlyChangesTarget
    for (let cardId of cards) {
      const card = Cards.allCards.find((c) => c.id == cardId);
      if (card && card.onlyChangesTarget) {
        targetOnlyCards.push(card.id);
      }
    }
    const { targets } = this.castCards(caster, targetOnlyCards, target);
    return targets;
  }
  castCards(
    caster: Player.IPlayer,
    cards: string[],
    target: Coords,
  ): Cards.EffectState {
    let effectState = {
      caster,
      targets: [target],
      cards,
      aggregator: {},
    };
    if (!caster.unit.alive) {
      // Prevent dead players from casting
      return effectState;
    }
    for (let cardId of cards) {
      const card = Cards.allCards.find((c) => c.id == cardId);
      if (card) {
        effectState = card.effect(effectState);
      }
    }

    // Since units may have moved or become frozen, redraw the danger overlay which takes these
    // changes into consideration
    drawDangerOverlay();
    return effectState;
  }

  // animateSpellEffects(castInstances: { x: number; y: number; spell: Spell }[]) {
  //   // Show an image when cast occurs
  //   const images = castInstances.map(
  //     (i) => new Image(i.x, i.y, getImage(i.spell), containerSpells),
  //   );

  //   window.animationTimeline
  //     .addAnimation(
  //       images.map((i) => ({
  //         sprite: i.sprite,
  //         target: {
  //           scale: 1.5,
  //           alpha: 0,
  //         },
  //       })),
  //     )
  //     .then(() => {
  //       images.forEach((i) => i.cleanup());
  //     });
  // }

  // Returns only the properties that can be saved
  // callbacks and complicated objects such as PIXI.Sprites
  // are removed
  sanitizeForSaving(): Game {
    return {
      ...this,
      players: this.players.map((p) => ({
        ...p,
        unit: Unit.serializeUnit(p.unit),
      })),
      units: this.units.map(Unit.serializeUnit),
      pickups: this.pickups.map(Pickup.serialize),
    };
  }
}
