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
  containerSpells,
  containerUI,
} from './PixiUtils';
import floatingText from './FloatingText';
import { UnitType, Faction } from './commonTypes';
import type { Vec2 } from "./Vec";
import * as Vec from "./Vec";
import Events from './Events';
import { allUnits } from './units';
import { syncSpellEffectProjection, updatePlanningView } from './ui/PlanningView';
import { ILevel, getEnemiesForAltitude } from './overworld';
import { setRoute, Route } from './routes';
import { prng, randInt, SeedrandomState } from './rand';
import { calculateManaCost } from './cards/cardUtils';
import { moveWithCollisions } from './collision/moveWithCollision';
import { lineSegmentIntersection, LineSegment } from './collision/collisionMath';
import { updateCardManaBadges } from './CardUI';
import { expandPolygon, mergeOverlappingPolygons, Polygon, PolygonLineSegment, polygonToPolygonLineSegments } from './Polygon';

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

export default class Underworld {
  seed: string;
  random: prng;
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
  secondsLeftForTurn: number = config.SECONDS_PER_TURN;
  turnInterval: any;
  level?: ILevel;
  playersWhoHaveChosenUpgrade = new Set<string>();
  // Keeps track of how many messages have been processed so that clients can
  // know when they've desynced.  Only used for syncronous message processing
  // since only the syncronous messages affect gamestate.
  processedMessageCount: number = 0;
  debugGraphics: PIXI.Graphics;

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

    this.debugGraphics = new PIXI.Graphics();
    containerBoard.addChild(this.debugGraphics);


