import PF from 'pathfinding';
import * as config from './config';
import * as Unit from './Unit';
import * as Pickup from './Pickup';
import * as Obstacle from './Obstacle';
import * as Player from './Player';
import type * as Upgrade from './Upgrade';
import * as math from './math';
import * as Cards from './cards';
import * as Image from './Image';
import * as GameBoardInput from './ui/GameBoardInput';
import { MESSAGE_TYPES } from './MessageTypes';
import {
  addPixiSprite,
  app,
  containerBoard,
  containerSpells,
  containerUI,
} from './PixiUtils';
import type { Random } from 'random';
import makeSeededRandom from './rand';
import floatingText from './FloatingText';
import { UnitType, Coords, Faction } from './commonTypes';
import { updatePlanningView } from './ui/UserInterface';
import { createUpgradeElement, generateUpgrades } from './Upgrade';
import Events from './Events';
import { allUnits, generateHardCodedLevelEnemies } from './units';

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
const elUpgradePickerLabel = document.getElementById('upgrade-picker-label');
const elUpgradePickerContent = document.getElementById(
  'upgrade-picker-content',
);
export default class Game {
  state: game_state = game_state.Lobby;
  seed: string;
  random: Random;
  turn_phase: turn_phase = turn_phase.PlayerTurns;
  // A count of which turn it is, this is useful for
  // governing AI actions that occur every few turns
  // instead of every turn.  A "turn" is a full cycle,
  // meaning, players take their turn, npcs take their
  // turn, then it resets to player turn, that is a full "turn"
  turn_number: number = -1;
  height: number = config.BOARD_HEIGHT;
  width: number = config.BOARD_WIDTH;
  players: Player.IPlayer[] = [];
  units: Unit.IUnit[] = [];
  pickups: Pickup.IPickup[] = [];
  obstacles: Obstacle.IObstacle[] = [];
  // The number of the current level
  level = 1;
  secondsLeftForTurn: number = config.SECONDS_PER_TURN;
  turnInterval: any;
  hostClientId: string = '';
  // A set of clientIds who have ended their turn
  // Being a Set prevents a user from ending their turn more than once
  endedTurn = new Set<string>();
  choseUpgrade = new Set<string>();

