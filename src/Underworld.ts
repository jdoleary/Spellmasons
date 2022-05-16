import * as PIXI from 'pixi.js';
import seedrandom from 'seedrandom';
import * as config from './config';
import * as Unit from './Unit';
import * as Pickup from './Pickup';
import * as Obstacle from './Obstacle';
import * as Player from './Player';
import * as Upgrade from './Upgrade';
import * as math from './math';
import * as Cards from './cards';
import * as Image from './Image';
import * as storage from './storage';
import * as ImmediateMode from './ImmediateModeSprites';
import obstacleSectors from './ObstacleSectors';
import { MESSAGE_TYPES } from './MessageTypes';
import {
  app,
  containerBoard,
  containerDoodads,
  containerSpells,
  containerUI,
  containerUnits,
  updateCameraPosition,
  cameraAutoFollow,
  getCamera,
  withinCameraBounds,
} from './PixiUtils';
import floatingText, { centeredFloatingText, elPIXIHolder } from './FloatingText';
import { UnitType, Faction, UnitSubType } from './commonTypes';
import type { Vec2 } from "./Vec";
import * as Vec from "./Vec";
import Events from './Events';
import { allUnits } from './units';
import { updateManaCostUI, updatePlanningView } from './ui/PlanningView';
import { prng, randInt, SeedrandomState } from './rand';
import { calculateCost } from './cards/cardUtils';
import { lineSegmentIntersection, LineSegment } from './collision/collisionMath';
import { expandPolygon, mergeOverlappingPolygons, Polygon, PolygonLineSegment, polygonToPolygonLineSegments } from './Polygon';
import { calculateDistanceOfVec2Array, findPath, findPolygonsThatVec2IsInsideOf } from './Pathfinding';
import { removeUnderworldEventListeners, setView, View } from './views';
import * as readyState from './readyState';
import { HandcraftedLevel, levels } from './HandcraftedLevels';
import { addCardToHand, removeCardsFromHand } from './CardUI';
import { mouseMove } from './ui/eventListeners';
import Jprompt from './Jprompt';
import { collideWithWalls, moveWithCollisions } from './collision/moveWithCollision';
import { ENEMY_ENCOUNTERED_STORAGE_KEY } from './contants';
import { getBestRangedLOSTarget } from './units/actions/rangedAction';
import { getClients, hostGiveClientGameStateForInitialLoad } from './wsPieHandler';
import { healthAllyGreen, healthHurtRed, healthRed } from './ui/colors';
import objectHash from 'object-hash';

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
const elUpgradePicker = document.getElementById('upgrade-picker') as HTMLElement;
const elUpgradePickerContent = document.getElementById('upgrade-picker-content') as HTMLElement;
const elSeed = document.getElementById('seed') as HTMLElement;
const elCardHolders = document.getElementById('card-holders') as HTMLElement;