    // TODO: these probably shouldn't get initialized here
    this.startTurnTimer();
    this.gameLoopUnits();
  }
  syncronizeRNG(RNGState: SeedrandomState | boolean) {
    // state of "true" initializes the RNG with the ability to save it's state,
    // state of a state object, rehydrates the RNG to a particular state
    this.random = seedrandom(this.seed, { state: RNGState })
    return this.random;
  }
  startTurnTimer() {
    // Limit turn duration
    if (elPlayerTurnIndicatorHolder) {
      elPlayerTurnIndicatorHolder.classList.remove('low-time');
    }
    // Reset the seconds left
    this.secondsLeftForTurn = config.SECONDS_PER_TURN;
    clearInterval(this.turnInterval);
    // Start the interval which will end the player's turn when secondsLeftForTurn is <= 0
    this.turnInterval = setInterval(() => {
      if (
        window.route === Route.Underworld &&
        this.turn_phase === turn_phase.PlayerTurns
      ) {
        this.secondsLeftForTurn--;
        if (this.secondsLeftForTurn <= 10) {
          elPlayerTurnIndicatorHolder &&
            elPlayerTurnIndicatorHolder.classList.add('low-time');
        }
        if (elTurnTimeRemaining) {
          elTurnTimeRemaining.innerText = `0:${this.secondsLeftForTurn < 10
            ? '0' + this.secondsLeftForTurn
            : this.secondsLeftForTurn
            }`;
        } else {
          console.error('elTurnTimeRemaining is null');
        }
        // Skip player turn if they run out of time
        if (this.secondsLeftForTurn <= 0) {
          console.log('Out of time, turn ended');
          this.endMyTurn();
          clearInterval(this.turnInterval);
        }
      } else {
        if (elTurnTimeRemaining) {
          elTurnTimeRemaining.innerText = '';
        }
      }
    }, 1000);
  }
  gameLoopUnits() {
    const aliveUnits = this.units.filter(u => u.alive);
    for (let u of aliveUnits) {
      if (u.path && u.path.length) {
        // Move towards target
        const stepTowardsTarget = math.getCoordsAtDistanceTowardsTarget(u, u.path[0], u.moveSpeed)
        if (Vec.equal(stepTowardsTarget, u.path[0])) {
          // Once the unit reaches the target, shift so the next point in the path is the next target
          u.path.shift();
        }
        moveWithCollisions(u, stepTowardsTarget, aliveUnits, this.walls)
        // check for collisions with pickups in new location
        this.checkPickupCollisions(u);
      }
      // Sync Image even for non moving units since they may be moved by forces other than themselves
      Unit.syncImage(u)
      // UNIT_STOP_MOVING_MARGIN ensures that units wont continue to move imperceptibly while
      // players wait for the seemingly non-moving unit's turn to end (which ends when it's done moving via resolveDoneMoving)
      // --
      // Also stops moving if path has a length of 0 in the event that some other code clears the path, we
      // want to make sure this promise resolves so the game doesn't get stuck
      if (u.path.length === 0 || Math.abs(u.x - u.lastX) < config.UNIT_STOP_MOVING_MARGIN && Math.abs(u.y - u.lastY) < config.UNIT_STOP_MOVING_MARGIN) {
        u.resolveDoneMoving();
      }
    }
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
    clearInterval(this.turnInterval);
    for (let p of this.players) {
      // Note: Player's unit image is cleaned up below where it also has a reference in this.units
      // Clean up overworldImage
      Image.cleanup(p.overworldImage);
    }
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
  moveToNextLevel(level: ILevel) {
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
    this.initLevel(level);
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

  initLevel(level: ILevel) {
    this.level = level;
    // Show text in center of screen for the new level
    floatingText({
      coords: {
        x: config.MAP_WIDTH / 2,
        y: config.MAP_HEIGHT / 2,
      },
      text: `Altitude ${this.level.altitude}`,
      style: {
        fill: 'white',
        fontSize: '60px',
      },
    });
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
      elLevelIndicator.innerText = `Altitude ${this.level.altitude}`;
    } else {
      console.error('elLevelIndicator is null');
    }
    for (let i = 0; i < config.NUM_PICKUPS_PER_LEVEL; i++) {
      const coords = this.getRandomCoordsWithinBounds({ xMin: 2 * config.UNIT_SIZE, yMin: config.COLLISION_MESH_RADIUS, xMax: config.MAP_WIDTH - config.COLLISION_MESH_RADIUS, yMax: config.MAP_HEIGHT - config.COLLISION_MESH_RADIUS });
      const randomPickupIndex = randInt(this.random,
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
    }
    // Spawn units at the start of the level
    const enemyIndexes = getEnemiesForAltitude(level.altitude);
    for (let index of enemyIndexes) {
      const coords = this.getRandomCoordsWithinBounds({ xMin: 2 * config.UNIT_SIZE, yMin: config.COLLISION_MESH_RADIUS, xMax: config.MAP_WIDTH - config.COLLISION_MESH_RADIUS, yMax: config.MAP_HEIGHT - config.COLLISION_MESH_RADIUS });
      const sourceUnit = Object.values(allUnits)[index];
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
        unit.image.sprite.scale.set(0);
        unit.radius = config.COLLISION_MESH_RADIUS;
        Image.scale(unit.image, 1.0);
      } else {
        // Start images small and make them grow when they spawn in
        unit.image.sprite.scale.set(0);
        Image.scale(unit.image, config.NON_HEAVY_UNIT_SCALE);
      }
    }

    for (let i = 0; i < config.NUM_OBSTACLES_PER_LEVEL; i++) {
      let badLocation = false;
      // Ensure obstacles don't spawn in the column that spawns players:
      const coords = this.getRandomCoordsWithinBounds({ xMin: 2 * config.UNIT_SIZE, yMin: config.COLLISION_MESH_RADIUS, xMax: config.MAP_WIDTH - config.COLLISION_MESH_RADIUS, yMax: config.MAP_HEIGHT - config.COLLISION_MESH_RADIUS });
      for (let u of this.units) {
        if (math.distance(u, coords) < config.COLLISION_MESH_RADIUS * 2) {
          // Abort spawning the obstacle if it collides with a unit
          badLocation = true;
          break;
        }
      }
      for (let p of this.pickups) {
        if (math.distance(p, coords) < config.COLLISION_MESH_RADIUS * 2) {
          // Abort spawning the obstacle if it collides with a pickup
          badLocation = true;
          break;
        }
      }
      // Do not create if it didn't choose a good location
      // For now, to prevent obstacles from trapping units when they
      // spawn, just skip making one if the coordinates collide with
      // a unit
      if (badLocation) {
        continue;
      }
      const randomIndex = randInt(this.random,
        0,
        Obstacle.obstacleSource.length - 1,
      );
      const obstacle = Obstacle.obstacleSource[randomIndex];
      Obstacle.create(coords.x, coords.y, obstacle);
      // TODO: Ensure the players have a path to the portal
    }
    // Test obstaclese
    // [
    //   {
    //     "x": 412,
    //     "y": 548
    //   },
    //   {
    //     "x": 478,
    //     "y": 474
    //   },
    //   {
    //     "x": 368,
    //     "y": 472
    //   },
    // ]
    //   .map(({ x, y }) => { Obstacle.create(x, y, Obstacle.obstacleSource[0]) });


    this.cacheWalls();

    // Since a new level changes the existing units, redraw the planningView in
    // the event that the planningView is active
    updatePlanningView();

    // Go to underworld, now that level is ready
    setRoute(Route.Underworld);
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
        p.cardUsageCounts[cardId] = Math.max(0, p.cardUsageCounts[cardId] - 1);
      }
    }
    updateCardManaBadges();
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
  initializePlayerTurn(playerIndex: number) {
    const player = this.players[playerIndex];
    if (!player) {
      console.error("Attempted to initialize turn for a non existant player index")
      return
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

    // Finally initialize their turn
    this.startTurnTimer();
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
    this.playersWhoHaveChosenUpgrade.add(player.clientId);
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
    if (this.playersWhoHaveChosenUpgrade.size >= numberOfPlayersWhoNeedToChooseUpgradesTotal) {
      this.playersWhoHaveChosenUpgrade.clear();
      if (elUpgradePickerLabel) {
        elUpgradePickerLabel.innerText = '';
      }
      // Go to overworld now that upgrade is chosen
      setRoute(Route.Overworld);
    } else {
      if (elUpgradePickerLabel) {
        elUpgradePickerLabel.innerText = `${numberOfPlayersWhoNeedToChooseUpgradesTotal - this.playersWhoHaveChosenUpgrade.size
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
    // Clear debug graphics
    window.underworld.debugGraphics.clear()
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
        }
        // Lastly, initialize the player turns.
        // Note, it is possible that calling this will immediately end
        // the player phase (if there are no players to take turns)
        this.initializePlayerTurn(this.playerTurnIndex);
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
        // When all animations are done, set turn phase to player turn
        Promise.all(animationPromises).then(() => {
          this.endNPCTurnPhase();
        });

        // Since NPC turn is over, update the planningView
        // They may have moved or unfrozen which would update
        // where they can attack next turn
        updatePlanningView();
        console.log('end switch to NPC turn');
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
    target: Vec2,
    dryRun: boolean,
  ): Promise<Cards.EffectState> {
    let effectState: Cards.EffectState = {
      casterPlayer,
      casterUnit: casterPlayer.unit,
      targets: [target],
      aggregator: {},
    };
    if (!casterPlayer.unit.alive) {
      // Prevent dead players from casting
      return effectState;
    }
    const cards = Cards.getCardsFromIds(cardIds);

    for (let index = 0; index < cards.length; index++) {
      const card = cards[index];
      const animationPromises: Promise<void>[] = [];
      if (card) {
        const animations = []
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
                }, config.MILLIS_PER_SPELL_ANIMATION * .8)
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
    const manaCost = calculateManaCost(cards, math.distance(casterPlayer.unit, target), casterPlayer);
    if (!dryRun) {
      // Apply mana cost to caster
      casterPlayer.unit.mana -= manaCost;
      Unit.syncPlayerHealthManaUI();
    }
    if (!dryRun) {
      // Now that the caster has used the card, increment usage count
      for (let cardId of cardIds) {
        if (casterPlayer.cardUsageCounts[cardId] === undefined) {
          casterPlayer.cardUsageCounts[cardId] = 0;
        }
        casterPlayer.cardUsageCounts[cardId]++;
      }
      updateCardManaBadges();

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
    // but it will take time to communicate the hash. and since secondsLeftForTurn
    // changes second to second, it isn't useful for determining if clients have
    // desynced
    delete serializedState.secondsLeftForTurn;
    return serializedState;
  }

  // Returns only the properties that can be saved
  // callbacks and complicated objects such as PIXI.Sprites
  // are removed
  serializeForSaving(): IUnderworldSerialized {
    const { random, turnInterval, players, units, pickups, obstacles, ...rest } = this;
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
    Object.assign(this, serialized);
  }
  serializeForSyncronize(): IUnderworldSerializedForSyncronize {
    const { debugGraphics, secondsLeftForTurn, players, units, pickups, obstacles, random, turnInterval, processedMessageCount, ...rest } = this;
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
type IUnderworldSerialized = Omit<Underworld, "players" | "units" | "pickups" | "obstacles" | "random" | "turnInterval"> & {
  players: Player.IPlayerSerialized[],
  units: Unit.IUnitSerialized[],
  pickups: Pickup.IPickupSerialized[],
  obstacles: Obstacle.IObstacleSerialized[],
};
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type UnderworldNonFunctionProperties = Exclude<NonFunctionPropertyNames<Underworld>, null | undefined>;
type IUnderworldSerializedForSyncronize = Omit<Pick<Underworld, UnderworldNonFunctionProperties>, "secondsLeftForTurn" | "debugGraphics" | "players" | "units" | "pickups" | "obstacles" | "random" | "turnInterval" | "processedMessageCount">;