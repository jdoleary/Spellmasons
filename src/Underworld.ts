import * as PIXI from 'pixi.js';
import seedrandom from 'seedrandom';
import * as config from './config';
import * as Unit from './Unit';
import * as Pickup from './Pickup';
import * as Obstacle from './Obstacle';
import * as Player from './Player';
import type * as Upgrade from './Upgrade';
import * as math from './math';
import * as Cards from './cards';
import * as Image from './Image';
import { MESSAGE_TYPES } from './MessageTypes';
import {
  app,
  containerBoard,
  containerDodads,
  containerSpells,
  containerUI,
} from './PixiUtils';
import floatingText, { orderedFloatingText } from './FloatingText';
import { UnitType, Faction } from './commonTypes';
import type { Vec2 } from "./Vec";
import * as Vec from "./Vec";
import Events from './Events';
import { allUnits } from './units';
import { drawDryRunCircle, syncSpellEffectProjection, updateManaCostUI, updatePlanningView } from './ui/PlanningView';
import { setRoute, Route } from './routes';
import { prng, randInt, SeedrandomState } from './rand';
import { calculateCost } from './cards/cardUtils';
import { lineSegmentIntersection, LineSegment } from './collision/collisionMath';
import { expandPolygon, mergeOverlappingPolygons, Polygon, PolygonLineSegment, polygonToPolygonLineSegments } from './Polygon';
import { findPath, findPolygonsThatVec2IsInsideOf } from './Pathfinding';

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
const elPlayerTurnIndicator = document.getElementById('player-turn-indicator');
const elLevelIndicator = document.getElementById('level-indicator');

export default class Underworld {
  seed: string;
  random: prng;
  // The index of the level the players are on
  levelIndex: number = -1;
  // for serializing random: prng
  RNGState?: SeedrandomState;
  turn_phase: turn_phase = turn_phase.PlayerTurns;
  // Index of the player whose turn it is
  playerTurnIndex: number = 0;
  // A count of which turn it is, this is useful for
  // governing AI actions that occur every few turns
  // instead of every turn.  A "turn" is a full cycle,
  // meaning, players take their turn, npcs take their
  // turn, then it resets to player turn, that is a full "turn"
  turn_number: number = -1;
  height: number = config.MAP_HEIGHT;
  width: number = config.MAP_WIDTH;
  players: Player.IPlayer[] = [];
  units: Unit.IUnit[] = [];
  pickups: Pickup.IPickup[] = [];
  obstacles: Obstacle.IObstacle[] = [];
  walls: LineSegment[] = [];
  pathingPolygons: Polygon[] = [];
  playersWhoHaveChosenUpgrade: string[] = [];
  // Keeps track of how many messages have been processed so that clients can
  // know when they've desynced.  Only used for syncronous message processing
  // since only the syncronous messages affect gamestate.
  processedMessageCount: number = 0;
  validPlayerSpawnCoords: Vec2[] = [];