  pfGrid: PF.Grid;
  pfFinder: PF.BiBestFirstFinder;
  constructor(seed: string) {
    window.game = this;
    this.seed = seed;
    this.random = makeSeededRandom(this.seed);
    this.setGameState(game_state.Lobby);

    // Setup pathfinding
    this.pfGrid = new PF.Grid(config.BOARD_WIDTH, config.BOARD_HEIGHT);
    this.pfFinder = new PF.BiBestFirstFinder({
      diagonalMovement: PF.DiagonalMovement.Never,
    });

    // Make sprites for the board tiles
    let cell;
    for (let x = 0; x < config.BOARD_WIDTH; x++) {
      for (let y = 0; y < config.BOARD_HEIGHT; y++) {
        cell = addPixiSprite('tiles/ground.png', containerBoard);
        cell.x = x * config.CELL_SIZE;
        cell.y = y * config.CELL_SIZE;
      }
    }

    // Limit turn duration
    this.turnInterval = setInterval(() => {
      if (
        this.state === game_state.Playing &&
        this.turn_phase === turn_phase.PlayerTurns
      ) {
        this.secondsLeftForTurn--;
        if (this.secondsLeftForTurn <= 10) {
          elPlayerTurnIndicatorHolder &&
            elPlayerTurnIndicatorHolder.classList.add('low-time');
        }
        if (elTurnTimeRemaining) {
          elTurnTimeRemaining.innerText = `0:${
            this.secondsLeftForTurn < 10
              ? '0' + this.secondsLeftForTurn
              : this.secondsLeftForTurn
          }`;
        } else {
          console.error('elTurnTimeRemaining is null');
        }
        // Skip player turns if they run out of time
        if (this.secondsLeftForTurn <= 0) {
          console.log('Out of time, turn ended');
          this.endPlayerTurnPhase();
        }
      } else {
        if (elTurnTimeRemaining) {
          elTurnTimeRemaining.innerText = '';
        }
      }
    }, 1000);
  }
  cleanup() {
    clearInterval(this.turnInterval);
    for (let u of this.units) {
      Image.cleanup(u.image);
    }
    for (let x of this.pickups) {
      Image.cleanup(x.image);
    }
    for (let x of this.obstacles) {
      Image.cleanup(x.image);
    }
  }
  findPath(from: Coords, to: Coords): number[][] {
    try {
      return this.pfFinder.findPath(
        from.x,
        from.y,
        to.x,
        to.y,
        this.pfGrid.clone(),
      );
    } catch (e) {
      console.error(e);
      return [];
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
    // Clear all obstacles
    for (let o of this.obstacles) {
      Obstacle.remove(o);
    }
    this.level++;
    // Show text in center of screen for the new level
    floatingText({
      cell: {
        x: config.BOARD_WIDTH / 2 - 0.5,
        y: config.BOARD_HEIGHT / 2,
      },
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
    // Spawn portal
    const portalPickup = Pickup.specialPickups['portal.png'];
    Pickup.create(
      config.PORTAL_COORDINATES.x,
      config.PORTAL_COORDINATES.y,
      portalPickup.name,
      portalPickup.description,
      false,
      portalPickup.imagePath,
      true,
      portalPickup.effect,
    );
    // Update level indicator UI at top of screen
    if (elLevelIndicator) {
      elLevelIndicator.innerText = `Level ${this.level}`;
    } else {
      console.error('elLevelIndicator is null');
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
          pickup.name,
          pickup.description,
          true,
          pickup.imagePath,
          true,
          pickup.effect,
        );
      } else {
        console.error('Pickup not spawned due to no empty cells');
      }
    }
    for (let i = 0; i < config.NUM_OBSTACLES_PER_LEVEL; i++) {
      const coords = this.getRandomEmptyCell({ xMin: 2 });
      if (coords) {
        const randomIndex = this.random.integer(
          0,
          Obstacle.obstacleSource.length - 1,
        );
        const obstacle = Obstacle.obstacleSource[randomIndex];
        const newObstacle = Obstacle.create(coords.x, coords.y, obstacle);
        // Ensure the players have a path to the portal
        const pathToPortal = this.findPath(
          { x: 0, y: 0 },
          config.PORTAL_COORDINATES,
        );
        if (pathToPortal.length === 0) {
          Obstacle.remove(newObstacle);
        }
      } else {
        console.error('Obstacle not spawned due to no empty cells');
      }
    }
    // Spawn units at the start of the level
    const enemyIndexes = generateHardCodedLevelEnemies(this.level);
    for (let index of enemyIndexes) {
      const coords = this.getRandomEmptyCell({ xMin: 2 });
      if (coords) {
        const sourceUnit = Object.values(allUnits)[index];
        const unit = Unit.create(
          sourceUnit.id,
          coords.x,
          coords.y,
          Faction.ENEMY,
          sourceUnit.info.image,
          UnitType.AI,
          sourceUnit.info.subtype,
        );
        const roll = this.random.integer(0, 100);
        if (roll <= config.PERCENT_CHANCE_OF_HEAVY_UNIT) {
          unit.healthMax = config.UNIT_BASE_HEALTH * 2;
          unit.health = unit.healthMax;
          unit.damage = config.UNIT_BASE_DAMAGE * 2;
          unit.image.sprite.scale.set(0);
          Image.scale(unit.image, 1.0);
        } else {
          // Start images small and make them grow when they spawn in
          unit.image.sprite.scale.set(0);
          Image.scale(unit.image, 0.8);
        }
      } else {
        console.error('Unit not spawned due to no empty cells');
      }
    }
    // Since a new level changes the existing units, redraw the planningView in
    // the event that the planningView is active
    updatePlanningView();
  }
  checkPickupCollisions(unit: Unit.IUnit) {
    for (let pu of this.pickups) {
      if (unit.x == pu.x && unit.y == pu.y) {
        Pickup.triggerPickup(pu, unit);
      }
    }
  }
  handlePossibleCorpseCollision(unit: Unit.IUnit) {
    for (let u of this.units) {
      // If unit is colliding with a corpse, destroy the corpse
      if (!u.alive && u !== unit && unit.x == u.x && unit.y == u.y) {
        Unit.cleanup(u);
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
  goToNextPhaseIfAppropriate(): boolean {
    if (this.turn_phase === turn_phase.PlayerTurns) {
      // If all players that have taken turns, then...
      // (Players who CANT take turns have their turn ended automatically)
      if (
        this.players
          .filter(Player.ableToTakeTurn)
          .every((p) => this.endedTurn.has(p.clientId))
      ) {
        this.endPlayerTurnPhase();
        return true;
      }
    }
    return false;
  }
  endPlayerTurnPhase() {
    // Reset the endedTurn set so all players can take turns again next Cast phase
    this.endedTurn.clear();
    // Move onto next phase
    this.setTurnPhase(turn_phase.NPC);
  }
  setTurnMessage(yourTurn: boolean, message: string) {
    if (elPlayerTurnIndicator) {
      elPlayerTurnIndicator.innerText = message;
    }
    document.body.classList.toggle('your-turn', yourTurn);
  }
  initializePlayerTurns() {
    this.setTurnMessage(true, 'Your Turn');
    // Start the currentTurnPlayer's turn
    for (let player of this.players) {
      Player.checkForGetCardOnTurn(player);
      // If this current player is NOT able to take their turn...
      if (!Player.ableToTakeTurn(player)) {
        // Skip them
        this.endPlayerTurn(player.clientId);
        // Do not continue with initialization
        return;
      }
      // Trigger onTurnStart Events
      const onTurnStartEventResults: boolean[] = player.unit.onTurnStartEvents.map(
        (eventName) => {
          const fn = Events.onTurnSource[eventName];
          return fn ? fn(player.unit) : false;
        },
      );
      if (onTurnStartEventResults.some((b) => b)) {
        // If any onTurnStartEvents return true, skip the player
        this.endPlayerTurn(player.clientId);
        // Do not continue with initialization
        return;
      }

      // Finally initialize their turn
      this.secondsLeftForTurn = config.SECONDS_PER_TURN;
      if (elPlayerTurnIndicatorHolder) {
        elPlayerTurnIndicatorHolder.classList.remove('low-time');
      }
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
      // Ensure players can only end the turn when it IS their turn
      if (this.turn_phase === turn_phase.PlayerTurns) {
        if (clientId === window.clientId) {
          this.setTurnMessage(false, 'Waiting on others');
        }
        this.endedTurn.add(clientId);
        const wentToNextLevel = this.checkForEndOfLevel();
        if (wentToNextLevel) {
          return;
        }
        const wentToNextPhase = this.goToNextPhaseIfAppropriate();
        if (wentToNextPhase) {
          return;
        }
      }
    }
  }
  chooseUpgrade(player: Player.IPlayer, upgrade: Upgrade.IUpgrade) {
    upgrade.effect(player);
    player.upgrades.push(upgrade);
    this.choseUpgrade.add(player.clientId);
    // Clear upgrade choices once one is chosen
    if (player.clientId === window.clientId) {
      if (elUpgradePickerContent) {
        elUpgradePickerContent.innerHTML = '';
      }
    }

    const numberOfPlayersWhoNeedToChooseUpgradesTotal = this.players.filter(
      (p) => p.clientConnected,
    ).length;
    if (this.choseUpgrade.size >= numberOfPlayersWhoNeedToChooseUpgradesTotal) {
      this.moveToNextLevel();
      this.choseUpgrade.clear();
      if (elUpgradePickerLabel) {
        elUpgradePickerLabel.innerText = '';
      }
    } else {
      if (elUpgradePickerLabel) {
        elUpgradePickerLabel.innerText = `${
          numberOfPlayersWhoNeedToChooseUpgradesTotal - this.choseUpgrade.size
        } players left to pick upgrades`;
      }
    }
  }
  // Returns true if game is over
  checkForGameOver(): boolean {
    const areAllPlayersDead =
      this.players.filter((p) => p.unit.alive && p.clientConnected).length ===
      0;
    if (areAllPlayersDead) {
      this.setGameState(game_state.GameOver);
      return true;
    } else {
      return false;
    }
  }
  // Returns true if it goes to the next level
  checkForEndOfLevel(): boolean {
    // All living (and client connected) players
    const livingPlayers = this.players.filter(
      (p) => p.unit.alive && p.clientConnected,
    );
    const areAllLivingPlayersInPortal =
      livingPlayers.filter((p) => p.inPortal).length === livingPlayers.length;
    // Advance the level if there are living players and they all are in the portal:
    if (livingPlayers.length && areAllLivingPlayersInPortal) {
      // Now that level is complete, move to the Upgrade gamestate where players can choose upgrades
      // before moving on to the next level
      this.setGameState(game_state.Upgrade);
      // Return of true signifies it went to the next level
      return true;
    }
    return false;
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
  isCellEmpty({ x, y }: Coords): boolean {
    // Test for units in cell
    for (let u of this.units) {
      if (u.x === x && u.y === y) {
        return false;
      }
    }
    // Test for pickups
    for (let u of this.pickups) {
      if (u.x === x && u.y === y) {
        return false;
      }
    }
    // Test for obstacles
    for (let o of this.obstacles) {
      if (o.x === x && o.y === y) {
        return false;
      }
    }
    return true;
  }
  getRandomEmptyCell(bounds: Bounds): Coords {
    const shuffledCoords = this._getShuffledCoordinates(bounds);
    for (let coords of shuffledCoords) {
      const isEmpy = this.isCellEmpty(coords);
      // if cell if empty return the coords, if it's not loop to the next coords that may be empty
      if (isEmpy) {
        return coords;
      }
    }
    throw new Error('Could not find random empty cell');
  }
  setTurnPhase(p: turn_phase) {
    // Before the turn phase changes, check if the game should transition to game over
    if (this.checkForGameOver()) {
      return;
    }
    this.turn_phase = p;

    // Remove all phase classes from body
    for (let phaseClass of document.body.classList.values()) {
      if (phaseClass.includes('phase-')) {
        document.body.classList.remove(phaseClass);
      }
    }

    // Clean up invalid units
    const keepUnits = [];
    for (let u of this.units) {
      if (u.flaggedForRemoval) {
        this.setWalkableAt(u, true);
      } else {
        keepUnits.push(u);
      }
    }
    this.units = keepUnits;

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
        // Lastly, initialize the player turns.
        // Note, it is possible that calling this will immediately end
        // the player phase (if there are no players to take turns)
        this.initializePlayerTurns();
        break;
      case 'NPC':
        this.setTurnMessage(false, "NPC's Turn");
        let animationPromises: Promise<void>[] = [];
        // Move units
        unitloop: for (let u of this.units.filter(
          (u) => u.unitType === UnitType.AI && u.alive,
        )) {
          // Trigger onTurnStart Events
          for (let eventName of u.onTurnStartEvents) {
            const fn = Events.onTurnSource[eventName];
            if (fn) {
              const abortTurn = fn(u);
              if (abortTurn) {
                continue unitloop;
              }
            }
          }
          const unitSource = allUnits[u.unitSourceId];
          if (unitSource) {
            // Add unit action to the array of promises to wait for
            let promise = unitSource.action(u);
            animationPromises.push(promise);
          } else {
            console.error(
              'Could not find unit source data for',
              u.unitSourceId,
            );
          }
        }
        // Wait for units to finish moving
        animationPromises = animationPromises.concat(
          this.initiateIntelligentAIMovement(),
        );
        // When all animations are done, set turn phase to player turn
        Promise.all(animationPromises).then(() => {
          this.setTurnPhase(turn_phase.PlayerTurns);
        });

        // Since NPC turn is over, update the planningView
        // They may have moved or unfrozen which would update
        // which cells they can attack next turn
        updatePlanningView();
        console.log('end switch to NPC turn');
        break;
      default:
        break;
    }
  }
  initiateIntelligentAIMovement(): Promise<void>[] {
    let promises: Promise<void>[] = [];
    // This function ensures that all units who can move, do move, in the proper order
    // so, for example, three units next to each other all trying to move left can
    // all do so, regardless of the order that they are in in the units array
    const AIUnits = this.units.filter((u) => u.unitType === UnitType.AI);
    // Move all units who intend to move
    // Units who are obstructed will not move due to collision checks in Unit.moveTo
    AIUnits.filter((u) => u.intendedNextMove !== undefined).forEach((u) => {
      if (u.intendedNextMove) {
        promises.push(Unit.moveTo(u, u.intendedNextMove));
      }
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
        if (u.intendedNextMove) {
          promises.push(Unit.moveTo(u, u.intendedNextMove));
        }
      });
    } while (
      remainingUnitsWhoIntendToMove.length &&
      // So long as the number of units who intend to move continues to change on the loop,
      // keep looping.  This will ensure that units that CAN move do, and as they move
      // they may free up space for other units to move.  But once these numbers are equal,
      // the units left that intend to move truly cannot.
      remainingUnitsWhoIntendToMove.length !== previousUnmovedUnitCount
    );
    return promises;
  }
  setGameState(g: game_state) {
    this.state = g;
    const state = game_state[this.state];
    const elBoard = document.getElementById('board');
    const elUpgradePicker = document.getElementById('upgrade-picker');
    elUpgradePicker && elUpgradePicker.classList.remove('active');
    switch (state) {
      case 'GameOver':
        alert('GameOver');
        break;
      case 'Playing':
        if (elBoard) {
          elBoard.style.visibility = 'visible';
        }
        // Set the first turn phase
        this.setTurnPhase(turn_phase.PlayerTurns);
        break;
      case 'Upgrade':
        if (elBoard) {
          elBoard.style.visibility = 'hidden';
        }
        elUpgradePicker && elUpgradePicker.classList.add('active');
        const player = this.players.find((p) => p.clientId === window.clientId);
        if (player) {
          const upgrades = generateUpgrades(player);
          const elUpgrades = upgrades.map(createUpgradeElement);
          if (elUpgradePickerContent) {
            elUpgradePickerContent.innerHTML = '';
            for (let elUpgrade of elUpgrades) {
              elUpgradePickerContent.appendChild(elUpgrade);
            }
          }
        } else {
          console.error('Upgrades cannot be generated, player not found');
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
  getUnitAt(cell: Coords): Unit.IUnit | undefined {
    return this.units.find((u) => u.x === cell.x && u.y === cell.y);
  }
  getPickupAt(cell: Coords): Pickup.IPickup | undefined {
    return this.pickups.find((p) => p.x === cell.x && p.y === cell.y);
  }
  getObstacleAt(cell: Coords): Obstacle.IObstacle | undefined {
    return this.obstacles.find((p) => p.x === cell.x && p.y === cell.y);
  }
  addUnitToArray(unit: Unit.IUnit) {
    this.units.push(unit);
    this.setWalkableAt(unit, false);
  }
  removePickupFromArray(pickup: Pickup.IPickup) {
    this.pickups = this.pickups.filter((p) => p !== pickup);
  }
  addPickupToArray(pickup: Pickup.IPickup) {
    this.pickups.push(pickup);
  }
  removeObstacleFromArray(obstacle: Obstacle.IObstacle) {
    this.obstacles = this.obstacles.filter((o) => o !== obstacle);
    this.setWalkableAt(obstacle, true);
  }
  addObstacleToArray(o: Obstacle.IObstacle) {
    this.obstacles.push(o);
    this.setWalkableAt(o, false);
  }
  // A cell is statically blocked if it does not exist or is occupied by something immovable
  isCellStaticallyBlocked(coordinates: Coords): boolean {
    const { x, y } = coordinates;
    // Out of map bounds is considered "obstructed"
    if (x < 0 || y < 0 || x >= config.BOARD_WIDTH || y >= config.BOARD_HEIGHT) {
      return true;
    }
    // Obstacles statically block cells
    for (let o of this.obstacles) {
      if (o.x === x && o.y === y) {
        return true;
      }
    }

    return false;
  }
  isCellObstructed(coordinates: Coords): boolean {
    if (this.isCellStaticallyBlocked(coordinates)) {
      return true;
    }
    const { x, y } = coordinates;
    // Cell is obstructed if it is already occupied by a living unit
    // note: corpses do not obstruct because they are destroyed when walked on
    for (let unit of this.units) {
      if (unit.alive && unit.x === x && unit.y === y) {
        return true;
      }
    }
    return false;
  }
  async castCards(
    caster: Player.IPlayer,
    cards: string[],
    target: Coords,
    dryRun: boolean,
  ): Promise<Cards.EffectState> {
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
    let cardsToLoop = effectState.cards;
    for (let index = 0; index < cardsToLoop.length; index++) {
      const cardId = cardsToLoop[index];
      const card = Cards.allCards.find((c) => c.id == cardId);
      const animationPromises = [];
      if (card) {
        // Show the card that's being cast:
        if (!dryRun) {
          const image = Image.create(
            target.x,
            target.y,
            card.thumbnail,
            containerUI,
          );
          // image.sprite.alpha = 0.5;
          image.sprite.scale.set(1.0);
          const scaleAnimation = Image.scale(image, 2.0).then(() => {
            Image.cleanup(image);
          });
          animationPromises.push(scaleAnimation);
        }
        const { targets: previousTargets } = effectState;
        effectState = await card.effect(effectState, dryRun, index);
        // Update cardsToLoop (some cards can change the following cards)
        cardsToLoop = effectState.cards;
        // Clear images from previous card before drawing the images from the new card
        containerSpells.removeChildren();
        // Animate target additions:
        for (let target of effectState.targets) {
          // If already included target:
          if (
            previousTargets.find((t) => t.x === target.x && t.y === target.y)
          ) {
            // Don't animate previous targets, they should be drawn full, immediately
            animationPromises.push(drawTarget(target.x, target.y, false));
          } else {
            // If a new target, animate it in
            animationPromises.push(drawTarget(target.x, target.y, !dryRun));
          }
        }
        await Promise.all(animationPromises);
      }
    }
    if (!dryRun) {
      // Clear spell animations once all cards are done playing their animations
      containerSpells.removeChildren();
    }

    // Since units may have moved or become frozen, redraw the planningView which takes these
    // changes into consideration
    updatePlanningView();
    return effectState;
  }

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
      obstacles: this.obstacles.map(Obstacle.serialize),
    };
  }
  setWalkableAt(coords: Coords, walkable: boolean) {
    // Protect against trying to setWalkable for invalid coordinates
    if (0 <= coords.x && coords.x < this.pfGrid.width) {
      if (0 <= coords.y && coords.y < this.pfGrid.height) {
        this.pfGrid.setWalkableAt(coords.x, coords.y, walkable);
      }
    }
  }
}

function drawTarget(x: number, y: number, animate: boolean): Promise<void> {
  const image = Image.create(x, y, 'target.png', containerSpells);
  if (animate) {
    image.sprite.scale.set(0.0);
    return Image.scale(image, 1.0);
  } else {
    return Promise.resolve();
  }
}