let lastTime = 0;
let requestAnimationFrameGameLoopId: number;
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
  // An id incrementor to make sure no 2 units share the same id
  lastUnitId: number = -1;
  // A count of which turn it is, this is useful for
  // governing AI actions that occur every few turns
  // instead of every turn.  A "turn" is a full cycle,
  // meaning, players take their turn, npcs take their
  // turn, then it resets to player turn, that is a full "turn"
  turn_number: number = -1;
  height: number = 500;
  width: number = 800;
  players: Player.IPlayer[] = [];
  units: Unit.IUnit[] = [];
  pickups: Pickup.IPickup[] = [];
  groundTiles: Vec2[] = [];
  // line segments that prevent sight
  walls: LineSegment[] = [];
  // line segments that prevent movement
  bounds: PolygonLineSegment[] = [];
  pathingPolygons: Polygon[] = [];
  // pathingLineSegments shall always be exactly pathingPolygons converted to PolygonLineSegments.
  // It is kept up to date whenever pathingPolygons changes in cachedWalls
  pathingLineSegments: PolygonLineSegment[] = [];
  // Keeps track of how many messages have been processed so that clients can
  // know when they've desynced.  Only used for syncronous message processing
  // since only the syncronous messages affect gamestate.
  processedMessageCount: number = 0;
  validPlayerSpawnCoords: Vec2[] = [];
  // Instead of moving to the upgrade screen at the end of the level,
  // if this is set it will take players to a handcrafted level
  nextHandCraftedLevel?: string;

  constructor(seed: string, RNGState: SeedrandomState | boolean = true) {
    window.underworld = this;
    this.seed = seed;
    elSeed.innerText = `Seed: ${this.seed}`;
    console.log("RNG create with seed:", this.seed, ", state: ", RNGState);
    this.random = this.syncronizeRNG(RNGState);
    this.ensureAllClientsHaveAssociatedPlayers(getClients());

    // Start the gameloop
    requestAnimationFrameGameLoopId = requestAnimationFrame(this.gameLoop);
  }
  syncPlayerPredictionUnitOnly() {
    if (window.player !== undefined) {
      const predictionUnitIndex = window.predictionUnits.findIndex(u => u.id == window.player?.unit.id);
      window.predictionUnits[predictionUnitIndex] = Unit.copyForPredictionUnit(window.player.unit);
    }
  }
  // Assigns window.predictionUnits a copy of this.units
  // for the sake of prediction
  syncPredictionUnits() {
    window.predictionUnits = this.units.map(Unit.copyForPredictionUnit);
  }
  syncronizeRNG(RNGState: SeedrandomState | boolean) {
    // state of "true" initializes the RNG with the ability to save it's state,
    // state of a state object, rehydrates the RNG to a particular state
    this.random = seedrandom(this.seed, { state: RNGState })
    return this.random;
  }
  gameLoop = (timestamp: number) => {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    const { zoom } = getCamera();

    ImmediateMode.loop();

    Unit.syncPlayerHealthManaUI();
    window.unitOverlayGraphics.clear();

    const aliveUnits = this.units.filter(u => u.alive);
    // Run all forces in window.forceMove
    for (let i = window.forceMove.length - 1; i >= 0; i--) {
      const forceMoveInst = window.forceMove[i];
      if (forceMoveInst) {
        const { unit, step } = forceMoveInst;
        forceMoveInst.distance -= Vec.magnitude(step);
        moveWithCollisions(unit, Vec.add(unit, step), aliveUnits);
        collideWithWalls(unit);
        // Remove it from forceMove array once the distance has been covers
        // This works even if collisions prevent the unit from moving since
        // distance is modified even if the unit doesn't move each loop
        if (forceMoveInst.distance <= 0) {
          window.forceMove.splice(i, 1);
        }
      }
    }

    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u) {
        const predictionUnit = window.predictionUnits[i];
        if (u.alive) {
          // Only allow movement if the unit has stamina
          if (u.path && u.path.points[0] && u.stamina > 0) {
            // Move towards target
            const stepTowardsTarget = math.getCoordsAtDistanceTowardsTarget(u, u.path.points[0], u.moveSpeed * deltaTime)
            let moveDist = 0;
            // For now, only AI units will collide with each other
            // This is because the collisions were causing issues with player movement that I don't
            // have time to solve at the moment.
            if (u.unitType == UnitType.PLAYER_CONTROLLED) {
              // Player units don't collide, they just move, and pathfinding keeps
              // them from moving through walls
              moveDist = math.distance(u, stepTowardsTarget);
              u.x = stepTowardsTarget.x;
              u.y = stepTowardsTarget.y;
            } else {
              // AI collide with each other and walls
              const originalPosition = Vec.clone(u);
              // Only move other NPCs out of the way, never move player units
              moveWithCollisions(u, stepTowardsTarget, aliveUnits);
              moveDist = math.distance(originalPosition, u);
            }
            u.stamina -= moveDist;
            if (u.path.points[0] && (
              Vec.equal(u, u.path.points[0]) ||
              // If unit is MELEE and only has the final target left in the path, stop when it gets close enough
              (u.path.points.length == 1 && u.unitSubType == UnitSubType.MELEE && math.distance(u, u.path.points[0]) <= config.COLLISION_MESH_RADIUS * 2)
            )) {
              // Once the unit reaches the target, shift so the next point in the path is the next target
              u.path.points.shift();
              // Clear AI stamina after they reach the end of their path so they don't
              // keep moving when it's not their turn when their target starts moving
              if (u.unitType == UnitType.AI && u.path.points.length === 0) {
                u.stamina = 0;
              }
            }
          }
          // check for collisions with pickups in new location
          this.checkPickupCollisions(u);
          collideWithWalls(u);
          // Ensure that resolveDoneMoving is invoked when unit is out of stamina (and thus, done moving)
          // or when find point in the path has been reached.
          // This is necessary to end the moving units turn because elsewhere we are awaiting the fulfillment of that promise
          // to know they are done moving
          if (u.stamina <= 0 || !u.path || u.path.points.length === 0) {
            u.resolveDoneMoving();
            if (u.path) {
              // Update last position that changed via own movement
              u.path.lastOwnPosition = Vec.clone(u);
            }
          }
        }
        // Sync Image even for non moving units since they may be moved by forces other than themselves
        // This keeps the unit.image in the same place as unit.x, unit.y
        Unit.syncImage(u)
        // Draw unit overlay graphics
        //--
        // Prevent drawing unit overlay graphics when a unit is in the portal
        if (u.x !== null && u.y !== null) {
          // Draw health bar
          const healthBarColor = u.faction == Faction.ALLY ? healthAllyGreen : healthRed;
          const healthBarHurtColor = u.faction == Faction.ALLY ? 0x235730 : healthHurtRed;
          const healthBarHealColor = u.faction == Faction.ALLY ? 0x23ff30 : 0xff2828;
          window.unitOverlayGraphics.lineStyle(0, 0x000000, 1.0);
          window.unitOverlayGraphics.beginFill(healthBarColor, 1.0);
          const healthBarWidth = Math.max(0, config.UNIT_UI_BAR_WIDTH * u.health / u.healthMax);
          window.unitOverlayGraphics.drawRect(
            u.x - config.UNIT_UI_BAR_WIDTH / 2,
            u.y - config.COLLISION_MESH_RADIUS - config.UNIT_UI_BAR_HEIGHT,
            healthBarWidth,
            config.UNIT_UI_BAR_HEIGHT);

          // Only show health bar predictions on PlayerTurns, while players are able
          // to cast, otherwise it will show out of sync when NPCs do damage
          if (this.turn_phase == turn_phase.PlayerTurns) {
            // Show how much damage they'll take on their health bar
            window.unitOverlayGraphics.beginFill(healthBarHurtColor, 1.0);
            if (predictionUnit) {
              const healthAfterHurt = predictionUnit.health;
              if (healthAfterHurt > u.health) {
                window.unitOverlayGraphics.beginFill(healthBarHealColor, 1.0);
              }
              const healthBarHurtWidth = Math.max(0, config.UNIT_UI_BAR_WIDTH * (u.health - healthAfterHurt) / u.healthMax);
              window.unitOverlayGraphics.drawRect(
                u.x - config.UNIT_UI_BAR_WIDTH / 2 + config.UNIT_UI_BAR_WIDTH * healthAfterHurt / u.healthMax,
                u.y - config.COLLISION_MESH_RADIUS - config.UNIT_UI_BAR_HEIGHT,
                healthBarHurtWidth,
                config.UNIT_UI_BAR_HEIGHT);
              // Draw red death circle if a unit is currently alive, but wont be after cast
              if (u.alive && !predictionUnit.alive) {
                ImmediateMode.draw('skull.png', { x: u.x, y: u.y - (32 / zoom) }, 1 / zoom);
              }
            }
          }
          // Draw mana bar
          if (u.manaMax != 0) {
            const manaBarWidth = Math.max(0, config.UNIT_UI_BAR_WIDTH * Math.min(1, u.mana / u.manaMax));
            window.unitOverlayGraphics.lineStyle(0, 0x000000, 1.0);
            window.unitOverlayGraphics.beginFill(0x5656d5, 1.0);
            window.unitOverlayGraphics.drawRect(
              u.x - config.UNIT_UI_BAR_WIDTH / 2,
              u.y - config.COLLISION_MESH_RADIUS,
              manaBarWidth,
              config.UNIT_UI_BAR_HEIGHT);
          }
          window.unitOverlayGraphics.endFill();
        }
      }
    }
    // Sort unit sprites visually by y position (like "z-index")
    containerUnits.children.sort((a, b) => a.y - b.y)

    updateCameraPosition();
    this.drawEnemyAttentionMarkers();
    this.drawResMarkers();
    updatePlanningView();
    mouseMove();

    // Invoke gameLoopUnits again next loop
    requestAnimationFrameGameLoopId = requestAnimationFrame(this.gameLoop)
  }
  // setPath finds a path to the target
  // and sets that to the unit's path
  setPath(unit: Unit.IUnit, target: Vec2) {
    const path = this.calculatePath(unit.path, unit, target)
    if (unit.path) {
      // If there is a pre-existing path, intentionally mutate it.
      // This is so that predictionUnits can mutate the path's of 
      // their actual unit counterparts so we get the optimization gains
      // of cached paths.
      unit.path.lastOwnPosition = path.lastOwnPosition;
      unit.path.points = path.points;
      unit.path.targetPosition = path.targetPosition;
    } else {
      unit.path = path;
    }
  }
  // calculatePath will find a UnitPath from startPoint to target.
  // If preExistingPath exists, it may slightly modify
  // the preExistingPath as an optimization
  calculatePath(preExistingPath: Unit.UnitPath | undefined, startPoint: Vec2, target: Vec2): Unit.UnitPath {
    // Cached path finding, if start point and target are the same (or close)
    // do not recalculate path.  start point being the same includes if units has only moved
    // along path but not moved under other forces (for this case: preExistingPath.lastOwnPosition 
    // is updated elsewhere).
    if (preExistingPath) {
      // If there is a preexisting path, see if it can be reused
      const targetMoved = !Vec.equal(target, preExistingPath.targetPosition);
      const selfMoved = !Vec.equal(startPoint, preExistingPath.lastOwnPosition);
      if (targetMoved) {
        // Fully recalculate
        return this.calculatePathNoCache(startPoint, target);
      } else if (selfMoved) {
        // Fully recalculate
        return this.calculatePathNoCache(startPoint, target);
      } else {
        // Do nothing, keep the same path.  This is the most optimal result because
        // it requires the least additional computation
        return preExistingPath;
      }
    } else {
      // If there is no preexisting path, recalculate path
      return this.calculatePathNoCache(startPoint, target);
    }
  }
  // calculatePathNoCache calculates a path without checking if an old path can be 
  // reused like 'calculatePath()' does.
  calculatePathNoCache(startPoint: Vec2, target: Vec2): Unit.UnitPath {
    return {
      points: findPath(startPoint, target, this.pathingPolygons, this.pathingLineSegments),
      lastOwnPosition: Vec.clone(startPoint),
      targetPosition: Vec.clone(target)
    }
  }
  drawResMarkers() {
    for (let marker of window.resMarkers) {
      const { zoom } = getCamera();
      ImmediateMode.draw('raise_dead.png', marker, 1 / zoom);
    }

  }
  drawEnemyAttentionMarkers() {
    // Draw attention markers which show if an NPC will
    // attack you next turn
    // Note: this block must come after updating the camera position
    for (let marker of window.attentionMarkers) {
      const { zoom } = getCamera();

      // Offset exclamation mark just above the head of the unit "- config.COLLISION_MESH_RADIUS - 10"
      const exclamationMark = withinCameraBounds({ x: marker.x, y: marker.y - config.COLLISION_MESH_RADIUS * 2 + 8 });

      // Draw Attention Icon to show the enemy will hurt you next turn
      // 1/zoom keeps the attention marker the same size regardless of the level of zoom
      // Math.sin... makes the attention marker swell and shink so it grabs the player's attention so they
      // know that they're in danger
      ImmediateMode.draw('attention_sword.png', exclamationMark, (1 / zoom) + (Math.sin(Date.now() / 500) + 1) / 3);
    }

  }
  // Returns true if it is the current players turn
  isMyTurn() {
    return this.turn_phase == turn_phase.PlayerTurns
      && this.playerTurnIndex === this.players.findIndex(p => p === window.player)
  }
  // Caution: Be careful when changing clean up code.  There are times when you just want to
  // clean up assets and then there are times when you want to clear and empty the arrays
  // Be sure not to confuse them.
  // cleanup cleans up all assets that must be manually removed (for now `Image`s)
  // if an object stops being used.  It does not empty the underworld arrays, by design.
  cleanup() {
    readyState.set('underworld', false);

    removeUnderworldEventListeners();

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
    // Clean up doodads
    containerDoodads.removeChildren();
    // Clean up board
    containerBoard.removeChildren();
    // Prevent requestAnimationFrame from calling this method next time, since this underworld
    // instance is being cleaned up
    if (requestAnimationFrameGameLoopId !== undefined) {
      cancelAnimationFrame(requestAnimationFrameGameLoopId);
    }
    // @ts-ignore
    window.underworld = undefined;
    readyState.set('underworld', false);
    window.updateInGameMenuStatus()

  }
  // cacheWalls updates underworld.walls array
  // with the walls for the edge of the map
  // and the walls from the current obstacles
  // TODO:  this will need to be called if objects become
  // destructable
  cacheWalls(obstacles: Obstacle.IObstacle[]) {
    const mapBounds: Polygon = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: this.height },
        { x: this.width, y: this.height },
        { x: this.width, y: 0 },
      ], inverted: true
    };
    // walls block sight
    this.walls = mergeOverlappingPolygons([...obstacles.filter(o => o.wall).map(o => o.bounds), mapBounds]).map(polygonToPolygonLineSegments).flat();
    // Expand pathing walls by the size of the regular unit
    // bounds block movement
    this.bounds = mergeOverlappingPolygons([...obstacles.map(o => o.bounds), mapBounds]).map(polygonToPolygonLineSegments).flat();

    const expandMagnitude = config.COLLISION_MESH_RADIUS * config.NON_HEAVY_UNIT_SCALE
    // pathing polygons determines the area that units can move within
    this.pathingPolygons = mergeOverlappingPolygons([...obstacles.map(o => o.bounds), mapBounds]).map(p => expandPolygon(p, expandMagnitude));

    // Process the polygons into pathingwalls for use in tryPath
    this.pathingLineSegments = this.pathingPolygons.map(polygonToPolygonLineSegments).flat();
  }
  spawnPickup(index: number, coords: Vec2) {
    const pickup = Pickup.pickups[index];
    if (pickup) {
      Pickup.create(
        coords.x,
        coords.y,
        pickup,
        true,
        0.1,
        true,
      );
    } else {
      console.error('Could not find pickup with index', index);
    }
  }
  spawnEnemy(id: string, coords: Vec2, isArmored: boolean, strength: number) {
    const sourceUnit = allUnits[id];
    if (!sourceUnit) {
      console.error('Unit with id', id, 'does not exist.  Have you registered it in src/units/index.ts?');
      return;
    }
    if (!window.enemyEncountered.includes(id)) {
      window.enemyEncountered.push(id);
      storage.set(ENEMY_ENCOUNTERED_STORAGE_KEY, JSON.stringify(window.enemyEncountered));
      Jprompt({ imageSrc: Unit.getImagePathForUnitId(id), text: id + '\n' + sourceUnit.info.description, yesText: 'Okay!', yesKey: 'Space', yesKeyText: 'Spacebar' });
    }
    let unit: Unit.IUnit = Unit.create(
      sourceUnit.id,
      coords.x,
      coords.y,
      Faction.ENEMY,
      sourceUnit.info.image,
      UnitType.AI,
      sourceUnit.info.subtype,
      strength,
      sourceUnit.unitProps
    );

    if (isArmored) {
      unit.healthMax *= 2;
      unit.health = unit.healthMax;
      unit.damage *= 2;
      // Add subsprite to show they are armored:
      Image.addSubSprite(unit.image, 'heavy_armor');

    }

  }

  // Returns undefined if it fails to make valid LevelData
  generateRandomLevelData(levelIndex: number): LevelData | undefined {
    // Level sizes are random but have change to grow bigger as loop continues
    const maximumSize = 7;
    const sectorsWide = randInt(this.random, Math.min(maximumSize, 2 + Math.round(levelIndex / 8)), Math.min(maximumSize, 4 + (Math.round(levelIndex / 3))));
    const sectorsTall = randInt(this.random, Math.min(maximumSize, 2 + Math.round(levelIndex / 8)), Math.min(maximumSize, 4 + (Math.round(levelIndex / 3))));
    console.log('Setup: generateRandomLevel', levelIndex, sectorsWide, sectorsTall);
    // Width and height should be set immediately so that other level-building functions
    // (such as cacheWalls) have access to the new width and height
    this.width = config.OBSTACLE_SIZE * sectorsWide * config.OBSTACLES_PER_SECTOR_WIDE;
    this.height = config.OBSTACLE_SIZE * sectorsTall * config.OBSTACLES_PER_SECTOR_TALL;
    const levelData: LevelData = {
      levelIndex,
      width: this.width,
      height: this.height,
      obstacles: [],
      groundTiles: [],
      pickups: [],
      enemies: [],
      validPlayerSpawnCoords: []
    };
    let validSpawnCoords: Vec2[] = [];
    let validPortalSpawnCoords: Vec2[] = [];
    // The map is made of a matrix of obstacle sectors
    for (let i = 0; i < sectorsWide; i++) {
      for (let j = 0; j < sectorsTall; j++) {
        const randomSectorIndex = randInt(this.random,
          0,
          obstacleSectors.length - 1,
        );
        let sector = obstacleSectors[randomSectorIndex];
        // Rotate sector 0 to 3 times
        const rotateTimes = randInt(this.random, 0, 3)
        for (let x = 0; x < rotateTimes; x++) {
          // @ts-ignore
          sector = math.rotateMatrix(sector);
        }

        // obstacleIndex of 1 means non ground, so pick an obstacle at random
        const obstacleChoice = randInt(this.random, 0, 1)
        // Now that we have the obstacle sector's horizontal index (i) and vertical index (j),
        // choose a pre-defined sector and spawn the obstacles
        if (sector) {
          for (let Y = 0; Y < sector.length; Y++) {
            const rowOfObstacles = sector[Y];
            if (rowOfObstacles) {
              for (let X = 0; X < rowOfObstacles.length; X++) {
                const coordX = config.OBSTACLE_SIZE * config.OBSTACLES_PER_SECTOR_WIDE * i + config.OBSTACLE_SIZE * X + config.COLLISION_MESH_RADIUS;
                const coordY = config.OBSTACLE_SIZE * config.OBSTACLES_PER_SECTOR_WIDE * j + config.OBSTACLE_SIZE * Y + config.COLLISION_MESH_RADIUS;
                const obstacleIndex = rowOfObstacles[X];
                // obstacleIndex of 0 means ground
                if (obstacleIndex == 0) {
                  // Empty, no obstacle, take this opportunity to spawn something from the spawn list, since
                  // we know it is a safe place to spawn
                  if (i == 0 && X == 0) {
                    // Only spawn players in the left most index (X == 0) of the left most obstacle (i==0)
                    const margin = 0;
                    levelData.validPlayerSpawnCoords.push({ x: coordX + margin, y: coordY });
                  } else if (i == sectorsWide - 1 && X == rowOfObstacles.length - 1) {
                    // Only spawn the portal in the right most index of the right most obstacle
                    validPortalSpawnCoords.push({ x: coordX, y: coordY });
                  } else {
                    // Spawn pickups or units in any validSpawnCoord
                    validSpawnCoords.push({ x: coordX, y: coordY });
                  }
                  // Create ground tile
                  levelData.groundTiles.push({ x: coordX, y: coordY });
                  continue
                } else {
                  levelData.obstacles.push({ sourceIndex: obstacleChoice, coord: { x: coordX, y: coordY } });
                }

              }
            } else {
              console.error('row of obstacles is unexpectedly undefined')
            }
          }
        } else {
          console.error('sector is unexpectedly undefined')
        }
      }
    }
    // Now that obstacles have been generated, we must cache the walls so pathfinding will work
    this.cacheWalls(levelData.obstacles.map(o => Obstacle.create(o.coord, o.sourceIndex)));

    // Remove bad spawns.  This can happen if an empty space is right next to the border of the map with obstacles
    // all around it.  There is no obstacle there, but there is also no room to move because the spawn location 
    // is inside of an inverted polygon.
    levelData.validPlayerSpawnCoords = levelData.validPlayerSpawnCoords.filter(c => findPolygonsThatVec2IsInsideOf(c, this.pathingPolygons).length === 0);
    validPortalSpawnCoords = validPortalSpawnCoords.filter(c => findPolygonsThatVec2IsInsideOf(c, this.pathingPolygons).length === 0);
    validSpawnCoords = validSpawnCoords.filter(c => findPolygonsThatVec2IsInsideOf(c, this.pathingPolygons).length === 0);

    // Spawn portal
    const index = randInt(this.random, 0, validPortalSpawnCoords.length - 1);
    const portalCoords = validPortalSpawnCoords.splice(index, 1)[0];
    if (!portalCoords) {
      console.log('Bad level seed, not enough valid spawns for portal, regenerating');
      return;
    }

    // Recache walls now that unreachable areas have been filled in
    this.cacheWalls(levelData.obstacles.map(o => Obstacle.create(o.coord, o.sourceIndex)));

    // Exclude player spawn coords that cannot path to the portal
    levelData.validPlayerSpawnCoords = levelData.validPlayerSpawnCoords.filter(spawn => {
      const path = findPath(spawn, portalCoords, this.pathingPolygons, this.pathingLineSegments);
      const lastPointInPath = path[path.length - 1]
      return path.length != 0 && (lastPointInPath && Vec.equal(lastPointInPath, portalCoords));
    });

    if (levelData.validPlayerSpawnCoords.length === 0) {
      console.log('Bad level seed, no place to spawn players, regenerating');
      return;
    }

    const numberOfPickups = sectorsWide * sectorsTall / 2;
    for (let i = 0; i < numberOfPickups; i++) {
      if (validSpawnCoords.length == 0) { break; }
      const randomPickupIndex = randInt(this.random,
        0,
        Object.values(Pickup.pickups).length - 1,
      );
      const validSpawnCoordsIndex = randInt(this.random, 0, validSpawnCoords.length - 1);
      const coord = validSpawnCoords.splice(validSpawnCoordsIndex, 1)[0];
      if (coord) {
        levelData.pickups.push({ index: randomPickupIndex, coord })
      }
    }
    // Spawn units at the start of the level
    const { enemies, strength } = getEnemiesForAltitude(levelIndex);
    for (let [id, count] of Object.entries(enemies)) {
      for (let i = 0; i < (count || 0); i++) {
        if (validSpawnCoords.length == 0) { break; }
        const validSpawnCoordsIndex = randInt(this.random, 0, validSpawnCoords.length - 1);
        const coord = validSpawnCoords.splice(validSpawnCoordsIndex, 1)[0];
        if (coord) {
          const roll = randInt(this.random, 0, 100);
          const isArmored = (roll <= config.PERCENT_CHANCE_OF_HEAVY_UNIT);
          levelData.enemies.push({ id, coord, strength, isArmored })
        }
      }
    }

    if (levelData.validPlayerSpawnCoords.length < this.players.length) {
      console.log('Bad level seed, not enough valid spawns for players, regenerating', levelData.validPlayerSpawnCoords.length, this.players.length);
      return;
    }
    return levelData;

  }
  addGroundTileImages() {
    for (let coord of this.groundTiles) {
      Image.create(coord, 'tiles/ground.png', containerBoard);
    }
  }
  // ringLimit limits how far away from the spawnSource it will check for valid spawn locations
  // same as below "findValidSpanws", but shortcircuits at the first valid spawn found and returns that
  findValidSpawn(spawnSource: Vec2, ringLimit?: number): Vec2 | undefined {
    // Enough rings to cover the whole map
    const honeycombRings = ringLimit || Math.max(this.width / 2 / config.COLLISION_MESH_RADIUS, this.height / 2 / config.COLLISION_MESH_RADIUS);
    for (let s of math.honeycombGenerator(config.COLLISION_MESH_RADIUS, spawnSource, honeycombRings)) {
      const attemptSpawn = { ...s, radius: config.COLLISION_MESH_RADIUS };
      // Ensure attemptSpawn isn't inside of pathingPolygons
      if (findPolygonsThatVec2IsInsideOf(attemptSpawn, this.pathingPolygons).length === 0) {
        // Return the first valid spawn found
        return attemptSpawn
      }
    }
    return undefined;
  }
  // Same as above "findValidSpawn", but returns an array of valid spawns
  findValidSpawns(spawnSource: Vec2, radius: number = config.COLLISION_MESH_RADIUS / 4, ringLimit?: number): Vec2[] {
    const validSpawns: Vec2[] = [];
    // Enough rings to cover the whole map
    const honeycombRings = ringLimit || Math.max(this.width / 2 / config.COLLISION_MESH_RADIUS, this.height / 2 / config.COLLISION_MESH_RADIUS);
    // The radius passed into honeycombGenerator is how far between vec2s each honeycomb cell is
    for (let s of math.honeycombGenerator(radius, spawnSource, honeycombRings)) {
      // attemptSpawns radius must be the full config.COLLISION_MESH_RADIUS to ensure
      // that the spawning unit wont intersect something it shouldn't
      const attemptSpawn = { ...s, radius: config.COLLISION_MESH_RADIUS };
      // Ensure attemptSpawn isn't inside of pathingPolygons
      if (findPolygonsThatVec2IsInsideOf(attemptSpawn, this.pathingPolygons).length === 0) {
        // Return the first valid spawn found
        validSpawns.push(attemptSpawn);
      }
    }
    return validSpawns;

  }

  cleanUpLevel() {
    // Now that it's a new level clear out the level's dodads such as
    // bone dust left behind from destroyed corpses
    containerDoodads.removeChildren();
    // Clean previous level info
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      // Clear all remaining AI units
      if (u && u.unitType === UnitType.AI) {
        Unit.cleanup(u);
        this.units.splice(i, 1);
      }
    }
    // Now that the units have been cleaned up syncPredictionUnits
    // so they are not out of sync with the underworld units array
    this.syncPredictionUnits();
    // Clear all pickups
    for (let p of this.pickups) {
      Pickup.removePickup(p);
    }
    // Clear all wall images:
    // Note: walls are stored in container Units so they can be sorted z-index
    // along with units
    // so this removes all unit images too.
    containerUnits.removeChildren();

    // Clear all floor images
    containerBoard.removeChildren();
    this.groundTiles = [];

    // Clear card usage counts, otherwise players will be
    // incentivied to bum around after a level to clear it themselves
    // which would be a bad player experience
    for (let p of this.players) {
      p.cardUsageCounts = {};
    }
  }
  postSetupLevel() {
    // Set the first turn phase
    this.broadcastTurnPhase(turn_phase.PlayerTurns);
    cameraAutoFollow(true);
  }
  // creates a level from levelData
  createLevel(levelData: LevelData) {
    console.log('Setup: createLevel', levelData);
    window.lastLevelCreated = levelData;
    // Clean up the previous level
    this.cleanUpLevel();

    const { levelIndex, width, height, obstacles, groundTiles, pickups, enemies, validPlayerSpawnCoords } = levelData;
    this.levelIndex = levelIndex;
    this.width = width;
    this.height = height;
    const obstacleInsts = [];
    for (let o of obstacles) {
      const obstacleInst = Obstacle.create(o.coord, o.sourceIndex);
      Obstacle.addImageForObstacle(obstacleInst);
      obstacleInsts.push(obstacleInst);
    }
    this.cacheWalls(obstacleInsts);
    this.groundTiles = groundTiles;
    this.addGroundTileImages();
    for (let p of pickups) {
      this.spawnPickup(p.index, p.coord);
    }
    for (let e of enemies) {
      this.spawnEnemy(e.id, e.coord, e.isArmored, e.strength);
    }
    // validPlayerSpawnCoords must be set before resetting the player
    // so the player has coords to spawn into
    this.validPlayerSpawnCoords = validPlayerSpawnCoords;
    for (let player of this.players) {
      Player.resetPlayerForNextLevel(player);
    }
    this.postSetupLevel();
    // Show text in center of screen for the new level
    floatingText({
      coords: {
        x: this.width / 2,
        y: 3 * this.height / 8,
      },
      text: `Level ${this.levelIndex + 1}`,
      style: {
        fill: 'white',
        fontSize: '60px'
      }
    });
  }
  async initLevel(levelIndex: number) {
    if (window.hostClientId === window.clientId) {
      console.log('Setup: initLevel as host', levelIndex);
      this.levelIndex = levelIndex;
      // Generate level
      let level;
      do {
        // Invoke generateRandomLevel again until it succeeds
        level = this.generateRandomLevelData(levelIndex);
      } while (level === undefined);
      window.pie.sendData({
        type: MESSAGE_TYPES.CREATE_LEVEL,
        level
      });
    }
  }
  initHandcraftedLevel(name: string) {
    // Width and height should be set immediately so that other level-building functions
    // (such as cacheWalls) have access to the new width and height
    const sectorsWide = 4;
    const sectorsTall = 2;
    this.width = config.OBSTACLE_SIZE * sectorsWide * config.OBSTACLES_PER_SECTOR_WIDE;
    this.height = config.OBSTACLE_SIZE * sectorsTall * config.OBSTACLES_PER_SECTOR_TALL;
    setView(View.Game);
    console.log('Setup: initHandcraftedLevel', name);
    const level = levels[name];
    if (!level) {
      console.error('Handcrafted level', name, 'does not exist');
      return;
    }
    const h: HandcraftedLevel = level(this);
    if (!h) {
      console.error('Handcrafted level', name, 'does not exist');
      return;
    }
    // Set valid player spawns before cleaning up the previous level
    this.validPlayerSpawnCoords = h.playerSpawnLocations;

    // Clean up the previous level
    this.cleanUpLevel();

    // Setup players
    for (let player of this.players) {
      console.log('setup players', player);
      Player.resetPlayerForNextLevel(player);
      // Clear all player cards
      removeCardsFromHand(player, player.cards);
      if (h.startingCards.length) {
        for (let card of h.startingCards) {
          const cardInstance = Cards.allCards[card];
          if (cardInstance) {
            addCardToHand(cardInstance, player);
          } else {
            console.error('Card instance for', card, 'not found');
          }
        }
      }
    }
    // Spawn portal
    const portalPickup = Pickup.specialPickups['portal'];
    if (portalPickup) {
      if (h.portalSpawnLocation) {
        Pickup.create(
          h.portalSpawnLocation.x,
          h.portalSpawnLocation.y,
          portalPickup,
          false,
          portalPickup.animationSpeed,
          true,
        );
      }
    } else {
      console.error('Portal pickup not found')
    }

    // Spawn pickups
    for (let p of h.specialPickups) {
      const pickup = Pickup.specialPickups[p.id];
      if (pickup) {
        Pickup.create(
          p.location.x,
          p.location.y,
          pickup,
          true,
          0.1,
          true,
        );
      } else {
        console.error('Pickup', p.id, 'not found in special pickups')
      }

    }
    // Create ground tiles:
    for (let x = 0; x < this.width / config.OBSTACLE_SIZE; x++) {
      for (let y = 0; y < this.height / config.OBSTACLE_SIZE; y++) {
        Image.create({ x: x * config.OBSTACLE_SIZE, y: y * config.OBSTACLE_SIZE }, 'tiles/ground.png', containerBoard);
      }
    }

    // Spawn obstacles
    const obstacles = [];
    for (let o of h.obstacles) {
      // -1 to let 0 be empty (no obstacle) and 1 will be index 0 of
      // obstacleSource
      const obstacleIndex = parseInt(o.id) - 1
      const obstacleInst = Obstacle.create(o.location, obstacleIndex);
      obstacles.push(obstacleInst);
      Obstacle.addImageForObstacle(obstacleInst);
    }
    this.cacheWalls(obstacles);

    // Spawn doodads
    for (let d of h.doodads) {
      const pixiText = new PIXI.Text(d.text, Object.assign({ fill: 'white' }, d.style));
      pixiText.x = d.location.x;
      pixiText.y = d.location.y;
      pixiText.anchor.x = 0.5;
      pixiText.anchor.y = 0.5;
      containerDoodads.addChild(pixiText);
    }

    // Spawn units
    for (let u of h.units) {
      this.spawnEnemy(u.id, u.location, false, 1);
    }

    if (h.init) {
      h.init(this);
    }

    this.postSetupLevel();
    // Show text in center of screen for the new level
    floatingText({
      coords: {
        x: this.width / 2,
        y: 3 * this.height / 8,
      },
      text: name,
      style: {
        fill: 'white',
        fontSize: '60px'
      }
    });

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
  isGameOver(): boolean {
    return !this.players.some(p => p.unit.alive);
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
      } else {
        console.log('PlayerTurn: Check end player turn phase', this.playerTurnIndex, this.players.length);
      }
    }
    return false;
  }
  endPlayerTurnPhase() {
    console.log('Underworld: TurnPhase: End player turn phase');
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
        const cardUsage = p.cardUsageCounts[cardId];
        if (cardUsage !== undefined) {
          p.cardUsageCounts[cardId] = Math.max(0, cardUsage - 1);
        }
      }
    }
    updateManaCostUI();
    // Move onto next phase
    // Note: BroadcastTurnPhase should happen last because it
    // queues up a unitsync, so if changes to the units
    // were to happen AFTER broadcastTurnPhase they would be
    // overwritten when the sync occurred
    this.broadcastTurnPhase(turn_phase.NPC);
  }

  async endNPCTurnPhase() {
    // Move onto next phase
    // --
    // Note: The reason this logic happens here instead of in initializeTurnPhase
    // is because initializeTurnPhase needs to be called on game load to put everything
    // in a good state when updating to the canonical client's game state. (this 
    // happens when one client disconnects and rejoins).  If playerTurnIndex were
    // reset in initializeTurnPhase, a client reconnecting would also reset the 
    // playerTurnIndex (which is not desireable because it's trying to LOAD the
    // game state).  Instead, it's handled here, when the NPC turn phase ends
    // so that clients CAN reconnect mid player turn and the playerTurnIndex is 
    // maintained
    // --
    // Trigger onTurnEnd Events
    for (let unit of this.units.filter(u => u.unitType === UnitType.AI)) {
      await Promise.all(unit.onTurnEndEvents.map(
        async (eventName) => {
          const fn = Events.onTurnEndSource[eventName];
          return fn ? await fn(unit) : false;
        },
      ));
    }
    // Increment the turn number now that it's starting over at the first phase
    this.turn_number++;

    this.broadcastTurnPhase(turn_phase.PlayerTurns);
  }
  syncTurnMessage() {
    const currentPlayerTurn = this.players[this.playerTurnIndex];
    console.log('syncTurnMessage: phase:', turn_phase[this.turn_phase], '; player:', this.playerTurnIndex)
    let message = '';
    let yourTurn = false;
    if (turn_phase[this.turn_phase] === 'NPC') {
      message = "Enemys' Turn";
      yourTurn = false;
    } else if (currentPlayerTurn === window.player) {
      message = 'Your Turn'
      yourTurn = true;
    } else if (this.isGameOver()) {
      message = 'Game Over';
      yourTurn = false;
    } else {
      message = `Player ${this.playerTurnIndex + 1}'s turn`
      yourTurn = false;
    }
    if (elPlayerTurnIndicator) {
      elPlayerTurnIndicator.innerText = message;
    }
    document.body.classList.toggle('your-turn', yourTurn);

    // Update level indicator UI at top of screen
    if (elLevelIndicator) {
      elLevelIndicator.innerText = `Level ${this.levelIndex}`;
    } else {
      console.error('elLevelIndicator is null');
    }
  }
  async initializePlayerTurn(playerIndex: number) {
    const player = this.players[playerIndex];
    if (!player) {
      console.error("Attempted to initialize turn for a non existant player index", playerIndex)
      console.trace('Attempted to initialize nonexistant player trace')
      return
    }
    // Give mana at the start of turn
    const manaTillFull = player.unit.manaMax - player.unit.mana;
    // Give the player their mana per turn but don't let it go beyond manaMax
    // It's implemented this way instead of an actual capping in a setter so that
    // mana CAN go beyond max for other reasons (like mana potions), by design
    if (player.unit.alive) {
      player.unit.mana += Math.max(0, Math.min(player.unit.manaPerTurn, manaTillFull));
    }

    // If this current player is NOT able to take their turn...
    if (!Player.ableToTakeTurn(player)) {
      // Skip them
      this.endPlayerTurn(player.clientId);
      // Do not continue with initialization
      return;
    }
    if (player == window.player) {
      // Notify the current player that their turn is starting
      centeredFloatingText(`Your Turn`);

    }
    // Trigger onTurnStart Events
    const onTurnStartEventResults: boolean[] = await Promise.all(player.unit.onTurnStartEvents.map(
      async (eventName) => {
        const fn = Events.onTurnStartSource[eventName];
        return fn ? await fn(player.unit, false) : false;
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
    this.syncTurnMessage();
  }
  // Sends a network message to end turn
  async endMyTurn() {
    if (window.player) {
      // Turns can only be manually ended during the PlayerTurns phase
      if (this.isMyTurn()) {
        let affirm = true
        if (window.player.unit.stamina == window.player.unit.staminaMax && !window.castThisTurn) {
          affirm = await Jprompt({ text: 'Are you sure you want to end your turn without moving or casting?', noBtnText: 'Cancel', noBtnKey: 'Escape', yesText: 'End Turn', yesKey: 'Space', yesKeyText: 'Spacebar' });
        }
        if (affirm) {
          console.log('endMyTurn: send END_TURN message');
          window.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
        }
      }
    }
  }
  async endPlayerTurn(clientId: string) {
    console.log('endPlayerTurn', clientId)
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
    // Ensure players can only end the turn when it IS their turn
    if (this.turn_phase === turn_phase.PlayerTurns) {
      // Trigger onTurnEnd Events
      await Promise.all(player.unit.onTurnEndEvents.map(
        async (eventName) => {
          const fn = Events.onTurnEndSource[eventName];
          return fn ? await fn(player.unit) : false;
        },
      ));
      // Incrememt the playerTurnIndex
      // This must happen before goToNextPhaseIfAppropriate
      // which checks if the playerTurnIndex is >= the number of players
      // to see if it should go to the next phase
      this.playerTurnIndex = playerIndex + 1;
      console.log('PlayerTurn: End player turn', clientId, '; Increment player turn to', this.playerTurnIndex);
      this.syncTurnMessage();
      const wentToNextLevel = this.checkForEndOfLevel();
      if (wentToNextLevel) {
        return;
      }
      const gameIsOver = this.isGameOver();
      if (gameIsOver) {
        // Prevent infinite loop since there are no players
        // alive it would continue to loop endlessly and freeze up
        // the game if it didn't early return here
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
  }
  chooseUpgrade(player: Player.IPlayer, upgrade: Upgrade.IUpgrade) {
    upgrade.effect(player);
    player.upgrades.push(upgrade);
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
      if (this.nextHandCraftedLevel) {
        const levelName = this.nextHandCraftedLevel;
        // Clear it out so it doesn't keep sending users to the same level
        this.nextHandCraftedLevel = undefined;
        this.initHandcraftedLevel(levelName);
      } else {
        // Now that level is complete, move to the Upgrade view where players can choose upgrades
        // before moving on to the next level
        // Generate Upgrades
        if (!elUpgradePicker || !elUpgradePickerContent) {
          console.error('elUpgradePicker or elUpgradePickerContent are undefined.');
        }
        const player = this.players.find(
          (p) => p.clientId === window.clientId,
        );
        if (player) {
          const upgrades = Upgrade.generateUpgrades(player);
          const elUpgrades = upgrades.map((upgrade) =>
            Upgrade.createUpgradeElement(upgrade, player),
          );
          if (elUpgradePickerContent) {
            elUpgradePickerContent.innerHTML = '';
            for (let elUpgrade of elUpgrades) {
              elUpgradePickerContent.appendChild(elUpgrade);
            }
          }
        } else {
          console.error('Upgrades cannot be generated, player not found');
        }
        // Make upgrades visible
        setView(View.Upgrade);

        // Invoke initLevel within a timeout so that this function
        // doesn't have to wait for level generation to complete before
        // returning
        setTimeout(() => {
          // Prepare the next level
          this.initLevel(++this.levelIndex);
        }, 0)
      }
      // Return of true signifies it went to the next level
      return true;
    }
    return false;
  }
  getRandomCoordsWithinBounds(bounds: Bounds): Vec2 {
    const x = randInt(this.random, bounds.xMin || 0, bounds.xMax || this.width);
    const y = randInt(this.random, bounds.yMin || 0, bounds.yMax || this.height);
    return { x, y };
  }
  async broadcastTurnPhase(p: turn_phase) {
    // If host, send sync; if non-host, ignore 
    if (window.hostClientId === window.clientId) {
      window.pie.sendData({
        type: MESSAGE_TYPES.SET_PHASE,
        phase: p,
        units: this.units.map(Unit.serialize),
        players: this.players.map(Player.serialize)
      });
    }
  }
  // sets underworld.turn_phase variable and syncs related html classes
  // Do not confuse with initializeTurnPhase which runs initialization
  // logic when the turn phase changes.  Note: initializeTurnPhase
  // calls this function
  setTurnPhase(p: turn_phase) {
    console.log('setTurnPhase(', turn_phase[p], ')');
    this.turn_phase = p;

    // Remove all phase classes from body
    for (let phaseClass of document.body.classList.values()) {
      if (phaseClass.includes('phase-')) {
        document.body.classList.remove(phaseClass);
      }
    }
    const phase = turn_phase[this.turn_phase];
    if (phase) {
      // Add current phase class to body
      document.body.classList.add('phase-' + phase.toLowerCase());
    } else {
      console.error('Invalid turn phase', this.turn_phase)
    }

  }
  // Initialization logic that runs to setup a change of turn_phase
  // Invoked only through wsPie, use broadcastTurnPhase in game logic
  // when you want to set the turn_phase
  async initializeTurnPhase(p: turn_phase) {
    console.log('initializeTurnPhase(', turn_phase[p], ')');
    // Reset to first player's turn
    this.playerTurnIndex = 0;

    // Clear cast this turn
    window.castThisTurn = false;

    // Clear debug graphics
    window.debugGraphics.clear()

    // Change the underworld.turn_phase variable and
    // related html classes that are used by the UI to
    // know what turn phase it is
    this.setTurnPhase(p);

    // Clean up invalid units
    const keepUnits = [];
    for (let u of this.units) {
      if (!u.flaggedForRemoval) {
        keepUnits.push(u);
      }
    }
    this.units = keepUnits;

    const phase = turn_phase[this.turn_phase];
    if (phase) {
      switch (phase) {
        case 'PlayerTurns':

          for (let u of this.units.filter(u => u.unitType == UnitType.PLAYER_CONTROLLED)) {
            // Reset stamina for player units so they can move again
            u.stamina = u.staminaMax;
          }
          // Lastly, initialize the player turns.
          // Note, it is possible that calling this will immediately end
          // the player phase (if there are no players to take turns)
          console.log('PlayerTurn: Change to PlayerTurns phase and initialize player with index', this.playerTurnIndex);
          this.initializePlayerTurn(this.playerTurnIndex);
          break;
        case 'NPC':
          for (let u of this.units.filter(u => u.unitType == UnitType.AI)) {
            // Reset stamina for non-player units so they can move again
            u.stamina = u.staminaMax;
          }
          // Clear enemy attentionMarkers since it's now their turn
          window.attentionMarkers = [];
          (async () => {
            // Run AI unit actions
            // Ally NPCs go first
            await this.executeNPCTurn(Faction.ALLY);
            await this.executeNPCTurn(Faction.ENEMY);
            // Set turn phase to player turn
            this.endNPCTurnPhase();
          })();
          break;
        default:
          break;
      }
    } else {
      console.error('Invalid turn phase', this.turn_phase)
    }
    this.syncTurnMessage();
  }

  async executeNPCTurn(faction: Faction) {
    console.log('game: executeNPCTurn', Faction[faction]);
    const animationPromises: Promise<void>[] = [];
    unitloop: for (let u of this.units.filter(
      (u) => u.unitType === UnitType.AI && u.alive && u.faction == faction,
    )) {
      // Trigger onTurnStart Events
      const abortTurn = await Unit.runTurnStartEvents(u);
      if (abortTurn) {
        continue unitloop;
      }
      const unitSource = allUnits[u.unitSourceId];
      if (unitSource) {
        const target = this.getUnitAttackTarget(u);
        // Add unit action to the array of promises to wait for
        // TODO: Prevent grunts from attacking if they are out of range
        // like when they are around a corner
        let promise = unitSource.action(u, target, this.canUnitAttackTarget(u, target));
        animationPromises.push(promise);
      } else {
        console.error(
          'Could not find unit source data for',
          u.unitSourceId,
        );
      }
    }
    await Promise.all(animationPromises);

  }
  canUnitAttackTarget(u: Unit.IUnit, attackTarget?: Unit.IUnit): boolean {
    if (!attackTarget) {
      return false;
    }
    switch (u.unitSubType) {
      case UnitSubType.MELEE:
        this.setPath(u, attackTarget);
        if (u.path) {
          const maxPathDistance = u.attackRange + u.staminaMax;
          const dist = calculateDistanceOfVec2Array([u, ...u.path.points]);
          return !!u.path.points.length && dist <= maxPathDistance;
        } else {
          return false;
        }
      case UnitSubType.RANGED_LOS:
        return window.underworld.hasLineOfSight(u, attackTarget)
      case UnitSubType.RANGED_RADIUS:
        return u.alive && Unit.inRange(u, attackTarget);
      default:
        console.error('Cannot determine canUnitAttackTarget, unit sub type is unaccounted for', u.unitSubType)
        return false;
    }

  }
  getUnitAttackTarget(u: Unit.IUnit): Unit.IUnit | undefined {
    switch (u.unitSubType) {
      case UnitSubType.MELEE:
        return Unit.findClosestUnitInDifferentFaction(u);
        break;
      case UnitSubType.RANGED_LOS:
        return getBestRangedLOSTarget(u);
        break;
      case UnitSubType.RANGED_RADIUS:
        return Unit.findClosestUnitInDifferentFaction(u);
        break;
      case UnitSubType.PLAYER_CONTROLLED:
        // Ignore player controlled units, they don't get an attack target assigned by
        // the game, they choose their own.
        return undefined;
        break;
      default:
        console.error('Cannot determine attackTarget, unit sub type is unaccounted for', u.unitSubType)
        return undefined;
    }
  }

  getUnitsWithinDistanceOfTarget(
    target: Vec2,
    distance: number,
    prediction: boolean,
  ): Unit.IUnit[] {
    const withinDistance: Unit.IUnit[] = [];
    const units = prediction ? window.predictionUnits : this.units;
    for (let unit of units) {
      if (math.distance(unit, target) <= distance) {
        withinDistance.push(unit);
      }
    }
    return withinDistance;
  }
  getUnitAt(coords: Vec2, prediction?: boolean): Unit.IUnit | undefined {
    const sortedByProximityToCoords = (prediction ? window.predictionUnits : this.units)
      // Filter for only valid units, not units with NaN location or waiting to be removed
      .filter(u => !u.flaggedForRemoval && !isNaN(u.x) && !isNaN(u.y))
      // Filter for units within COLLISION_MESH_RADIUS of coordinates
      .filter(u => math.distance(u, coords) <= config.COLLISION_MESH_RADIUS)
      // Order by closest to coords
      .sort((a, b) => math.distance(a, coords) - math.distance(b, coords))
      // Sort dead units to the back, prefer selecting living units
      .sort((a, b) => a.alive && b.alive ? 0 : a.alive ? -1 : 1);
    return sortedByProximityToCoords[0]
  }
  getPickupAt(coords: Vec2): Pickup.IPickup | undefined {
    const sortedByProximityToCoords = this.pickups.filter(p => !isNaN(p.x) && !isNaN(p.y)).sort((a, b) => math.distance(a, coords) - math.distance(b, coords));
    const closest = sortedByProximityToCoords[0]
    return closest && math.distance(closest, coords) <= config.COLLISION_MESH_RADIUS ? closest : undefined;
  }
  addUnitToArray(unit: Unit.IUnit, prediction: boolean) {
    if (prediction) {
      window.predictionUnits.push(unit);
    } else {
      this.units.push(unit);
    }
  }
  removePickupFromArray(pickup: Pickup.IPickup) {
    this.pickups = this.pickups.filter((p) => p !== pickup);
  }
  addPickupToArray(pickup: Pickup.IPickup) {
    this.pickups.push(pickup);
  }
  async castCards(
    casterCardUsage: Player.CardUsage,
    casterUnit: Unit.IUnit,
    cardIds: string[],
    castLocation: Vec2,
    prediction: boolean,
  ): Promise<Cards.EffectState> {
    if (!prediction && casterUnit == (window.player && window.player.unit)) {
      window.castThisTurn = true;
    }
    const unitAtCastLocation = this.getUnitAt(castLocation, prediction);
    let effectState: Cards.EffectState = {
      casterCardUsage,
      casterUnit,
      targetedUnits: unitAtCastLocation ? [unitAtCastLocation] : [],
      castLocation,
      aggregator: {
        unitDamage: [],
      },
    };
    if (!effectState.casterUnit.alive) {
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
        const singleCardCost = calculateCost([card], casterCardUsage);
        // Apply mana and health cost to caster
        // Note: it is important that this is done BEFORE a card is actually cast because
        // the card may affect the caster's mana
        effectState.casterUnit.mana -= singleCardCost.manaCost;
        Unit.takeDamage(effectState.casterUnit, singleCardCost.healthCost, prediction, effectState);
        const targets = effectState.targetedUnits.length == 0 ? [castLocation] : effectState.targetedUnits
        for (let target of targets) {

          // Show the card that's being cast:
          if (!prediction) {
            const image = Image.create(
              target,
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
        const { targetedUnits: previousTargets } = effectState;
        effectState = await card.effect(effectState, prediction);
        // Delay animation between spells so players can understand what's going on
        if (!prediction) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, config.MILLIS_PER_SPELL_ANIMATION);
          })
        }
        // Clear images from previous card before drawing the images from the new card
        containerSpells.removeChildren();
        // Animate target additions:
        for (let targetedUnit of effectState.targetedUnits) {
          // If already included target:
          if (
            previousTargets.find((t) => t.x === targetedUnit.x && t.y === targetedUnit.y)
          ) {
            // Don't animate previous targets, they should be drawn full, immediately
            animationPromises.push(drawTarget(targetedUnit.x, targetedUnit.y, false));
          } else {
            // If a new target, animate it in
            animationPromises.push(drawTarget(targetedUnit.x, targetedUnit.y, !prediction));
          }
        }

        await Promise.all(animationPromises);
        // Now that the caster is using the card, increment usage count
        if (casterCardUsage[card.id] === undefined) {
          casterCardUsage[card.id] = 0;
        }
        casterCardUsage[card.id] += card.expenseScaling;
        if (!prediction) {
          updateManaCostUI();
        }
      }
    }
    if (!prediction) {
      // Clear spell animations once all cards are done playing their animations
      containerSpells.removeChildren();
    }

    return effectState;
  }
  checkIfShouldSpawnPortal() {
    if (this.units.filter(u => u.faction == Faction.ENEMY).every(u => !u.alive)) {
      // Spawn portal near each player
      const portalPickup = Pickup.specialPickups['portal'];
      if (portalPickup) {
        for (let playerUnit of this.units.filter(u => u.unitType == UnitType.PLAYER_CONTROLLED && u.alive)) {
          const portalSpawnLocation = this.findValidSpawn(playerUnit, 2) || playerUnit;
          Pickup.create(
            portalSpawnLocation.x,
            portalSpawnLocation.y,
            portalPickup,
            false,
            portalPickup.animationSpeed,
            true,
          );
          // Give all player units max stamina for convenience:
          playerUnit.stamina = playerUnit.staminaMax;

        }
      } else {
        console.error('Portal pickup not found')
      }
    }

  }

  // hasLineOfSight returns true if there are no walls interrupting
  // a line from seer to target
  // Note: if you want a function like this that returns a Vec2, try
  // closestLineSegmentIntersection
  hasLineOfSight(seer: Vec2, target: Vec2): boolean {
    const lineOfSight: LineSegment = { p1: seer, p2: target };
    for (let w of this.walls) {
      if (lineSegmentIntersection(lineOfSight, w)) {
        return false
      }
    }
    return true
  }
  // shuffleUnits adapted from https://stackoverflow.com/a/2450976/4418836
  // Used for validating the efficacy of syncUnits
  dev_shuffleUnits() {
    let currentIndex = this.units.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      // @ts-ignore
      [this.units[currentIndex], this.units[randomIndex]] = [
        this.units[randomIndex], this.units[currentIndex]];
    }

    return this.units;
  }
  syncUnits(units: Unit.IUnitSerialized[]) {
    console.log('sync: Syncing units', units.map(u => u.id), this.units.map(u => u.id));
    // Remove excess units if local copy of units has more units than the units it
    // should be syncing with
    if (this.units.length > units.length) {
      console.log('sync: Remove excess units')
      for (let i = units.length; i < this.units.length; i++) {
        const unit = this.units[i];
        if (unit) {
          Unit.cleanup(unit);
        }
      }
      this.units.splice(units.length);
    }
    for (let i = 0; i < units.length; i++) {
      const syncUnit = units[i];
      const currentUnit = this.units[i];
      if (syncUnit) {
        if (currentUnit) {
          // Note: Unit.syncronize maintains the player.unit reference
          Unit.syncronize(syncUnit, currentUnit);
        } else {
          const newUnit = Unit.create(syncUnit.unitSourceId, syncUnit.x, syncUnit.y, syncUnit.faction, syncUnit.defaultImagePath, syncUnit.unitType, syncUnit.unitSubType, syncUnit.strength);
          Unit.syncronize(syncUnit, newUnit);
        }
      }
    }

  }
  // Sends what this player is thinking to other clients
  // Optimized to only send if message has changed
  sendPlayerThinking(thoughts: { target?: Vec2, cardIds: string[] }) {
    // Only send your thoughts on your turn
    if (this.isMyTurn()) {
      let { target, cardIds } = thoughts;
      // Since it takes a hash, best to round target
      // to whole numbers so floating point changes
      // don't create a different hash
      if (target) {
        target = Vec.round(target);
      }
      const hash = objectHash({ target, cardIds });
      if (hash !== window.lastThoughtsHash) {
        window.lastThoughtsHash = hash;
        window.pie.sendData({
          type: MESSAGE_TYPES.PLAYER_THINKING,
          target,
          cardIds
        });
      }
    }

  }
  // Returns an array of newly created players
  ensureAllClientsHaveAssociatedPlayers(clients: string[]): Player.IPlayer[] {
    let newlyCreatedPlayers: Player.IPlayer[] = [];
    // Ensure all clients have players
    for (let clientId of clients) {
      const player = this.players.find(p => p.clientId == clientId);
      if (!player) {
        // If the client that joined does not have a player yet, make them one immediately
        // since all clients should always have a player associated
        console.log(`Setup: Create a Player instance for ${clientId}`)
        const p = Player.create(clientId);
        Player.resetPlayerForNextLevel(p);
        newlyCreatedPlayers.push(p);
      }
    }
    // Sync all players' connection statuses with the clients list
    // This ensures that there are no players left that think they're connected
    // but are not a part of the clients list
    for (let player of this.players) {
      const wasConnected = player.clientConnected;
      const isConnected = clients.includes(player.clientId);
      Player.setClientConnected(player, isConnected);
      if (!wasConnected && isConnected) {
        // Send the lastest gamestate to that client so they can be up-to-date:
        // Note: It is important that this occurs AFTER the player instance is created for the
        // client who just joined
        // If the game has already started (e.g. the host has already joined), send the initial state to the new 
        // client only so they can load
        hostGiveClientGameStateForInitialLoad(player.clientId);
      }
    }
    // if host left, reassign host
    const hostPlayer = this.players.find(p => p.clientId == window.hostClientId);
    if (!(hostPlayer && hostPlayer.clientConnected) && clients[0] !== undefined) {
      // Set host to the 0th client that is still connected
      window.hostClientId = clients[0];
      if (window.hostClientId === window.clientId) {
        console.log(`Setup: Host client left, reassigning host to ${window.hostClientId}. % c You are the host. `, 'background: #222; color: #bada55');
      } else {
        console.log(`Setup: Host client left, reassigning host to ${window.hostClientId}.`);
      }
    }
    return newlyCreatedPlayers;
  }
  syncPlayers(players: Player.IPlayerSerialized[]) {
    console.log('sync: Syncing players', JSON.stringify(players.map(p => p.clientId)));
    // Clear previous players array
    this.players = [];
    players.map(Player.load);
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
    const { random, players, units, pickups, walls, pathingPolygons, ...rest } = this;
    return {
      ...rest,
      players: this.players.map(Player.serialize),
      units: this.units.map(Unit.serialize),
      pickups: this.pickups.map(Pickup.serialize),
      // the state of the Random Number Generator
      RNGState: this.random.state(),
    };
  }
  // Updates specifically selected properties of underworld
  // Mutates current object
  // The purpose of this function is to keep underworld in sync
  // between clients
  // syncronize(serialized: IUnderworldSerializedForSyncronize) {
  //   if (serialized.RNGState) {
  //     this.syncronizeRNG(serialized.RNGState);
  //   }
  //   this.levelIndex = serialized.levelIndex;
  //   this.turn_phase = serialized.turn_phase;
  //   this.playerTurnIndex = serialized.playerTurnIndex;
  //   this.turn_number = serialized.turn_number;
  //   this.height = serialized.height;
  //   this.width = serialized.width;
  //   // Note: obstacles are not serialized since they are unchanging between levels
  //   // TODO, remove walls and pathingPolygons here, they are set in cacheWalls, so this is redundant
  //   // make sure obstacles come over when serialized
  //   this.walls = serialized.walls;
  //   this.pathingPolygons = serialized.pathingPolygons;
  //   this.processedMessageCount = this.processedMessageCount;
  //   this.addGroundTileImages();
  //   this.cacheWalls();
  // }
  serializeForSyncronize(): IUnderworldSerializedForSyncronize {
    const { players, units, pickups, random, processedMessageCount, ...rest } = this;
    const serialized: IUnderworldSerializedForSyncronize = {
      ...rest,
      // the state of the Random Number Generator
      RNGState: this.random.state() as SeedrandomState,
    }
    return serialized;
  }
}