  constructor(seed: string, RNGState: SeedrandomState | boolean = true) {
    window.underworld = this;
    this.seed = seed;
    console.log("RNG create with seed:", seed, ", state: ", RNGState);
    this.random = this.syncronizeRNG(RNGState);

    const mapGraphics = new PIXI.Graphics();
    containerBoard.addChild(mapGraphics);
    mapGraphics.lineStyle(3, 0x000000, 1);
    mapGraphics.beginFill(0x795644, 1);
    mapGraphics.drawRect(0, 0, config.MAP_WIDTH, config.MAP_HEIGHT);
    mapGraphics.endFill();
  }
  syncronizeRNG(RNGState: SeedrandomState | boolean) {
    // state of "true" initializes the RNG with the ability to save it's state,
    // state of a state object, rehydrates the RNG to a particular state
    this.random = seedrandom(this.seed, { state: RNGState })
    return this.random;
  }
  gameLoopUnits() {
    if (window.route !== Route.Underworld) {
      return;
    }
    window.unitOverlayGraphics.clear();
    const aliveUnits = this.units.filter(u => u.alive);
    for (let u of aliveUnits) {
      if (u.path && u.path.length) {
        // Move towards target
        const stepTowardsTarget = math.getCoordsAtDistanceTowardsTarget(u, u.path[0], u.moveSpeed)
        const moveDist = math.distance(u, stepTowardsTarget);
        u.x = stepTowardsTarget.x;
        u.y = stepTowardsTarget.y;
        u.distanceMovedThisTurn += moveDist;
        if (Vec.equal(u, u.path[0])) {
          // Once the unit reaches the target, shift so the next point in the path is the next target
          u.path.shift();
        }
        // Stop moving if you've moved as far as you can based on the move distance
        if (u.distanceMovedThisTurn >= u.moveDistance) {
          u.path = [];
        }
        // check for collisions with pickups in new location
        this.checkPickupCollisions(u);
      }
      // Sync Image even for non moving units since they may be moved by forces other than themselves
      Unit.syncImage(u)
      // Ensure that resolveDoneMoving is invoked when there are no points left in the path
      // This is necessary to end the moving units turn because elsewhere we are awaiting the fulfillment of that promise
      // to know they are done moving
      if (u.path.length === 0) {
        u.resolveDoneMoving();
      }
      // Draw unit overlay graphics
      //--
      // Prevent drawing unit overlay graphics when a unit is in the portal
      if (u.x !== null && u.y !== null) {
        // Draw health bar
        window.unitOverlayGraphics.beginFill(0xd55656, 1.0);
        window.unitOverlayGraphics.drawRect(
          u.x - config.UNIT_UI_BAR_WIDTH / 2,
          u.y - config.COLLISION_MESH_RADIUS - config.UNIT_UI_BAR_HEIGHT,
          config.UNIT_UI_BAR_WIDTH * u.health / u.healthMax,
          config.UNIT_UI_BAR_HEIGHT);
        // Draw mana bar
        if (u.manaMax != 0) {
          window.unitOverlayGraphics.beginFill(0x5656d5, 1.0);
          window.unitOverlayGraphics.drawRect(
            u.x - config.UNIT_UI_BAR_WIDTH / 2,
            u.y - config.COLLISION_MESH_RADIUS,
            config.UNIT_UI_BAR_WIDTH * Math.min(1, u.mana / u.manaMax),
            config.UNIT_UI_BAR_HEIGHT);
        }
        window.unitOverlayGraphics.endFill();
      }
    }

    // Invoke gameLoopUnits again next loop
    requestAnimationFrame(this.gameLoopUnits.bind(this))
  }
  // Returns true if it is the current players turn
  isMyTurn() {
    return window.underworld.turn_phase == turn_phase.PlayerTurns
      && window.underworld.playerTurnIndex === window.underworld.players.findIndex(p => p === window.player)
  }
  // Caution: Be careful when changing clean up code.  There are times when you just want to
  // clean up assets and then there are times when you want to clear and empty the arrays
  // Be sure not to confuse them.
  // cleanup cleans up all assets that must be manually removed (for now `Image`s)
  // if an object stops being used.  It does not empty the underworld arrays, by design.
  cleanup() {
    // Clean up body classes
    document.body.classList.remove(`route-${Route[window.route]}`);
    // Remove all phase classes from body
    for (let phaseClass of document.body.classList.values()) {
      if (phaseClass.includes('phase-')) {
        document.body.classList.remove(phaseClass);
      }
    }
    document.body.classList.remove('your-turn');

    // Note: Player's unit image is cleaned up below where it also has a reference in this.units
    for (let u of this.units) {
      Image.cleanup(u.image);
    }
    for (let x of this.pickups) {
      Image.cleanup(x.image);
    }
    for (let x of this.obstacles) {
      Image.cleanup(x.image);
    }
    // Prevent requestAnimationFrame from calling this method next time
    this.gameLoopUnits = () => { };
  }
  // cacheWalls updates underworld.walls array
  // with the walls for the edge of the map
  // and the walls from the current obstacles
  // TODO:  this will need to be called if objects become
  // destructable
  cacheWalls() {
    const mapBounds: Polygon = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: config.MAP_HEIGHT },
        { x: config.MAP_WIDTH, y: config.MAP_HEIGHT },
        { x: config.MAP_WIDTH, y: 0 },
      ], inverted: true
    };
    const collidablePolygons = [...this.obstacles.map(o => o.bounds), mapBounds];
    this.walls = collidablePolygons.map(polygonToPolygonLineSegments).flat()

    // Save the pathing walls for the underworld
    const expandedAndMergedPolygons = mergeOverlappingPolygons(collidablePolygons.map(p => expandPolygon(p, config.COLLISION_MESH_RADIUS)));
    this.pathingPolygons = expandedAndMergedPolygons
  }
  spawnPickup(index: number, coords: Vec2) {
    const pickup = Pickup.pickups[index];
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
  }
  spawnEnemy(id: string, coords: Vec2) {
    const sourceUnit = allUnits[id];
    if (!sourceUnit) {
      console.error('Unit with id', id, 'does not exist');

    }
    let unit: Unit.IUnit = Unit.create(
      sourceUnit.id,
      coords.x,
      coords.y,
      Faction.ENEMY,
      sourceUnit.info.image,
      UnitType.AI,
      sourceUnit.info.subtype,
      sourceUnit.unitProps
    );

    const roll = randInt(this.random, 0, 100);
    if (roll <= config.PERCENT_CHANCE_OF_HEAVY_UNIT) {
      unit.healthMax = config.UNIT_BASE_HEALTH * 2;
      unit.health = unit.healthMax;
      unit.damage = config.UNIT_BASE_DAMAGE * 2;
      unit.radius = config.COLLISION_MESH_RADIUS;
      // Set image to "heavy" size
      unit.image.sprite.scale.set(1.0);
    }

  }

  initLevel(levelIndex: number): void {
    this.levelIndex = levelIndex;
    // Now that it's a new level clear out the level's dodads such as
    // bone dust left behind from destroyed corpses
    containerDodads.removeChildren();
    console.log('Setup: initLevel', levelIndex);
    // Clean previous level info
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      // Clear all remaining AI units
      if (u.unitType === UnitType.AI) {
        Unit.cleanup(u);
        this.units.splice(i, 1);
      }
    }
    if (this.players.length == 0) {
      console.error('Attempting to initialize level without any players');

    }
    // Clear all pickups
    for (let p of this.pickups) {
      Pickup.removePickup(p);
    }
    // Clear all obstacles
    for (let o of this.obstacles) {
      Obstacle.remove(o);
    }
    // Update level indicator UI at top of screen
    if (elLevelIndicator) {
      elLevelIndicator.innerText = `Altitude ${this.levelIndex}`;
    } else {
      console.error('elLevelIndicator is null');
    }

    let validSpawnCoords: Vec2[] = [];
    this.validPlayerSpawnCoords = [];
    let validPortalSpawnCoords: Vec2[] = [];
    // The map is made of a matrix of obstacle sectors
    for (let i = 0; i < config.OBSTACLE_SECTORS_COUNT_HORIZONTAL; i++) {
      for (let j = 0; j < config.OBSTACLE_SECTORS_COUNT_VERTICAL; j++) {
        const randomSectorIndex = randInt(this.random,
          0,
          Obstacle.obstacleSectors.length - 1,
        );
        // Now that we have the obstacle sector's horizontal index (i) and vertical index (j),
        // choose a pre-defined sector and spawn the obstacles
        for (let Y = 0; Y < Obstacle.obstacleSectors[randomSectorIndex].length; Y++) {
          const rowOfObstacles = Obstacle.obstacleSectors[randomSectorIndex][Y];
          for (let X = 0; X < rowOfObstacles.length; X++) {
            const coordX = config.OBSTACLE_SIZE * config.OBSTACLES_PER_SECTOR_WIDE * i + config.OBSTACLE_SIZE * X + config.COLLISION_MESH_RADIUS;
            const coordY = config.OBSTACLE_SIZE * config.OBSTACLES_PER_SECTOR_WIDE * j + config.OBSTACLE_SIZE * Y + config.COLLISION_MESH_RADIUS;
            const obstacleIndex = rowOfObstacles[X];
            if (obstacleIndex == 0) {
              // Empty, no obstacle, take this opportunity to spawn something from the spawn list, since
              // we know it is a safe place to spawn
              if (i == 0 && X == 0) {
                // Only spawn players in the left most index (X == 0) of the left most obstacle (i==0)
                const margin = 0;
                this.validPlayerSpawnCoords.push({ x: coordX + margin, y: coordY });
              } else if (i == config.OBSTACLE_SECTORS_COUNT_HORIZONTAL - 1 && X == rowOfObstacles.length - 1) {
                // Only spawn the portal in the right most index of the right most obstacle
                validPortalSpawnCoords.push({ x: coordX, y: coordY });
              } else {
                // Spawn pickups or units in any validSpawnCoord
                validSpawnCoords.push({ x: coordX, y: coordY });
              }
              continue
            }
            // -1 to let 0 be empty (no obstacle) and 1 will be index 0 of
            // obstacleSource
            const obstacle = Obstacle.obstacleSource[obstacleIndex - 1];
            Obstacle.create(coordX, coordY, obstacle);

          }

        }
      }
    }
    // Now that obstacles have been generated, we must cache the walls so pathfinding will work
    this.cacheWalls();

    // Remove bad spawns.  This can happen if an empty space is right next to the border of the map with obstacles
    // all around it.  There is no obstacle there, but there is also no room to move because the spawn location 
    // is inside of an inverted polygon.
    this.validPlayerSpawnCoords = this.validPlayerSpawnCoords.filter(c => findPolygonsThatVec2IsInsideOf(c, this.pathingPolygons).length === 0);
    validPortalSpawnCoords = validPortalSpawnCoords.filter(c => findPolygonsThatVec2IsInsideOf(c, this.pathingPolygons).length === 0);
    validSpawnCoords = validSpawnCoords.filter(c => findPolygonsThatVec2IsInsideOf(c, this.pathingPolygons).length === 0);

    // Spawn portal
    const index = randInt(this.random, 0, validPortalSpawnCoords.length - 1);
    const portalCoords = validPortalSpawnCoords.splice(index, 1)[0];
    if (!portalCoords) {
      console.error('Bad level seed, not enough valid spawns for portal, regenerating');
      return this.initLevel(this.levelIndex);
    }
    const portalPickup = Pickup.specialPickups['portal.png'];
    Pickup.create(
      portalCoords.x,
      portalCoords.y,
      portalPickup.name,
      portalPickup.description,
      false,
      portalPickup.imagePath,
      true,
      portalPickup.effect,
    );

    // Exclude player spawn coords that cannot path to the portal
    this.validPlayerSpawnCoords = this.validPlayerSpawnCoords.filter(spawn => {
      const path = findPath(spawn, portalCoords, this.pathingPolygons);
      return path.length != 0 && Vec.equal(path[path.length - 1], portalCoords);
    });

    if (this.validPlayerSpawnCoords.length === 0) {
      console.error('Bad level seed, no place to spawn portal, regenerating');
      return this.initLevel(this.levelIndex);
    }

    for (let i = 0; i < config.NUM_PICKUPS_PER_LEVEL; i++) {
      if (validSpawnCoords.length == 0) { break; }
      const randomPickupIndex = randInt(this.random,
        0,
        Object.values(Pickup.pickups).length - 1,
      );
      const validSpawnCoordsIndex = randInt(this.random, 0, validSpawnCoords.length - 1);
      const coords = validSpawnCoords.splice(validSpawnCoordsIndex, 1)[0];
      this.spawnPickup(randomPickupIndex, coords);
    }
    // Spawn units at the start of the level
    const enemys = getEnemiesForAltitude(levelIndex);
    for (let [id, count] of Object.entries(enemys)) {
      for (let i = 0; i < (count || 0); i++) {
        if (validSpawnCoords.length == 0) { break; }
        const validSpawnCoordsIndex = randInt(this.random, 0, validSpawnCoords.length - 1);
        const coords = validSpawnCoords.splice(validSpawnCoordsIndex, 1)[0];
        this.spawnEnemy(id, coords);
      }
    }

    if (this.validPlayerSpawnCoords.length >= this.players.length) {
      for (let player of this.players) {
        Player.resetPlayerForNextLevel(player);
      }
    } else {
      console.error('Bad level seed, not enough valid spawns for players, regenerating', this.validPlayerSpawnCoords.length, this.players.length);
      return this.initLevel(this.levelIndex);
    }

    // Since a new level changes the existing units, redraw the planningView in
    // the event that the planningView is active
    updatePlanningView();

    // Go to underworld, now that level is ready
    setRoute(Route.Underworld);

    // Show text in center of screen for the new level
    orderedFloatingText(
      `Altitude ${this.levelIndex}`,
      'white',
    );
  }
  checkPickupCollisions(unit: Unit.IUnit) {
    for (let pu of this.pickups) {
      if (math.distance(unit, pu) <= Pickup.PICKUP_RADIUS) {
        Pickup.triggerPickup(pu, unit);
      }
    }
  }
  getMousePos(): Vec2 {
    const { x, y } = containerBoard.toLocal(
      app.renderer.plugins.interaction.mouse.global,
    );
    return { x, y };
  }
  goToNextPhaseIfAppropriate(): boolean {
    if (this.turn_phase === turn_phase.PlayerTurns) {
      // If all players that have taken turns, then...
      // (Players who CANT take turns have their turn ended automatically)
      if (
        this.playerTurnIndex >= this.players.length
      ) {
        this.endPlayerTurnPhase();
        return true;
      }
    }
    return false;
  }
  endPlayerTurnPhase() {
    // Move onto next phase
    this.setTurnPhase(turn_phase.NPC);
    // Add mana to AI units
    for (let unit of this.units.filter((u) => u.unitType === UnitType.AI && u.alive)) {
      unit.mana += unit.manaPerTurn;
      // Cap manaPerTurn at manaMax
      unit.mana = Math.min(unit.mana, unit.manaMax);
    }
    // Decrement card usage counts,
    // This makes spells less expensive
    for (let p of this.players) {
      for (let cardId of p.cards) {
        // Decrement, cap at 0
        if (p.cardUsageCounts[cardId] !== undefined) {
          p.cardUsageCounts[cardId] = Math.max(0, p.cardUsageCounts[cardId] - 1);
        }
      }
    }
    updateManaCostUI();
  }
  hostSendSync() {
    // Only the host should send sync data to clients
    if (window.hostClientId === window.clientId) {
      window.pie.sendData({
        type: MESSAGE_TYPES.SYNC,
        players: this.players.map(Player.serialize),
        units: this.units.map(Unit.serialize),
        underworldPartial: this.serializeForSyncronize()
      })
    }
  }
  endNPCTurnPhase() {
    // Move onto next phase
    // --
    // Note: The reason this logic happens here instead of in setTurnPhase
    // is because setTurnPhase needs to be called on game load to put everything
    // in a good state when updating to the canonical client's game state. (this 
    // happens when one client disconnects and rejoins).  If playerTurnIndex were
    // reset in setTurnPhase, a client reconnecting would also reset the 
    // playerTurnIndex (which is not desireable because it's trying to LOAD the
    // game state).  Instead, it's handled here, when the NPC turn phase ends
    // so that clients CAN reconnect mid player turn and the playerTurnIndex is 
    // maintained
    // --
    // Reset to first player's turn
    this.playerTurnIndex = 0;
    // Increment the turn number now that it's starting over at the first phase
    this.turn_number++;

    // Actually update the turn_phase, note, this must occur before hostSendSync
    // or else it will cause all clients to sync to the previous turn_phase
    this.setTurnPhase(turn_phase.PlayerTurns);

    // Have the host send out syncronization messages so all clients are sync'd
    this.hostSendSync();
  }
  setTurnMessage(yourTurn: boolean, message: string) {
    if (elPlayerTurnIndicator) {
      elPlayerTurnIndicator.innerText = message;
    }
    document.body.classList.toggle('your-turn', yourTurn);
  }
  async initializePlayerTurn(playerIndex: number) {
    const player = this.players[playerIndex];
    if (!player) {
      console.error("Attempted to initialize turn for a non existant player index")
      return
    }
    if (player == window.player) {
      // Notify the current player that their turn is starting
      orderedFloatingText(`Your Turn`);
    }
    // Give mana at the start of turn
    const manaTillFull = player.unit.manaMax - player.unit.mana;
    // Give the player their mana per turn but don't let it go beyond manaMax
    // It's implemented this way instead of an actual capping in a setter so that
    // mana CAN go beyond max for other reasons (like mana potions), by design
    player.unit.mana += Math.max(0, Math.min(player.unit.manaPerTurn, manaTillFull));

    Unit.syncPlayerHealthManaUI();
    // Sync spell effect projection in the event that the player has a
    // spell queued up, it should show it in the HUD when it becomes their turn again
    // even if they don't move the mouse
    syncSpellEffectProjection();

    // If this current player is NOT able to take their turn...
    if (!Player.ableToTakeTurn(player)) {
      // Skip them
      this.endPlayerTurn(player.clientId);
      // Do not continue with initialization
      return;
    }
    // Trigger onTurnStart Events
    const onTurnStartEventResults: boolean[] = await Promise.all(player.unit.onTurnStartEvents.map(
      async (eventName) => {
        const fn = Events.onTurnSource[eventName];
        return fn ? await fn(player.unit) : false;
      },
    ));
    if (onTurnStartEventResults.some((b) => b)) {
      // If any onTurnStartEvents return true, skip the player
      this.endPlayerTurn(player.clientId);
      // Do not continue with initialization
      return;
    }
    // If player is killed at the start of their turn (for example, due to poison)
    // end their turn
    if (!player.unit.alive) {
      this.endPlayerTurn(player.clientId);
    }
    if (player === window.player) {
      this.setTurnMessage(true, 'Your Turn');
    } else {
      this.setTurnMessage(false, `Player ${playerIndex + 1}'s turn`);
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
    const playerIndex = this.players.findIndex((p) => p.clientId === clientId);
    const player = this.players[playerIndex];
    if (!player) {
      console.error('Cannot end turn, player with clientId:', clientId, 'does not exist');
      return;
    }
    if (this.playerTurnIndex != playerIndex) {
      // (A player "ending their turn" when it is not their turn
      // can occur when a client disconnects when it is not their turn)
      console.info('Cannot end the turn of a player when it isn\'t currently their turn')
      return
    }
    // Turns can only be ended when the route is the Underworld
    // and not, for example, Upgrade
    if (window.route === Route.Underworld) {
      // Ensure players can only end the turn when it IS their turn
      if (this.turn_phase === turn_phase.PlayerTurns) {
        // Incrememt the playerTurnIndex
        // This must happen before goToNextPhaseIfAppropriate
        // which checks if the playerTurnIndex is >= the number of players
        // to see if it should go to the next phase
        this.playerTurnIndex = playerIndex + 1;
        if (clientId === window.clientId) {
          this.setTurnMessage(false, 'Waiting on others');
        }
        const wentToNextLevel = this.checkForEndOfLevel();
        if (wentToNextLevel) {
          return;
        }
        const wentToNextPhase = this.goToNextPhaseIfAppropriate();
        if (wentToNextPhase) {
          return;
        }
        // Go to next players' turn
        this.initializePlayerTurn(this.playerTurnIndex)
      } else {
        console.error("turn_phase must be PlayerTurns to end turn.  Cannot be ", this.turn_phase);
      }
    } else {
      console.error("Route must be Underworld to end turn. Cannot end turn when the route is ", window.route);
    }
  }
  chooseUpgrade(player: Player.IPlayer, upgrade: Upgrade.IUpgrade) {
    const elUpgradePickerLabel = document.getElementById(
      'upgrade-picker-label',
    );
    const elUpgradePickerContent = document.getElementById(
      'upgrade-picker-content',
    );
    upgrade.effect(player);
    player.upgrades.push(upgrade);
    this.playersWhoHaveChosenUpgrade.push(player.clientId);
    // Clear upgrade choices once one is chosen
    if (player.clientId === window.clientId) {
      if (elUpgradePickerContent) {
        elUpgradePickerContent.innerHTML = '';
      }
    }

    const numberOfPlayersWhoNeedToChooseUpgradesTotal = this.players.filter(
      (p) => p.clientConnected,
    ).length;
    // TODO, this code may be vulnerable to mid-game disconnections, same as VOTE_FOR_LEVEL
    if (this.playersWhoHaveChosenUpgrade.length >= numberOfPlayersWhoNeedToChooseUpgradesTotal) {
      this.playersWhoHaveChosenUpgrade = [];
      if (elUpgradePickerLabel) {
        elUpgradePickerLabel.innerText = '';
      }
      // Now that upgrades are chosen, go to next level
      window.underworld.initLevel(++this.levelIndex);
    } else {
      if (elUpgradePickerLabel) {
        elUpgradePickerLabel.innerText = `${numberOfPlayersWhoNeedToChooseUpgradesTotal - this.playersWhoHaveChosenUpgrade.length
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
      // TODO handle game over
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
      setRoute(Route.Upgrade);
      // Reset the playerTurnIndex
      this.playerTurnIndex = 0;
      // Return of true signifies it went to the next level
      return true;
    }
    return false;
  }
  getRandomCoordsWithinBounds(bounds: Bounds): Vec2 {
    const x = randInt(window.underworld.random, bounds.xMin || 0, bounds.xMax || config.MAP_WIDTH);
    const y = randInt(window.underworld.random, bounds.yMin || 0, bounds.yMax || config.MAP_HEIGHT);
    return { x, y };
  }
  setTurnPhase(p: turn_phase) {
    console.log('setTurnPhase(', turn_phase[p], ')');
    // Clear debug graphics
    window.debugGraphics.clear()
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
      if (!u.flaggedForRemoval) {
        keepUnits.push(u);
      }
    }
    this.units = keepUnits;

    const phase = turn_phase[this.turn_phase];
    // Add current phase class to body
    document.body.classList.add('phase-' + phase.toLowerCase());
    switch (phase) {
      case 'PlayerTurns':
        for (let u of this.units) {
          // Reset thisTurnMoved flag now that it is a new turn
          // Because no units have moved yet this turn
          u.thisTurnMoved = false;
          // Reset distanceMovedThisTurn so units can move again
          u.distanceMovedThisTurn = 0;
        }
        // Lastly, initialize the player turns.
        // Note, it is possible that calling this will immediately end
        // the player phase (if there are no players to take turns)
        this.initializePlayerTurn(this.playerTurnIndex);
        break;
      case 'NPC':
        // Clears spell effect on NPC turn
        syncSpellEffectProjection();
        this.setTurnMessage(false, "NPC's Turn");
        let animationPromises: Promise<void>[] = [];
        (async () => {
          // Move units
          unitloop: for (let u of this.units.filter(
            (u) => u.unitType === UnitType.AI && u.alive,
          )) {
            // Trigger onTurnStart Events
            for (let eventName of u.onTurnStartEvents) {
              const fn = Events.onTurnSource[eventName];
              if (fn) {
                const abortTurn = await fn(u);
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
          // When all animations are done, set turn phase to player turn
          Promise.all(animationPromises).then(() => {
            this.endNPCTurnPhase();
          });

          // Since NPC turn is over, update the planningView
          // They may have moved or unfrozen which would update
          // where they can attack next turn
          updatePlanningView();
        })();
        break;
      default:
        break;
    }
  }

  getCoordsForUnitsWithinDistanceOfTarget(
    target: Vec2,
    distance: number,
  ): Vec2[] {
    const coords: Vec2[] = [];
    for (let unit of this.units) {
      if (math.distance(unit, target) <= distance) {
        coords.push({ x: unit.x, y: unit.y });
      }
    }
    return coords;
  }
  getUnitAt(coords: Vec2): Unit.IUnit | undefined {
    const sortedByProximityToCoords = this.units.filter(u => !u.flaggedForRemoval && !isNaN(u.x) && !isNaN(u.y)).sort((a, b) => math.distance(a, coords) - math.distance(b, coords));
    const closest = sortedByProximityToCoords[0]
    return closest && math.distance(closest, coords) <= config.COLLISION_MESH_RADIUS ? closest : undefined;
  }
  getPickupAt(coords: Vec2): Pickup.IPickup | undefined {
    const sortedByProximityToCoords = this.pickups.filter(p => !isNaN(p.x) && !isNaN(p.y)).sort((a, b) => math.distance(a, coords) - math.distance(b, coords));
    const closest = sortedByProximityToCoords[0]
    return closest && math.distance(closest, coords) <= config.COLLISION_MESH_RADIUS ? closest : undefined;
  }
  getObstacleAt(coords: Vec2): Obstacle.IObstacle | undefined {
    const sortedByProximityToCoords = this.obstacles.filter(o => !isNaN(o.x) && !isNaN(o.y)).sort((a, b) => math.distance(a, coords) - math.distance(b, coords));
    const closest = sortedByProximityToCoords[0]
    return closest && math.distance(closest, coords) <= config.COLLISION_MESH_RADIUS ? closest : undefined;
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
  removeObstacleFromArray(obstacle: Obstacle.IObstacle) {
    this.obstacles = this.obstacles.filter((o) => o !== obstacle);
  }
  addObstacleToArray(o: Obstacle.IObstacle) {
    this.obstacles.push(o);
  }
  async castCards(
    casterPlayer: Player.IPlayer,
    cardIds: string[],
    castLocation: Vec2,
    dryRun: boolean,
  ): Promise<Cards.EffectState> {
    let effectState: Cards.EffectState = {
      casterPlayer,
      casterUnit: casterPlayer.unit,
      targets: [castLocation],
      aggregator: {},
    };
    if (!casterPlayer.unit.alive) {
      // Prevent dead players from casting
      return effectState;
    }
    const cards = Cards.getCardsFromIds(cardIds);
    card:
    for (let index = 0; index < cards.length; index++) {
      const card = cards[index];
      const animationPromises: Promise<void>[] = [];
      if (card) {
        const animations = []
        if (!dryRun) {
          const singleCardCost = calculateCost([card], math.distance(casterPlayer.unit, castLocation), casterPlayer);
          // Prevent casting if over cost:
          if (singleCardCost.manaCost > casterPlayer.unit.mana) {
            floatingText({
              coords: castLocation,
              text: 'Insufficient mana!',
              style: {
                fill: '#5656d5'
              }
            });
            // There is not enough mana to cast this, go to the next card
            continue card;
          }
          // Apply mana and health cost to caster
          // Note: it is important that this is done BEFORE a card is actually cast because
          // the card may affect the caster's mana
          casterPlayer.unit.mana -= singleCardCost.manaCost;
          Unit.takeDamage(casterPlayer.unit, singleCardCost.healthCost);
          Unit.syncPlayerHealthManaUI();
        }
        for (let target of effectState.targets) {

          // Show the card that's being cast:
          if (!dryRun) {
            const image = Image.create(
              target.x,
              target.y,
              card.thumbnail,
              containerUI,
            );
            // Animate icons of spell cards as they are cast:
            image.sprite.scale.set(1.0);
            const scaleAnimation = Promise.all([
              Image.scale(image, 1.4),
              Image.move(image, image.sprite.x, image.sprite.y - 50),
              new Promise<void>((resolve) => {
                // Make the image fade out after a delay
                setTimeout(() => {
                  resolve();
                  Image.hide(image).then(() => {
                    Image.cleanup(image);
                  })
                }, config.MILLIS_PER_SPELL_ANIMATION * .8);
              })
            ]);
            animations.push(scaleAnimation);
          }
        }
        // .then is necessary to convert return type of promise.all to just be void
        animationPromises.push(Promise.all([animations]).then(() => { }));
        const { targets: previousTargets } = effectState;
        effectState = await card.effect(effectState, dryRun, index);
        // Delay animation between spells so players can understand what's going on
        if (!dryRun) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, config.MILLIS_PER_SPELL_ANIMATION);
          })
        }
        // Clear images from previous card before drawing the images from the new card
        containerSpells.removeChildren();
        // Animate target additions:
        for (let target of effectState.targets) {
          // If already included target:
          if (
            previousTargets.find((t) => t.x === target.x && t.y === target.y)
          ) {
            let targetedUnit = this.getUnitAt(target)
            // If the target is over a unit, draw a target on the unit
            if (targetedUnit) {
              // Don't animate previous targets, they should be drawn full, immediately
              animationPromises.push(drawTarget(targetedUnit.x, targetedUnit.y, false));
            } else {
              // otherwise draw a small target circle where it will be cast on the ground
              drawDryRunCircle(target, 2);
            }
          } else {
            // If a new target, animate it in
            animationPromises.push(drawTarget(target.x, target.y, !dryRun));
          }
        }

        await Promise.all(animationPromises);
        if (!dryRun) {
          // Now that the caster is using the card, increment usage count
          if (casterPlayer.cardUsageCounts[card.id] === undefined) {
            casterPlayer.cardUsageCounts[card.id] = 0;
          }
          casterPlayer.cardUsageCounts[card.id]++;
          updateManaCostUI();

        }
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
  // hasLineOfSight returns true if there are no walls interrupting
  // a line from seer to target
  hasLineOfSight(seer: Vec2, target: Vec2): boolean {
    const lineOfSight: LineSegment = { p1: seer, p2: target };
    for (let w of this.walls) {
      if (lineSegmentIntersection(lineOfSight, w)) {
        return false
      }
    }
    return true
  }

  // Create a hash from the gamestate.  Useful for determining if
  // clients have desynced.
  // hash() {
  //   const state = this.serializeForHash();
  //   const hashResult = hash(state);
  //   console.log(`hash-${hashResult}:`, JSON.stringify(state));
  //   return hashResult
  // }
  // Returns a modified copy of gamestate that is used when generating a hash
  // of the gamestate to determine if clients have identical states
  // Use caution: any properties improperly modified or removed could cause
  // a silent desync between clients.  Only properties that are client-only
  // and need not be syncronized, should be removed.
  serializeForHash() {
    const serializedState: any = this.serializeForSaving();
    // Remove variables that would cause the hash to change second to second.
    // The hash is meant to show if clients have roughly identical game state
    // but it will take time to communicate the hash. 
    return serializedState;
  }

  // Returns only the properties that can be saved
  // callbacks and complicated objects such as PIXI.Sprites
  // are removed
  serializeForSaving(): IUnderworldSerialized {
    const { random, players, units, pickups, obstacles, ...rest } = this;
    return {
      ...rest,
      players: this.players.map(Player.serialize),
      units: this.units
        // Player controlled units are serialized within the players object
        .filter((u) => u.unitType !== UnitType.PLAYER_CONTROLLED)
        .map(Unit.serialize),
      pickups: this.pickups.map(Pickup.serialize),
      obstacles: this.obstacles.map(Obstacle.serialize),
      // the state of the Random Number Generator
      RNGState: this.random.state(),
    };
  }
  // Updates specifically selected properties of underworld
  // Mutates current object
  // The purpose of this function is to keep underworld in sync
  // between clients
  syncronize(serialized: IUnderworldSerializedForSyncronize) {
    if (serialized.RNGState) {
      this.syncronizeRNG(serialized.RNGState);
    }
    this.levelIndex = serialized.levelIndex;
    this.turn_phase = serialized.turn_phase;
    this.playerTurnIndex = serialized.playerTurnIndex;
    this.turn_number = serialized.turn_number;
    this.height = serialized.height;
    this.width = serialized.width;
    // Note: obstacles are not serialized since they are unchanging between levels
    // TODO, remove walls and pathingPolygons here, they are set in cacheWalls, so this is redundant
    // make sure obstacles come over when serialized
    this.walls = serialized.walls;
    this.pathingPolygons = serialized.pathingPolygons;
    this.playersWhoHaveChosenUpgrade = serialized.playersWhoHaveChosenUpgrade;
    this.processedMessageCount = this.processedMessageCount;
    this.cacheWalls();
  }
  serializeForSyncronize(): IUnderworldSerializedForSyncronize {
    const { players, units, pickups, obstacles, random, processedMessageCount, ...rest } = this;
    const serialized: IUnderworldSerializedForSyncronize = {
      ...rest,
      // the state of the Random Number Generator
      RNGState: this.random.state() as SeedrandomState,
    }
    return serialized;
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
type IUnderworldSerialized = Omit<typeof Underworld, "prototype" | "players" | "units" | "pickups" | "obstacles" | "random" | "turnInterval"> & {
  players: Player.IPlayerSerialized[],
  units: Unit.IUnitSerialized[],
  pickups: Pickup.IPickupSerialized[],
  obstacles: Obstacle.IObstacleSerialized[],
};
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type UnderworldNonFunctionProperties = Exclude<NonFunctionPropertyNames<Underworld>, null | undefined>;
type IUnderworldSerializedForSyncronize = Omit<Pick<Underworld, UnderworldNonFunctionProperties>, "debugGraphics" | "players" | "units" | "pickups" | "obstacles" | "random" | "processedMessageCount">;


function getEnemiesForAltitude(levelIndex: number): { [unitid: string]: number } {
  const hardCodedLevelEnemies: { [unitid: string]: number }[] = [
    { 'grunt': 5 },
    {
      'grunt': 4,
      'archer': 1
    },
    {
      'grunt': 3,
      'archer': 2,
      'Sand Golem': 1,
    },
    {
      'grunt': 7,
      'archer': 3,
      'Sand Golem': 2,
    },
    {
      'grunt': 2,
      'archer': 2,
      'Summoner': 1,
    },
    {
      'Summoner': 3,
    },
    {
      'vampire': 1,
    },
    {
      'grunt': 3,
      'archer': 2,
      'Sand Golem': 1,
      'Priest': 2,
    },
    {
      'grunt': 3,
      'archer': 2,
      'Sand Golem': 1,
      'Priest': 2,
      'Poisoner': 1,
      'vampire': 1,
    },
    {
      'grunt': 12,
      'demon': 1
    },
    {
      'grunt': 5,
      'archer': 3,
      'Sand Golem': 2,
      'Priest': 2,
      'Poisoner': 1,
      'demon': 1,
    },
  ];
  // Loop allows users to continue playing after the final level, it will 
  // multiply the previous levels by the loop number
  // Default loop at 1
  const loop = 1 + Math.floor(levelIndex / hardCodedLevelEnemies.length);
  if (levelIndex >= hardCodedLevelEnemies.length) {
    levelIndex = levelIndex % hardCodedLevelEnemies.length;
  }

  const enemies = hardCodedLevelEnemies[levelIndex];
  if (enemies) {
    return Object.fromEntries(Object.entries(enemies).map(([unitId, quantity]) => [unitId, quantity * loop]));
  } else {
    // This should never happen
    console.error('getEnemiesForAltitude could not find enemy information for levelIndex', levelIndex);
    return {};
  }
}