function drawTarget(x: number, y: number, animate: boolean): Promise<void> {
  const image = Image.create({ x, y }, 'target.png', containerSpells);
  if (animate) {
    image.sprite.scale.set(0.0);
    return Image.scale(image, 1.0);
  } else {
    return Promise.resolve();
  }
}
type IUnderworldSerialized = Omit<typeof Underworld, "prototype" | "players" | "units" | "pickups" | "random" | "turnInterval"
  // walls and pathingPolygons are omitted because they are derived from obstacles when cacheWalls() in invoked
  | "walls" | "pathingPolygons"> & {
    players: Player.IPlayerSerialized[],
    units: Unit.IUnitSerialized[],
    pickups: Pickup.IPickupSerialized[],
  };
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type UnderworldNonFunctionProperties = Exclude<NonFunctionPropertyNames<Underworld>, null | undefined>;
export type IUnderworldSerializedForSyncronize = Omit<Pick<Underworld, UnderworldNonFunctionProperties>, "debugGraphics" | "players" | "units" | "pickups" | "obstacles" | "random" | "processedMessageCount">;


function getEnemiesForAltitude(levelIndex: number): { enemies: { [unitid: string]: number }, strength: number } {
  const hardCodedLevelEnemies: { [unitid: string]: number }[] = [
    {
      'grunt': 4,
    },
    {
      'grunt': 3,
      'archer': 2
    },
    {
      'grunt': 3,
      'archer': 2,
      'lobber': 1,
    },
    {
      'grunt': 7,
      'archer': 3,
      'lobber': 2,
    },
    {
      'grunt': 2,
      'archer': 2,
      'summoner': 1,
    },
    {
      'summoner': 3,
      'archer': 3
    },
    {
      'grunt': 9,
      'vampire': 1,
    },
    {
      'grunt': 3,
      'archer': 4,
      'lobber': 1,
      'priest': 2,
    },
    {
      'grunt': 3,
      'archer': 2,
      'lobber': 1,
      'priest': 2,
      'poisoner': 1,
      'vampire': 1,
    },
    {
      'grunt': 12,
      'demon': 1
    },
    {
      'grunt': 5,
      'archer': 3,
      'lobber': 2,
      'priest': 2,
      'poisoner': 1,
      'demon': 1,
    },
  ];
  // Loop allows users to continue playing after the final level, it will 
  // multiply the previous levels by the loop number
  // Default loop at 1
  const loop = Math.max(1, Math.floor(levelIndex / hardCodedLevelEnemies.length))
  const strength = loop + window.underworld.players.length - 1;
  if (levelIndex >= hardCodedLevelEnemies.length) {
    levelIndex = levelIndex % hardCodedLevelEnemies.length;
  }

  const enemies = hardCodedLevelEnemies[levelIndex];
  console.log('Level: Creating enemies with strength', strength)
  if (enemies) {
    return {
      enemies: Object.fromEntries(Object.entries(enemies).map(([unitId, quantity]) => [unitId, quantity * loop])),
      strength
    };
  } else {
    // This should never happen
    console.error('getEnemiesForAltitude could not find enemy information for levelIndex', levelIndex);
    return { enemies: {}, strength: 1 };
  }
}


export interface LevelData {
  levelIndex: number,
  width: number,
  height: number,
  obstacles: {
    sourceIndex: number;
    coord: Vec2;
  }[];
  groundTiles: Vec2[];
  pickups: {
    index: number;
    coord: Vec2;
  }[];
  enemies: {
    id: string,
    coord: Vec2,
    strength: number,
    isArmored: boolean
  }[];
  validPlayerSpawnCoords: Vec2[]
}