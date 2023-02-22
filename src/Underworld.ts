import seedrandom from 'seedrandom';
import * as config from './config';
import * as Unit from './entity/Unit';
import * as Doodad from './entity/Doodad';
import * as Pickup from './entity/Pickup';
import * as Obstacle from './entity/Obstacle';
import * as Player from './entity/Player';
import * as Upgrade from './Upgrade';
import * as math from './jmath/math';
import * as Cards from './cards';
import * as CardUI from './graphics/ui/CardUI';
import * as Image from './graphics/Image';
import * as storage from './storage';
import * as ImmediateMode from './graphics/ImmediateModeSprites';
import * as colors from './graphics/ui/colors';
import * as protection from './cards/protection';
import * as resurrect from './cards/resurrect';
import * as shield from './cards/shield';
import * as fortify from './cards/fortify';
import * as CSSClasses from './CSSClasses';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { MESSAGE_TYPES } from './types/MessageTypes';
import {
  app,
  containerBoard,
  containerDoodads,
  containerSpells,
  containerUnits,
  updateCameraPosition,
  cameraAutoFollow,
  getCamera,
  withinCameraBounds,
  containerPlayerThinking,
  addPixiSprite,
  graphicsBloodSmear,
  containerLiquid,
  setupLiquidFilter,
  cleanUpLiquidFilter,
  BloodParticle,
  setAbyssColor,
  setCameraToMapCenter,
  addPixiTilingSprite,
  runCinematicLevelCamera,
  cleanBlood,
  cacheBlood,
} from './graphics/PixiUtils';
import floatingText, { queueCenteredFloatingText, warnNoMoreSpellsToChoose } from './graphics/FloatingText';
import { UnitType, Faction, UnitSubType, isSinglePlayer } from './types/commonTypes';
import type { Vec2 } from "./jmath/Vec";
import * as Vec from "./jmath/Vec";
import Events from './Events';
import { allUnits } from './entity/units';
import { clearSpellEffectProjection, clearTints, drawHealthBarAboveHead, getUIBarProps, isOutOfBounds, runPredictions, updatePlanningView } from './graphics/PlanningView';
import { chooseObjectWithProbability, getUniqueSeedString, prng, randInt, SeedrandomState } from './jmath/rand';
import { calculateCostForSingleCard } from './cards/cardUtils';
import { lineSegmentIntersection, LineSegment, findWherePointIntersectLineSegmentAtRightAngle, closestLineSegmentIntersection } from './jmath/lineSegment';
import { expandPolygon, isVec2InsidePolygon, mergePolygon2s, Polygon2, Polygon2LineSegment, toLineSegments, toPolygon2LineSegments } from './jmath/Polygon2';
import { calculateDistanceOfVec2Array, findPath } from './jmath/Pathfinding';
import { keyDown, useMousePosition } from './graphics/ui/eventListeners';
import Jprompt from './graphics/Jprompt';
import { collideWithLineSegments, ForceMove, forceMovePreventForceThroughWall, isVecIntersectingVecWithCustomRadius, moveWithCollisions } from './jmath/moveWithCollision';
import { IHostApp } from './network/networkUtil';
import { withinMeleeRange } from './entity/units/actions/meleeAction';
import { baseTiles, caveSizes, convertBaseTilesToFinalTiles, generateCave, getLimits, Limits as Limits, makeFinalTileImages, Map, Tile, toObstacle } from './MapOrganicCave';
import { Material } from './Conway';
import { oneDimentionIndexToVec2, vec2ToOneDimentionIndexPreventWrap } from './jmath/ArrayUtil';
import { raceTimeout, reportIfTakingTooLong } from './Promise';
import { cleanUpEmitters, containerParticles, containerParticlesUnderUnits, makeManaTrail, updateParticlees } from './graphics/Particles';
import { elInstructions } from './network/networkHandler';
import type PieClient from '@websocketpie/client';
import { makeForcePush } from './cards/push';
import { isOutOfRange, sendPlayerThinkingThrottled } from './PlayerUtils';
import { DisplayObject, TilingSprite } from 'pixi.js';
import { HasSpace } from './entity/Type';
import { explain, EXPLAIN_MISSED_SCROLL, EXPLAIN_PING, EXPLAIN_SCROLL, isFirstTutorialStepComplete, isTutorialComplete, tutorialCompleteTask, tutorialShowTask } from './graphics/Explain';
import { makeRisingParticles, makeScrollDissapearParticles, stopAndDestroyForeverEmitter } from './graphics/ParticleCollection';
import { ensureAllClientsHaveAssociatedPlayers, Overworld } from './Overworld';
import { Emitter } from '@pixi/particle-emitter';
import { golem_unit_id } from './entity/units/golem';
import { cleanUpPerkList, createPerkElement, generatePerks, tryTriggerPerk, showPerkList, hidePerkList } from './Perk';
import { bossmasonUnitId } from './entity/units/deathmason';
import { hexToString } from './graphics/ui/colorUtil';
import { doLiquidEffect } from './inLiquid';
import { findRandomGroundLocation } from './entity/units/summoner';
import { isModActive } from './registerMod';
import { summoningSicknessId } from './modifierSummoningSickness';
import { ARCHER_ID } from './entity/units/archer';
import { BLOOD_ARCHER_ID } from './entity/units/blood_archer';
import { BLOOD_GOLEM_ID } from './entity/units/bloodGolem';
import { MANA_VAMPIRE_ID } from './entity/units/manaVampire';
import { DARK_PRIEST_ID } from './entity/units/darkPriest';

export enum turn_phase {
  // turn_phase is Stalled when no one can act
  // This may happen if all players disconnect
  Stalled,
  PlayerTurns,
  NPC_ALLY,
  NPC_ENEMY,
}
const smearJitter = [
  { x: -3, y: -3 },
  { x: 3, y: -3 },
  { x: 0, y: 3 },
]
let gameOverModalTimeout: NodeJS.Timeout;
const elUpgradePicker = document.getElementById('upgrade-picker') as (HTMLElement | undefined);
export const elUpgradePickerContent = document.getElementById('upgrade-picker-content') as (HTMLElement | undefined);
const elSeed = document.getElementById('seed') as (HTMLElement | undefined);
const elUpgradePickerLabel = document.getElementById('upgrade-picker-label') as (HTMLElement | undefined);

export const showUpgradesClassName = 'showUpgrades';

// Must be out of Underworld context, so that it can get set on the first level only
let isFirstEverPlaySession = false;
let lastTime = 0;
let requestAnimationFrameGameLoopId: number;
const cleanupRegistry = globalThis.hasOwnProperty('FinalizationRegistry') ? new FinalizationRegistry((heldValue) => {
  console.log('GC: Cleaned up ', heldValue);
}) : undefined;
let localUnderworldCount = 0;
export default class Underworld {
  seed: string;
  // A simple number to keep track of which underworld this is
  // Used for development to help ensure that all references to the underworld are current
  localUnderworldNumber: number;
  // A backreference to it's parent container
  overworld: Overworld;
  random: prng;
  pie: PieClient | IHostApp;
  // The index of the level the players are on
  levelIndex: number = -1;
  // for serializing random: prng
  RNGState?: SeedrandomState;
  turn_phase: turn_phase = turn_phase.Stalled;
  // An id incrementor to make sure no 2 units share the same id
  lastUnitId: number = -1;
  lastPickupId: number = -1;
  // A count of which turn it is, this is useful for
  // governing AI actions that occur every few turns
  // instead of every turn.  A "turn" is a full cycle,
  // meaning, players take their turn, npcs take their
  // turn, then it resets to player turn, that is a full "turn"
  turn_number: number = -1;
  limits: Limits = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  players: Player.IPlayer[] = [];
  units: Unit.IUnit[] = [];
  unitsPrediction: Unit.IUnit[] = [];
  pickups: Pickup.IPickup[] = [];
  pickupsPrediction: Pickup.IPickup[] = [];
  doodads: Doodad.IDoodad[] = [];
  doodadsPrediction: Doodad.IDoodad[] = [];
  imageOnlyTiles: Tile[] = [];
  liquidSprites: TilingSprite[] = [];
  // line segments that prevent sight and movement
  walls: LineSegment[] = [];
  // line segments that prevent movement under certain circumstances
  liquidBounds: LineSegment[] = [];
  liquidPolygons: Polygon2[] = [];
  pathingPolygons: Polygon2[] = [];
  // pathingLineSegments shall always be exactly pathingPolygons converted to LineSegments.
  // It is kept up to date whenever pathingPolygons changes in cachedWalls
  pathingLineSegments: Polygon2LineSegment[] = [];
  // Keeps track of how many messages have been processed so that clients can
  // know when they've desynced.  Only used for syncronous message processing
  // since only the syncronous messages affect gamestate.
  processedMessageCount: number = 0;
  cardDropsDropped: number = 0;
  enemiesKilled: number = 0;
  // Not to be synced between clients but should belong to the underworld as they are unique
  // to each game lobby:
  // A list of units and pickups and an endPosition that they are moved to via a "force",
  // like a push or pull or explosion.
  forceMove: ForceMove[] = [];
  forceMovePrediction: ForceMove[] = [];
  // A hash of the last thing this client was thinking
  // Used with MESSAGE_TYPES.PLAYER_THINKING so other clients 
  // can see what another client is planning.
  // The hash is used to prevent sending the same data more than once
  lastThoughtsHash: string = '';
  // currentDrawLocation is where the thought is drawn, it approaches the target so it animates smoothly rather than snapping around the screen
  // since playerThoughts are throttled for efficiency.  lerp is state used to animate the currentDrawLocation's position.
  playerThoughts: { [clientId: string]: { target: Vec2, currentDrawLocation?: Vec2, lerp: number, cardIds: string[], ellipsis: boolean } } = {};
  // Keep track of the LevelData from the last level that was created in
  // case it needs to be sent to another client
  lastLevelCreated: LevelData | undefined;
  // Used to allow INIT_GAME_STATE after a disconnect
  allowForceInitGameState: boolean = false;
  removeEventListeners: undefined | (() => void);
  bloods: BloodParticle[] = [];
  // Keeps track of if the game has begun the process of restarting a new level after a Game Over
  isRestarting: NodeJS.Timer | undefined = undefined;
  particleFollowers: {
    displayObject: DisplayObject,
    emitter?: Emitter,
    target: Unit.IUnit
  }[] = [];
  activeMods: string[] = [];

  constructor(overworld: Overworld, pie: PieClient | IHostApp, seed: string, RNGState: SeedrandomState | boolean = true) {
    // Clean up previous underworld:
    overworld.underworld?.cleanup();
    console.log('Setup: Creating new underworld');
    this.pie = pie;
    this.overworld = overworld;
    this.overworld.underworld = this;
    this.localUnderworldNumber = ++localUnderworldCount;
    if (typeof window !== 'undefined') {
      // @ts-ignore: window.devUnderworld is NOT typed in globalThis intentionally
      // so that it will not be used elsewhere, but it is assigned here
      // so that it can be accessed by a developer in client.
      // It should always be set to the latest underworld
      window.devUnderworld = this;
    }
    this.seed = globalThis.seedOverride || seed;
    // Nofity when Underworld is GC'd
    cleanupRegistry?.register(this, `underworld-${this.seed}-${this.localUnderworldNumber}`);

    this.random = this.syncronizeRNG(RNGState);
  }
  // Returns all potentially targetable entities
  // See cards/index.ts's getCurrentTargets() for the function that returns 
  // the current targets of a spell.
  getPotentialTargets(prediction: boolean): HasSpace[] {
    if (prediction) {
      return [...this.unitsPrediction, ...this.pickupsPrediction, ...this.doodadsPrediction]
    } else {
      return [...this.units, ...this.pickups, ...this.doodads];
    }
  }
  reportEnemyKilled(enemyKilledPos: Vec2) {
    this.enemiesKilled++;
    // Check if should drop cards
    let numberOfEnemiesKilledNeededForNextDrop = 0;
    const startNumberOfEnemiesNeededToDrop = 2;
    for (let i = startNumberOfEnemiesNeededToDrop; i < 1 + this.cardDropsDropped + startNumberOfEnemiesNeededToDrop; i++) {
      numberOfEnemiesKilledNeededForNextDrop += i;
    }
    if (document.body?.classList.contains('HUD-hidden')) {
      console.log('HUD-hidden: Skipping dropping scroll pickup')
      return;
    }
    if (numberOfEnemiesKilledNeededForNextDrop <= this.enemiesKilled) {
      console.log('Pickup: Drop scroll pickup', this.cardDropsDropped, this.enemiesKilled, numberOfEnemiesKilledNeededForNextDrop)
      explain(EXPLAIN_SCROLL);
      this.cardDropsDropped++;
      const pickupSource = Pickup.pickups.find(p => p.name == Pickup.CARDS_PICKUP_NAME)
      if (pickupSource) {
        Pickup.create({ pos: enemyKilledPos, pickupSource }, this, false);
        tutorialShowTask('pickupScroll');
      } else {
        console.error('pickupSource for', Pickup.CARDS_PICKUP_NAME, ' not found');
        return
      }
    }

  }
  syncPlayerPredictionUnitOnly() {
    if (this.unitsPrediction && globalThis.player !== undefined) {
      const predictionUnit = this.unitsPrediction.find(u => u.id == globalThis.player?.unit.id);
      if (predictionUnit) {
        // Override the properties but keep the reference intact or else
        // it will interfere with showing a skull above your own head if a spell will kill you
        Object.assign(predictionUnit, Unit.copyForPredictionUnit(globalThis.player.unit, this));
      }
    }
  }
  // Assigns this.unitsPrediction a copy of this.units
  // for the sake of prediction
  syncPredictionEntities() {
    // Headless does not use predictions because predictions are only for display
    if (globalThis.headless) { return; }
    this.unitsPrediction = this.units.map(u => Unit.copyForPredictionUnit(u, this));
    this.pickupsPrediction = this.pickups.map(Pickup.copyForPredictionPickup);
    this.doodadsPrediction = this.doodads.map(Doodad.copyForPredictionDoodad);
  }
  syncronizeRNG(RNGState: SeedrandomState | boolean) {
    // For now, since there's no way for users to control the seed
    // don't display the seed on the homescreen
    // if (elSeed) {
    //   elSeed.innerText = `Seed: ${this.seed}`;
    // }
    console.log("RNG create with seed:", this.seed, ", state: ", RNGState);
    // state of "true" initializes the RNG with the ability to save it's state,
    // state of a state object, rehydrates the RNG to a particular state
    this.random = seedrandom(this.seed, { state: RNGState })
    return this.random;
  }
  // Simulate the forceMove until it's complete
  fullySimulateForceMovePredictions() {
    const prediction = true;
    const PREVENT_INFINITE_WITH_WARN_LOOP_THRESHOLD = 300;
    let loopCount = 0;
    if (globalThis.predictionGraphics) {
      globalThis.predictionGraphics.beginFill(colors.forceMoveColor);
    }
    while (this.forceMovePrediction.length > 0 && loopCount < PREVENT_INFINITE_WITH_WARN_LOOP_THRESHOLD) {
      loopCount++;
      for (let i = this.forceMovePrediction.length - 1; i >= 0; i--) {
        const forceMoveInst = this.forceMovePrediction[i];
        if (forceMoveInst) {
          const startPos = Vec.clone(forceMoveInst.pushedObject);
          const done = this.runForceMove(forceMoveInst, prediction);
          // Draw prediction lines
          if (globalThis.predictionGraphics && !globalThis.isHUDHidden) {
            globalThis.predictionGraphics.lineStyle(4, colors.forceMoveColor, 1.0);
            globalThis.predictionGraphics.moveTo(startPos.x, startPos.y);
            globalThis.predictionGraphics.lineTo(forceMoveInst.pushedObject.x, forceMoveInst.pushedObject.y);
            // Draw circle at the end so the line path isn't a trail of rectangles with sharp edges
            globalThis.predictionGraphics.lineStyle(1, colors.forceMoveColor, 1.0);
            globalThis.predictionGraphics.drawCircle(forceMoveInst.pushedObject.x, forceMoveInst.pushedObject.y, 1);
          }
          if (done) {
            // Draw a circle at the end position
            if (globalThis.predictionGraphics && !globalThis.isHUDHidden) {
              globalThis.predictionGraphics.drawCircle(forceMoveInst.pushedObject.x, forceMoveInst.pushedObject.y, 3);
            }
            forceMoveInst.resolve();
            this.forceMovePrediction.splice(i, 1);
          }
        }
      }
    }
    if (globalThis.predictionGraphics) {
      globalThis.predictionGraphics.endFill();
    }
    if (loopCount >= PREVENT_INFINITE_WITH_WARN_LOOP_THRESHOLD) {
      console.error('forceMove simulation hit PREVENT_INFINITE threshold');
    }
  }
  // Returns true when forceMove is complete
  runForceMove(forceMoveInst: ForceMove, prediction: boolean): boolean {
    const { pushedObject, velocity, velocity_falloff, timedOut } = forceMoveInst;
    if (timedOut) {
      return true;
    }
    if (Vec.magnitude(velocity) <= 0.1) {
      // It's close enough, return true to signify complete 
      return true;
    }
    const aliveUnits = ((prediction && this.unitsPrediction) ? this.unitsPrediction : this.units).filter(u => u.alive);
    const handled = forceMovePreventForceThroughWall(forceMoveInst, this);
    if (handled) {
      // If striking the wall hard enough to pass through it, deal damage if the
      // pushed object is a unit and stop velocity:
      if (Unit.isUnit(pushedObject)) {
        const magnitude = Vec.magnitude(velocity);
        const damage = Math.ceil(Math.log(magnitude)) * 10;
        Unit.takeDamage(pushedObject, damage, Vec.add(pushedObject, { x: velocity.x, y: velocity.y }), this, prediction);
        if (!prediction) {
          floatingText({ coords: pushedObject, text: `${damage} Impact damage!` });
        }
      }
      velocity.x = 0;
      velocity.y = 0;
    } else {
      // If forceMove wasn't going to drive the pushedObject through a wall,
      // move it according to it's velocity
      // Note: This is the normal case, "handled" occurs
      // under special circumstances when the object is moving so fast
      // that it would pass through solid walls
      const newPosition = Vec.add(pushedObject, velocity);
      pushedObject.x = newPosition.x;
      pushedObject.y = newPosition.y;
    }
    for (let other of aliveUnits) {
      if (other == forceMoveInst.pushedObject) {
        // Don't collide with self
        continue;
      }
      // The units' regular radius is for "crowding". It is much smaller than their actual size and it is used
      // to ensure they can crowd together but not overlap perfect, so here we use a custom radius to detect
      // forcePush collisions.
      // Only allow instances that are flagged as able to create second order pushes create new pushes on collision or else you risk infinite
      // recursion
      if (forceMoveInst.canCreateSecondOrderPushes && isVecIntersectingVecWithCustomRadius(pushedObject, other, config.COLLISION_MESH_RADIUS)) {
        // Don't collide with the same object more than once
        if (forceMoveInst.alreadyCollided.includes(other)) {
          continue;
        }
        forceMoveInst.alreadyCollided.push(other);
        if (Doodad.isDoodad(pushedObject)) {
          if (pushedObject.name == Doodad.DOODAD_ROCK_NAME) {
            Unit.takeDamage(other, 2, pushedObject, this, prediction);
          }
        }
        // If they collide transfer force:
        // () => {}: No resolver needed for second order force pushes
        // All pushable objects have the same mass so when a collision happens they'll split the distance
        const fullDist = Vec.magnitude(forceMoveInst.velocity);
        const halfDist = fullDist / 2;
        // This is a second order push and second order pushes CANNOT create more pushes or else you risk infinite recursion in prediction mode
        const canCreateSecondOrderPushes = false;
        makeForcePush({ pushedObject: other, awayFrom: forceMoveInst.pushedObject, velocityStartMagnitude: halfDist, resolve: () => { }, canCreateSecondOrderPushes }, this, prediction);
        // Reduce own velocity by half due to the transfer of force:
        forceMoveInst.velocity = Vec.multiply(0.5, forceMoveInst.velocity);

      }
    }
    collideWithLineSegments(pushedObject, this.walls, this);
    forceMoveInst.velocity = Vec.multiply(velocity_falloff, velocity);
    if (Unit.isUnit(forceMoveInst.pushedObject)) {
      // If the pushed object is a unit, check if it collides with any pickups
      // as it is pushed
      this.checkPickupCollisions(forceMoveInst.pushedObject, prediction);
    } else if (Pickup.isPickup(forceMoveInst.pushedObject)) {
      // If the pushed object is a pickup, check if it collides with any units
      // as it is pushed
      ((prediction && this.unitsPrediction) ? this.unitsPrediction : this.units).forEach(u => {
        this.checkPickupCollisions(u, prediction);
      })
    }
    // Check to see if unit has falled out of lava via a forcemove
    Obstacle.tryFallInOutOfLiquid(forceMoveInst.pushedObject, this, prediction);
    return false;

  }
  queueGameLoop = () => {
    if (globalThis.headless) {
      // headless server manages it's own gameloop.  See gameLoopHeadless
      // This is so that it won't make players wait as it executes the NPC turn in real time
      // it should execute the NPC turn as fast as it can possibly process.
      return;
    }
    // prevent multiple gameLoop invokations being queued
    cancelAnimationFrame(requestAnimationFrameGameLoopId);
    // Invoke gameLoopUnits again next loop
    requestAnimationFrameGameLoopId = requestAnimationFrame(this.gameLoop);
  }
  // Returns true if there is more processing yet to be done on the next
  // gameloop
  gameLoopForceMove = () => {
    // Optimization cache blood whenever the blood smear particles get over a certain number
    // to prevent slowdown
    const amountOfBloodGeometryPoints = graphicsBloodSmear?.geometry.points.length || 0;
    if (amountOfBloodGeometryPoints >= 100_000) {
      cacheBlood();
    }

    for (let i = this.forceMove.length - 1; i >= 0; i--) {
      const forceMoveInst = this.forceMove[i];
      if (forceMoveInst) {
        // Ensure blood is at unit feet, not center
        const unitImageYOffset = config.COLLISION_MESH_RADIUS / 2;
        const startPos = Vec.clone(forceMoveInst.pushedObject);
        startPos.y += unitImageYOffset;
        const done = this.runForceMove(forceMoveInst, false);
        const endPos = { x: forceMoveInst.pushedObject.x, y: forceMoveInst.pushedObject.y + unitImageYOffset };
        // Note bug: this will leavee a smear on pickups since pickups aren't alive
        if (graphicsBloodSmear && Unit.isUnit(forceMoveInst.pushedObject) && forceMoveInst.pushedObject.health !== undefined && forceMoveInst.pushedObject.health <= 0) {
          const size = 3;
          for (let j of smearJitter) {
            // Multiple blood trails
            graphicsBloodSmear.beginFill(forceMoveInst.pushedObject.bloodColor, 1.0);
            graphicsBloodSmear.lineStyle(0);
            const bloodDrop = Vec.jitter(endPos, 5);
            // Don't draw if inside liquid
            if (!this.isInsideLiquid(bloodDrop)) {
              // Draw a blood drop
              graphicsBloodSmear.drawCircle(bloodDrop.x, bloodDrop.y, randInt(2, 4));
            }

            const startWithJitter = Vec.add(startPos, j);
            const endWithJitter = Vec.add(endPos, j);
            // Only draw if both are not inside liquid bounds
            if (!this.isInsideLiquid(startPos) && !this.isInsideLiquid(endWithJitter)) {
              // Draw circle at the ends of the smear line line so the smear lines don't look like rectangles
              graphicsBloodSmear.drawCircle(startWithJitter.x, startWithJitter.y, size);
              graphicsBloodSmear.drawCircle(endWithJitter.x, endWithJitter.y, size);
              graphicsBloodSmear.endFill();
              // Draw a smear line
              graphicsBloodSmear.lineStyle(size, forceMoveInst.pushedObject.bloodColor, 1.0);
              graphicsBloodSmear.moveTo(startWithJitter.x, startWithJitter.y);
              graphicsBloodSmear.lineTo(endWithJitter.x, endWithJitter.y);
            }
          }
        }
        // Remove it from forceMove array once the distance has been covers
        // This works even if collisions prevent the unit from moving since
        // distance is modified even if the unit doesn't move each loop
        if (done) {
          forceMoveInst.resolve();
          this.forceMove.splice(i, 1);
        }
      }
    }
    return !!this.forceMove.length;
  }
  // returns true if there is more processing yet to be done on the next game loop
  gameLoopUnit = (u: Unit.IUnit, aliveNPCs: Unit.IUnit[], deltaTime: number): boolean => {
    if (u.alive) {
      while (u.path && u.path.points[0] && Vec.equal(Vec.round(u), Vec.round(u.path.points[0]))) {
        // Remove next points until the next point is NOT equal to the unit's current position
        // This prevent's "jittery" "slow" movement where it's moving less than {x:1.0, y:1.0}
        // because the unit's position may have a decimal while the path does not so it'll stop
        // moving when it reaches the target which may be less than 1.0 and 1.0 away.
        u.path.points.shift();
      }
      // Only allow movement if the unit has stamina
      const isUnitsTurn = Unit.isUnitsTurnPhase(u, this);
      if (u.path && u.path.points[0] && u.stamina > 0 && isUnitsTurn) {
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
          moveWithCollisions(u, stepTowardsTarget, [...aliveNPCs, ...this.doodads], this);
          moveDist = math.distance(originalPosition, u);
          // Prevent moving into negative stamina.  This occurs rarely when
          // the stamina is a fraction but above 0 and the moveDist is greater than the stamina.
          // This check prevents the false-negative melee attack predictions
          if (u.stamina - moveDist < 0) {
            u.x = originalPosition.x;
            u.y = originalPosition.y;
            u.stamina = 0;
          }
        }

        if (!isNaN(moveDist)) {
          u.stamina -= moveDist;
        }
        // Only do this check if they are already in the liquid because units will never enter liquid
        // just by moving themselves, they can only be forceMoved into liquid and that check happens 
        // elsewhere
        if (u.inLiquid) {
          // Check if the unit was once in lava but now is out of the lava
          Obstacle.tryFallInOutOfLiquid(u, this, false);
        }
        // If unit is MELEE and only has the final target left in the path, stop when it gets close enough
        if (
          u.path.points[0] && u.path.points.length == 1 && u.unitSubType == UnitSubType.MELEE && math.distance(u, u.path.points[0]) <= config.COLLISION_MESH_RADIUS * 2
        ) {
          // Once the unit reaches the target, shift so the next point in the path is the next target
          u.path.points.shift();
        }

      }
      // check for collisions with pickups in new location
      this.checkPickupCollisions(u, false);
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
        // done processing this unit for this unit's turn
        return false;
      } else {
        if (!isUnitsTurn) {
          // This block is not supposed to execute but can under unusual circumstanses such as after a load
          // so if we get here and a unit is trying to move but shouldn't, just clear it's stamina so that the unit
          // will be done processing
          console.log('Guard against infinite loop, unit tried to move but it was not its turn.  Clearing stamina');
          u.stamina = 0;
        }
      }
    } else {
      // Unit is dead, no processing to be done
      return false;
    }
    // more processing yet to be done
    return true;
  }
  // See GameLoops.md for more details
  triggerGameLoopHeadless = () => {
    if (globalThis.headless) {
      // Now that NPC actions have been setup, trigger the gameLoopHeadless
      // which will run until all actions are processed:
      const headlessGameLoopPerfStart = performance.now();
      let moreProcessingToBeDone = true;
      let loopCount = 0;
      while (moreProcessingToBeDone) {
        loopCount++;
        moreProcessingToBeDone = this._gameLoopHeadless();
        if (loopCount >= 1000 && loopCount % 500 == 0) {
          console.error('Headless gameloop unexpectedly large loop count:', loopCount);
        }
        if (loopCount > 10000) {
          // TODO: this number is arbitrary, test later levels and make sure this is high enough
          // so that it doesn't early exit
          console.error('Force return from headless gameloop to prevent infinite loop');
          return
        }
      }
      console.log('Headless server executed gameloop in ', (performance.now() - headlessGameLoopPerfStart).toFixed(2), ' millis with', loopCount, ' loops.');
    }
  }
  // Only to be invoked by triggerGameLoopHeadless
  // Returns true if there is more processing to be done
  // See GameLoops.md for more details
  _gameLoopHeadless = (): boolean => {
    const stillProcessingForceMoves = this.gameLoopForceMove();
    let stillProcessingUnits = 0;
    const aliveNPCs = this.units.filter(u => u.alive && u.unitType == UnitType.AI);
    for (let u of this.units) {
      const unitStillProcessing = this.gameLoopUnit(u, aliveNPCs, 16);
      if (unitStillProcessing) {
        stillProcessingUnits++;
      }
    }
    return stillProcessingForceMoves || stillProcessingUnits > 0;
  }
  // See GameLoops.md for more details
  gameLoop = (timestamp: number) => {
    if (this.players.filter(p => p.clientConnected).length == 0) {
      console.log('Gameloop: pause; 0 connected players in game');
      // Returning without requesting a new AnimationFrame is equivalent to 'pausing'
      // the gameloop
      return;
    }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    const { zoom } = getCamera();

    ImmediateMode.loop();

    globalThis.unitOverlayGraphics?.clear();

    // Make liquid move to the right:
    const scrollSpeed = deltaTime / config.LIQUID_X_SCROLL_SPEED;
    for (let liquidSprite of this.liquidSprites) {
      liquidSprite.tilePosition.x -= scrollSpeed;
    }

    // Sync css classes to handle changing the cursor
    if (globalThis.player) {
      document.body?.classList.toggle(CSSClasses.casting, CardUI.areAnyCardsSelected());
      const cardIds = CardUI.getSelectedCardIds();
      if (cardIds.length) {
        const outOfRange = isOutOfRange(globalThis.player, this.getMousePos(), this, cardIds);
        document.body?.classList.toggle(CSSClasses.outOfRange, outOfRange);
      } else {
        // If there are no cards selected, ensure the out of range class is removed
        document.body?.classList.toggle(CSSClasses.outOfRange, false);
      }
      // Turn off casting and outOfRange view if the player is viewing the walk rope
      if (keyDown.showWalkRope) {
        document.body?.classList.toggle(CSSClasses.casting, false);
        document.body?.classList.toggle(CSSClasses.outOfRange, false);
      }
    }

    const aliveNPCs = this.units.filter(u => u.alive && u.unitType == UnitType.AI);
    // Run all forces in this.forceMove
    this.gameLoopForceMove();

    for (let doodad of this.doodads) {
      // Keep image in sync with position
      if (doodad.image) {
        doodad.image.sprite.x = doodad.x;
        doodad.image.sprite.y = doodad.y;
      }
    }

    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u) {
        this.gameLoopUnit(u, aliveNPCs, deltaTime);
        // Sync Image even for non moving units since they may be moved by forces other than themselves
        // This keeps the unit.image in the same place as unit.x, unit.y
        Unit.syncImage(u)
        drawHealthBarAboveHead(i, this, zoom);
        // Animate shield modifier sprites
        if ((u.modifiers[shield.id] || u.modifiers[fortify.id]) && u.image) {
          // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
          // which is used for identifying the sprite or animation that is currently active
          const modifierSprite = u.image.sprite.children.find(c => c.imagePath == shield.modifierImagePath)
          if (modifierSprite) {
            modifierSprite.rotation += 0.01;
            modifierSprite.x = Math.sin(timestamp / 1000) * 3;
            modifierSprite.y = Math.cos(timestamp / 1000) * 3;
          }
        }
      }
    }
    // Now that units have moved update any particle emitters that are following them:
    for (let { displayObject, emitter, target } of this.particleFollowers) {
      if (target.alive && emitter && !emitter.destroyed) {

        // @ts-ignore: ySortPositionOverride is a custom property that I've added that was made
        // to override the display order of this displayObject. It's usage here allows the particles
        // for this emitter to be in their own container, that container renders them at the
        // ySortPositionOverride relative to other units but the particles still remain in game space
        // so that when the parent moves, the particles will list behind as you'd expect them to.
        displayObject.ySortPositionOverride = target.y - 1;
        emitter?.updateOwnerPos(target.x, target.y);
      } else {
        stopAndDestroyForeverEmitter(emitter);
      }
    }
    for (let p of this.pickups) {
      Pickup.sync(p);
    }
    // Sort unit sprites visually by y position (like "z-index")
    containerUnits?.children.sort((a: DisplayObject, b: DisplayObject) => {
      // @ts-ignore: imagePath is a custom property I added to display objects of Image
      let aExtraHeight = a.imagePath == Pickup.PICKUP_IMAGE_PATH ? 15 : 0;
      // @ts-ignore: imagePath is a custom property I added to display objects of Image
      let bExtraHeight = b.imagePath == Pickup.PICKUP_IMAGE_PATH ? 15 : 0;
      // @ts-ignore: ySortPositionOverride is a custom property that I've added that was made
      // specifically to be used in this context - sorting containerUnits - so that
      // a display object may have a sort position that is different than it's actual
      // y position
      const ay = a.ySortPositionOverride !== undefined ? a.ySortPositionOverride : a.y;
      // Protect against a DisplayObject with NaN from disrupting the entire sort
      const A = (ay + aExtraHeight + config.UNIT_SIZE_RADIUS * a.scale.y);
      if (isNaN(A)) {
        return -1;
      }
      // @ts-ignore: ySortPositionOverride is a custom property that I've added that was made
      // specifically to be used in this context - sorting containerUnits - so that
      // a display object may have a sort position that is different than it's actual
      // y position
      const by = b.ySortPositionOverride !== undefined ? b.ySortPositionOverride : b.y;
      // Protect against a DisplayObject with NaN from disrupting the entire sort
      const B = (by + bExtraHeight + config.UNIT_SIZE_RADIUS * b.scale.y);
      if (isNaN(B)) {
        return 1;
      }
      return A - B
    });

    updateCameraPosition(this);
    this.drawEnemyAttentionMarkers();
    this.drawResMarkers();
    this.drawPlayerThoughts();
    updatePlanningView(this);
    useMousePosition(this);
    // Particles
    updateParticlees(deltaTime, this.bloods, this.random, this);

    this.queueGameLoop();
  }
  // setPath finds a path to the target
  // and sets that to the unit's path
  setPath(unit: Unit.IUnit, target: Vec2) {
    const path = this.calculatePath(unit.path, Vec.round(unit), Vec.round(target))
    if (unit.path) {
      // If there is a pre-existing path, intentionally mutate it.
      // This is so that this.unitsPrediction can mutate the path's of 
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
    let points = findPath(startPoint, target, this.pathingLineSegments);

    // If the real target is in an invalid location,
    // find the closest valid target to represent the endpoint of the path
    if (points.length == 0) {
      const nearPointsOnWalls: Vec2[] = [];
      for (let wall of this.pathingLineSegments) {
        const intersection = findWherePointIntersectLineSegmentAtRightAngle(target, wall);
        if (intersection) {
          // globalThis.debugGraphics.lineStyle(3, 0xff0000, 1.0);
          // globalThis.debugGraphics.drawCircle(intersection.x, intersection.y, 3);
          nearPointsOnWalls.push(intersection);
        }
        nearPointsOnWalls.push(wall.p1);
        nearPointsOnWalls.push(wall.p2);

      }
      // Find the closest of the nearPointsOnWalls 
      if (nearPointsOnWalls[0]) {
        const closest = nearPointsOnWalls.reduce<{ intersection: Vec2, dist: number }>((acc, cur) => {
          const dist = math.distance(cur, target)
          if (dist <= acc.dist) {
            return { intersection: cur, dist };
          } else {
            return acc;
          }

        }, { intersection: nearPointsOnWalls[0], dist: Number.MAX_SAFE_INTEGER })
        // Override target with a location that the unit can actually fit in:
        target = closest.intersection;
      }
      // Try again with adjustedTarget set to nearpoint on wall
      points = findPath(startPoint, target, this.pathingLineSegments);

    }
    return {
      points,
      lastOwnPosition: Vec.clone(startPoint),
      targetPosition: Vec.clone(target)
    }
  }
  drawResMarkers() {
    if (!globalThis.resMarkers) {
      return;
    }
    for (let marker of globalThis.resMarkers) {
      const { zoom } = getCamera();
      ImmediateMode.draw(resurrect.thumbnail, marker, 1 / zoom);
    }

  }
  // Draw attention markers which show if an NPC will
  // attack you next turn
  drawEnemyAttentionMarkers() {
    if (!globalThis.attentionMarkers) {
      return;
    }
    if (globalThis.isHUDHidden) {
      // Don't draw attention markers if the hud is hidden
      return;
    }
    const { zoom } = getCamera();
    // Note: this block must come after updating the camera position
    // 1/zoom keeps the attention marker the same size regardless of the level of zoom
    // Math.sin... makes the attention marker swell and shink so it grabs the player's attention so they
    // know that they're in danger
    // + 1 makes it go from 0 to 2 instead of -1 to 1
    // / 8 limits the size
    const markerScale = (1 / zoom) + (Math.sin(Date.now() / 500) + 1) / 8

    for (let marker of globalThis.attentionMarkers) {
      const markerHeightHalf = 16 * markerScale;
      const markerMarginAboveHealthBar = 10;
      // Offset exclamation mark just above the head of the unit
      const exclamationMarkPosition = withinCameraBounds({
        x: marker.pos.x, y: marker.pos.y
          - config.HEALTH_BAR_UI_Y_POS * marker.scale
          - config.UNIT_UI_BAR_HEIGHT / zoom
          - markerHeightHalf
          - markerMarginAboveHealthBar / zoom
      });

      // Draw Attention Icon to show the enemy will hurt you next turn
      ImmediateMode.draw(marker.imagePath, exclamationMarkPosition, markerScale);
    }
  }
  drawPlayerThoughts() {
    // No graphics for headless
    if (globalThis.headless) { return; }

    const spaceBetweenIcons = 25;
    function getXLocationOfImageForThoughtBubble(originX: number, index: number, totalNumberOfSpells: number) {
      return originX + (0.5 + index - totalNumberOfSpells / 2) * spaceBetweenIcons
    }
    // Only display player thoughts if they are not the current client's player
    globalThis.thinkingPlayerGraphics?.clear();
    containerPlayerThinking?.removeChildren();
    if (globalThis.thinkingPlayerGraphics) {
      containerPlayerThinking?.addChild(globalThis.thinkingPlayerGraphics);
    }
    for (let [thinkerClientId, thought] of Object.entries(this.playerThoughts)) {
      const { target, cardIds, ellipsis } = thought;
      const thinkingPlayerIndex = this.players.findIndex(p => p.clientId == thinkerClientId);
      const thinkingPlayer = this.players[thinkingPlayerIndex];
      if (thinkingPlayer && thinkingPlayer.isSpawned) {
        // Leave room for name tag
        const yMargin = 10;
        const y = thinkingPlayer.unit.y - config.COLLISION_MESH_RADIUS * 2 - yMargin
        let firstCard, lastCard;
        for (let i = 0; i < cardIds.length; i++) {
          const cardId = cardIds[i];
          if (!cardId) {
            continue;
          }
          const card = Cards.allCards[cardId];
          if (card) {
            const x = getXLocationOfImageForThoughtBubble(thinkingPlayer.unit.x, i, cardIds.length);
            const sprite = addPixiSprite(card.thumbnail, containerPlayerThinking);
            if (sprite) {
              sprite.anchor.x = 0.5;
              sprite.anchor.y = 0.5;
              sprite.rotation = 0;
              const pos = { x, y };
              if (i == 0) {
                firstCard = { x, y };
              }
              if (i == cardIds.length - 1) {
                lastCard = { x, y };
              }
              sprite.x = pos.x;
              sprite.y = pos.y;
              sprite.scale.set(0.3);
            }
          }
        }
        if (ellipsis && globalThis.pixi && lastCard && containerPlayerThinking) {
          const pixiText = new globalThis.pixi.Text('...');
          const x = getXLocationOfImageForThoughtBubble(thinkingPlayer.unit.x, cardIds.length, cardIds.length);
          pixiText.x = x;
          pixiText.y = y;
          lastCard = { x, y };
          pixiText.anchor.x = 0.5;
          pixiText.anchor.y = 0.5;
          containerPlayerThinking.addChild(pixiText);
        }
        // Render thought bubble around spell icons
        if (firstCard && lastCard) {
          globalThis.thinkingPlayerGraphics?.lineStyle(1, 0xffffff, 1.0);
          globalThis.thinkingPlayerGraphics?.beginFill(0xffffff, 0.7);
          const cardSize = 12;
          globalThis.thinkingPlayerGraphics?.drawRoundedRect(firstCard.x - cardSize, firstCard.y - cardSize, lastCard.x - firstCard.x + cardSize * 2, lastCard.y - firstCard.y + cardSize * 2, 2);
          globalThis.thinkingPlayerGraphics?.endFill();
        }
        thought.currentDrawLocation = Vec.lerpVec2(thought.currentDrawLocation || target, target, thought.lerp++ / 100);
        const { currentDrawLocation } = thought;
        if (currentDrawLocation && cardIds.length) {
          // Draw a line to show where they're aiming:
          globalThis.thinkingPlayerGraphics?.lineStyle(3, colors.healthAllyGreen, 1.0);
          // Use this similarTriangles calculation to make the line pretty so it doesn't originate from the exact center of the
          // other player but from the edge instead
          const startPoint = math.distance(thinkingPlayer.unit, currentDrawLocation) <= config.COLLISION_MESH_RADIUS
            ? currentDrawLocation
            : Vec.subtract(thinkingPlayer.unit, math.similarTriangles(thinkingPlayer.unit.x - currentDrawLocation.x, thinkingPlayer.unit.y - currentDrawLocation.y, math.distance(thinkingPlayer.unit, currentDrawLocation), config.COLLISION_MESH_RADIUS));
          globalThis.thinkingPlayerGraphics?.moveTo(startPoint.x, startPoint.y);
          globalThis.thinkingPlayerGraphics?.lineTo(currentDrawLocation.x, currentDrawLocation.y);
          globalThis.thinkingPlayerGraphics?.beginFill(colors.healthAllyGreen);
          globalThis.thinkingPlayerGraphics?.drawCircle(currentDrawLocation.x, currentDrawLocation.y, 4);
          globalThis.thinkingPlayerGraphics?.endFill();
        }
      }
    }

  }
  // Returns true if it is the current players turn
  isMyTurn() {
    return this.turn_phase == turn_phase.PlayerTurns;
  }

  // destroy is currently unused and may be uncommented if there is a need for it in the future
  // destroy() {
  //   console.log('teardown: destroying underworld')

  //   if (this.removeEventListeners) {
  //     this.removeEventListeners();
  //   }
  //   // Prevent requestAnimationFrame from calling this method next time, since this underworld
  //   // instance is being cleaned up
  //   if (requestAnimationFrameGameLoopId !== undefined) {
  //     cancelAnimationFrame(requestAnimationFrameGameLoopId);
  //   }
  // }

  // Caution: Be careful when changing clean up code.  There are times when you just want to
  // clean up assets and then there are times when you want to clear and empty the arrays
  // Be sure not to confuse them.
  // cleanup cleans up all assets that must be manually removed (for now `Image`s)
  // if an object stops being used.  It does not empty the underworld arrays, by design.
  cleanup() {
    console.log('teardown: Cleaning up underworld');
    // Clear upgrades
    document.body?.classList.toggle(showUpgradesClassName, false);
    this.cleanUpLevel();
    cleanUpPerkList();
    // Dereference underworld
    this.overworld.underworld = undefined;
    globalThis.attentionMarkers = [];
    globalThis.resMarkers = [];

    // Remove game-over popup
    document.body.classList.toggle('game-over', false);

    // Remove all phase classes from body
    if (document && !globalThis.headless) {
      // @ts-expect-error Property 'values' does not exist on type 'DOMTokenList'
      for (let phaseClass of document.body?.classList.values()) {
        if (phaseClass.includes('phase-')) {
          document.body?.classList.remove(phaseClass);
        }
      }
      document.body?.classList.remove('your-turn');
    }

    // Note: Player's unit image is cleaned up below where it also has a reference in this.units
    for (let u of this.units) {
      Image.cleanup(u.image);
    }
    for (let x of this.pickups) {
      Pickup.removePickup(x, this, false);
    }
    this.players = [];
    this.units.forEach(u => Unit.cleanup(u));
    globalThis.selectedPickup = undefined;
    globalThis.selectedUnit = undefined;

    // Clear player
    globalThis.player = undefined;

    this.lastLevelCreated = undefined;

    globalThis.updateInGameMenuStatus?.()
  }
  // cacheWalls updates underworld.walls array
  // with the walls for the edge of the map
  // and the walls from the current obstacles
  cacheWalls(obstacles: Obstacle.IObstacle[], emptyTiles: Tile[]) {

    const distanceFromTileCenterWhenAdjacent = 1 + Math.sqrt(2) * config.OBSTACLE_SIZE / 2;
    // Optimization: Removes linesegments that are not adjacent to walkable ground to prevent
    // having to process linesegments that will never be used
    // function filterRemoveNonGroundAdjacent(ls: LineSegment): boolean {
    //   return groundTiles.some(gt => math.distance(gt, ls.p1) <= distanceFromTileCenterWhenAdjacent)
    // }

    // Used to remove polygons that border empty tiles
    function filterRemoveEmptyTileAdjacentPoly(poly: Polygon2): boolean {
      return !emptyTiles.some(tile => poly.some(p => math.distance(tile, p) <= distanceFromTileCenterWhenAdjacent))
    }
    const getWallPolygons = () => obstacles.filter(o => o.material == Material.WALL).map(o => o.bounds);
    // walls block sight and movement
    this.walls = mergePolygon2s(getWallPolygons())
      // Optimization, remove the outermost wall poly since no units will ever collide with it
      .filter(filterRemoveEmptyTileAdjacentPoly)
      .map(toLineSegments).flat()

    const expandMagnitude = config.COLLISION_MESH_RADIUS * 0.5;

    // liquid bounds block movement only under certain circumstances
    this.liquidPolygons = mergePolygon2s(obstacles.filter(o => o.material == Material.LIQUID).map(o => o.bounds));
    const expandedLiquidPolygons = this.liquidPolygons//.map(p => p.map(Vec.clone))
      .map(p => expandPolygon(p, -expandMagnitude))
    this.liquidBounds = expandedLiquidPolygons
      .map(toLineSegments).flat();
    // TODO: Optimize:
    //.filter(filterRemoveNonGroundAdjacent);

    // Expand pathing walls by the size of the regular unit
    // pathing polygons determines the area that units can move within
    // this.pathingPolygons = mergePolygon2s([...obstacles.map(o => o.bounds)]

    this.pathingPolygons = mergePolygon2s([...getWallPolygons().map(p => expandPolygon(p, config.COLLISION_MESH_RADIUS * 0.4))
      .map(p => p.map(vec2 => ({ x: vec2.x, y: vec2.y - 10 })))
      , ...expandedLiquidPolygons
        // Move bounds up because center of units is not where they stand, and the bounds
        // should be realtive to a unit's feet
        .map(p => p.map(vec2 => ({ x: vec2.x, y: vec2.y - expandMagnitude / 2 })))
        .map(p => expandPolygon(p, expandMagnitude))])
      // remove polygons that border empty tiles (the outermost poly) so that if player tries to path to an out of bounds location
      // it will still be able to find the nearest point on a wall.  If it wasn't removed, attempting to path to an out of bounds
      // location would find an adjusted path target on the wall of the outermost poly, but since the inside 2nd outermost poly
      // is always between units and the outermost poly, that adjusted point wouldn't find a successful path either
      // and it the player would not move. 
      .filter(filterRemoveEmptyTileAdjacentPoly);


    // Process the polygons into pathingwalls for use in tryPath
    // TODO: Optimize if needed: When this.pathingLineSegments gets serialized to send over the network
    // it has an excess of serialized polygons with many points  because lots of the linesegments have a ref to the
    // same polygon.  This is a lot of extra data that is repeated.  Optimize if needed
    this.pathingLineSegments = this.pathingPolygons.map(toPolygon2LineSegments).flat();
  }
  spawnPickup(index: number, coords: Vec2, prediction?: boolean) {
    const pickup = Pickup.pickups[index];
    if (pickup) {
      Pickup.create({ pos: coords, pickupSource: pickup }, this, !!prediction);
    } else {
      console.error('Could not find pickup with index', index);
    }
  }
  spawnEnemy(id: string, coords: Vec2, isMiniboss: boolean) {
    const sourceUnit = allUnits[id];
    if (!sourceUnit) {
      console.error('Unit with id', id, 'does not exist.  Have you registered it in src/units/index.ts?');
      return;
    }
    if (globalThis.enemyEncountered && !globalThis.enemyEncountered.includes(id)) {
      globalThis.enemyEncountered.push(id);
      storage.set(storage.ENEMY_ENCOUNTERED_STORAGE_KEY, JSON.stringify(globalThis.enemyEncountered));
      // Slightly delay showing enemy introductions so the button doesn't flicker on for a moment before CSS has a chance
      // to mark the cinematic camera as active
      setTimeout(() => {
        Jprompt({ imageSrc: Unit.getExplainPathForUnitId(id), text: `<h1>${id}</h1>` + '\n' + i18n(sourceUnit.info.description), yesText: 'Okay' });
      }, 500)
    }
    let unit: Unit.IUnit = Unit.create(
      sourceUnit.id,
      coords.x,
      coords.y,
      Faction.ENEMY,
      sourceUnit.info.image,
      UnitType.AI,
      sourceUnit.info.subtype,
      sourceUnit.unitProps,
      this
    );
    unit.originalLife = true;
    if (isMiniboss) {
      Unit.makeMiniboss(unit);
    }

  }
  testLevelData(): LevelData {
    const baseTileValues = Object.values(baseTiles);
    // Hard coded to match the tiles array below
    const width = 8;
    const height = 8;
    // 0: empty
    // 1: wall
    // 2: semiWall
    // 3: liquid
    // 4: ground

    const _tiles: Tile[] = [
      0, 1, 1, 1, 1, 1, 0, 0,
      1, 1, 4, 4, 4, 1, 1, 1,
      1, 4, 4, 3, 4, 4, 1, 4,
      1, 4, 3, 4, 4, 4, 4, 4,
      1, 4, 4, 4, 4, 4, 4, 4,
      1, 1, 4, 4, 4, 4, 4, 4,
      1, 4, 1, 4, 4, 4, 4, 4,
      1, 1, 1, 1, 4, 4, 4, 4,
    ].map((value, i) => {
      const pos = oneDimentionIndexToVec2(i, width);
      return {
        x: pos.x * config.OBSTACLE_SIZE,
        y: pos.y * config.OBSTACLE_SIZE,
        image: baseTileValues[value] || ''
      }
    });
    // testLevel biome is arbitrary
    const biome = 'blood';
    const map: Map = {
      biome,
      liquid: [],
      tiles: _tiles,
      width,
      height
    };
    convertBaseTilesToFinalTiles(map);
    const { tiles } = map;
    return {
      levelIndex: 1,
      biome,
      liquid: [],
      limits: getLimits(tiles),
      obstacles: tiles.flatMap(t => {
        const obstacle = t && toObstacle(t, map.biome);
        return obstacle ? [obstacle] : [];
      }),
      imageOnlyTiles: tiles.flatMap(x => x == undefined ? [] : [x]),
      width,
      pickups: [],
      enemies: [
        // { id: 'vampire', coord: { x: 64, y: 64 } }
      ],

    }

  }
  // returns true if point is inside of liquid bounds
  isInsideLiquid(point: Vec2): boolean {
    for (let poly of this.liquidPolygons) {
      if (isVec2InsidePolygon(point, poly)) {
        return true;
      }
    }
    return false;

  }
  assertDemoExit() {
    if (this.levelIndex >= 5 && globalThis.isDemo) {
      Jprompt({
        text: 'Thank you for playing the Demo!\nMore spells, enemies, and levels are available in the full version!',
        yesText: 'Quit'
      }).then(() => {
        if (globalThis.exitCurrentGame) {
          globalThis.exitCurrentGame();
        }
      })
    }

  }

  // Returns undefined if it fails to make valid LevelData
  generateRandomLevelData(levelIndex: number): LevelData | undefined {
    console.log('Setup: generateRandomLevel', levelIndex);
    if (!caveSizes.tutorial || !caveSizes.small || !caveSizes.medium || !caveSizes.extrasmall) {
      console.error('Missing caveSize for generating level')
      return;
    }

    const biome_water: Biome = 'water';
    const biome_lava: Biome = 'lava';
    const biome_blood: Biome = 'blood';
    const biome_ghost: Biome = 'ghost';
    let biome: Biome = biome_water;
    const biomes: Biome[] = [biome_water, biome_lava, biome_blood, biome_ghost];
    const nextBiomeEveryXLevels = 3;
    const startLoopingLevelIndex = biomes.length * nextBiomeEveryXLevels
    const loopedLevelIndex = levelIndex >= startLoopingLevelIndex
      // Once the game starts looping, change biome every level
      ? levelIndex % biomes.length
      : Math.floor(levelIndex / nextBiomeEveryXLevels) % biomes.length;
    const nextBiome = biomes[loopedLevelIndex];
    if (nextBiome) {
      biome = nextBiome;
    } else {
      console.error('Could not find biome for levelIndex: ', levelIndex);
    }

    const isTutorialRun = !isTutorialComplete();
    if (levelIndex == 0) {
      isFirstEverPlaySession = !isFirstTutorialStepComplete();
    }
    const isTutorialStartLevel = isFirstEverPlaySession && levelIndex == 0;
    let caveParams = caveSizes.medium;
    if (isTutorialStartLevel) {
      caveParams = caveSizes.tutorial;
    } else if (isTutorialRun) {
      caveParams = caveSizes.extrasmall;
    } else if (levelIndex < 2) {
      caveParams = caveSizes.extrasmall;
    } else if (levelIndex < 6) {
      caveParams = caveSizes.small;
    }

    console.log('map gen: caveParams (to learn why some levels are too small)', caveParams);
    const { map, limits } = generateCave(caveParams || caveSizes.small, biome, this);
    const { tiles, liquid, width } = map;
    const levelData: LevelData = {
      levelIndex,
      biome,
      limits,
      liquid,
      obstacles: tiles.flatMap(t => {
        const obstacle = t && toObstacle(t, biome);
        return obstacle ? [obstacle] : [];
      }),
      imageOnlyTiles: [],
      width,
      pickups: [],
      enemies: [],
    };
    const finalTileImages = makeFinalTileImages(biome);
    let validSpawnCoords: Vec2[] = tiles.flatMap(t => t && t.image == finalTileImages.all_ground ? [t] : []);
    if (validSpawnCoords.length == 0) {
      // This block must occur BEFORE the "first time playing logic"
      console.error('Not enough spawn coords to spawn ANY enemies or pickups');
      return undefined;
    }
    // flatMap removes undefineds
    levelData.imageOnlyTiles = tiles.flatMap(x => x == undefined ? [] : [x]);

    let levelIndexForEnemySpawn = levelIndex;
    // Adjust difficulty via level index for tutorial runs so that it's not as hard
    if (isFirstEverPlaySession) {
      // This will trigger the first time they play which, working together with the next
      // if block, results in a levelIndex of 2 less than it would be which allows the first
      // 2 levels to be easier
      levelIndexForEnemySpawn -= 1;
    }
    if (isTutorialRun) {
      // This block works together with the above to make the very first run -2 easier
      // but if the player plays again (not their first time), but haven't completed the tutorial
      // this block will make it easier by -1
      levelIndexForEnemySpawn -= 1;
    }
    // End Block: Adjust difficulty via level index for tutorial runs so that it's not as hard

    // Spawn units at the start of the level
    let unitIds = getEnemiesForAltitude2(this, levelIndexForEnemySpawn);
    if (isTutorialStartLevel) {
      unitIds = [];
    } else if (levelIndexForEnemySpawn < 0) {
      unitIds = [golem_unit_id];

    }
    // TODO numberOfPickups should scale with level size
    const numberOfPickups = isTutorialStartLevel ? 0 : 4;
    for (let i = 0; i < numberOfPickups; i++) {
      if (validSpawnCoords.length == 0) { break; }
      const choice = chooseObjectWithProbability(
        Pickup.pickups
          .filter(p => isModActive(p, this))
          .map((p, i) => ({ index: i, probability: p.probability })),
        this.random);
      if (choice) {
        const { index } = choice;
        const validSpawnCoordsIndex = randInt(0, validSpawnCoords.length - 1, this.random);
        const coord = validSpawnCoords.splice(validSpawnCoordsIndex, 1)[0];
        if (coord) {
          levelData.pickups.push({ index, coord })
        }
      }
    }
    const numberOfMinibossesAllowed = Math.ceil(Math.max(0, (levelIndex - 4) / 4));
    let numberOfMinibossesMade = 0;
    for (let id of unitIds) {
      if (validSpawnCoords.length == 0) { break; }
      const validSpawnCoordsIndex = randInt(0, validSpawnCoords.length - 1, this.random);
      const coord = validSpawnCoords.splice(validSpawnCoordsIndex, 1)[0];
      const sourceUnit = allUnits[id];
      // Disallow miniboss for a unit spawning on the first levelIndex that they are allowed to spawn
      const minibossAllowed = (sourceUnit?.spawnParams?.unavailableUntilLevelIndex || 0) < levelIndex;
      if (coord) {
        const isMiniboss = !minibossAllowed ? false : numberOfMinibossesAllowed > numberOfMinibossesMade;
        if (isMiniboss) {
          numberOfMinibossesMade++;
        }
        levelData.enemies.push({ id, coord, isMiniboss })
      }
    }

    return levelData;

  }
  pickGroundTileLayers(biome: Biome): string[] {
    const layers: { [biome in Biome]: {
      baseTiles: string[],
      layer2Tiles: string[],
      layer3Tiles: string[],
    } } = {
      'blood': {
        baseTiles: [
          `tiles/${biome}/all_ground_dirt_1.png`,
          `tiles/${biome}/all_ground_dirt_2.png`,
          `tiles/${biome}/all_ground_dirt_3.png`,
          `tiles/${biome}/all_ground_dirt_4.png`,
          `tiles/${biome}/all_ground_dirt_5.png`,
          `tiles/${biome}/all_ground_dirt_6.png`,
          `tiles/${biome}/all_ground_dirt_7.png`,
          `tiles/${biome}/all_ground_dirt_8.png`,
          `tiles/${biome}/all_ground_dirt_9.png`,
        ],
        layer2Tiles: [
          `tiles/${biome}/all_ground_meat_1.png`,
          `tiles/${biome}/all_ground_meat_2.png`,
          `tiles/${biome}/all_ground_meat_3.png`,
          `tiles/${biome}/all_ground_meat_4.png`,
          `tiles/${biome}/all_ground_meat_5.png`,
          `tiles/${biome}/all_ground_meat_6.png`,
          `tiles/${biome}/all_ground_meat_7.png`,
          `tiles/${biome}/all_ground_meat_8.png`,
          `tiles/${biome}/all_ground_meat_9.png`,

        ],
        layer3Tiles: [
          `tiles/${biome}/all_ground_moss_1.png`,
          `tiles/${biome}/all_ground_moss_2.png`,
          `tiles/${biome}/all_ground_moss_3.png`,
          `tiles/${biome}/all_ground_moss_4.png`,
          `tiles/${biome}/all_ground_moss_5.png`,
          `tiles/${biome}/all_ground_moss_6.png`,
          `tiles/${biome}/all_ground_moss_7.png`,
          `tiles/${biome}/all_ground_moss_8.png`,
          `tiles/${biome}/all_ground_moss_9.png`,
        ],
      },
      'lava': {
        baseTiles: [
          `tiles/${biome}/all_ground_open_1.png`,
          `tiles/${biome}/all_ground_open_2.png`,
          `tiles/${biome}/all_ground_open_3.png`,
          `tiles/${biome}/all_ground_open_4.png`,
          `tiles/${biome}/all_ground_open_5.png`,
          `tiles/${biome}/all_ground_open_6.png`,
          `tiles/${biome}/all_ground_open_7.png`,
          `tiles/${biome}/all_ground_open_8.png`,
          `tiles/${biome}/all_ground_open_9.png`,
        ],
        layer2Tiles: [
          `tiles/${biome}/all_ground_flower_1.png`,
          `tiles/${biome}/all_ground_flower_2.png`,
          `tiles/${biome}/all_ground_flower_3.png`,
          `tiles/${biome}/all_ground_flower_4.png`,
          `tiles/${biome}/all_ground_flower_5.png`,
          `tiles/${biome}/all_ground_flower_6.png`,
          `tiles/${biome}/all_ground_flower_7.png`,
          `tiles/${biome}/all_ground_flower_8.png`,
          `tiles/${biome}/all_ground_flower_9.png`,
        ],
        layer3Tiles: [],
      },
      'water': {
        baseTiles: [
          `tiles/${biome}/all_ground_soil_1.png`,
          `tiles/${biome}/all_ground_soil_2.png`,
          `tiles/${biome}/all_ground_soil_3.png`,
          `tiles/${biome}/all_ground_soil_4.png`,
          `tiles/${biome}/all_ground_soil_5.png`,
          `tiles/${biome}/all_ground_soil_6.png`,
          `tiles/${biome}/all_ground_soil_7.png`,
          `tiles/${biome}/all_ground_soil_8.png`,
          `tiles/${biome}/all_ground_soil_9.png`,
        ],
        layer2Tiles: [
          `tiles/${biome}/all_ground_brick_1.png`,
          `tiles/${biome}/all_ground_brick_2.png`,
          `tiles/${biome}/all_ground_brick_3.png`,
          `tiles/${biome}/all_ground_brick_4.png`,
          `tiles/${biome}/all_ground_brick_5.png`,
          `tiles/${biome}/all_ground_brick_6.png`,
          `tiles/${biome}/all_ground_brick_7.png`,
          `tiles/${biome}/all_ground_brick_8.png`,
          // brick_9 has too many bricks and is obviously
          // a "square tile" so I'm omitting it from possible tiles
          // `tiles/${biome}/all_ground_brick_9.png`,
        ],
        layer3Tiles: [
          `tiles/${biome}/all_ground_shroom_1.png`,
          `tiles/${biome}/all_ground_shroom_2.png`,
          `tiles/${biome}/all_ground_shroom_3.png`,
          `tiles/${biome}/all_ground_shroom_4.png`,
          `tiles/${biome}/all_ground_shroom_5.png`,
          `tiles/${biome}/all_ground_shroom_6.png`,
          `tiles/${biome}/all_ground_shroom_7.png`,
          `tiles/${biome}/all_ground_shroom_8.png`,
          `tiles/${biome}/all_ground_shroom_9.png`,
        ],
      },
      'ghost': {
        baseTiles: [],
        layer2Tiles: [],
        layer3Tiles: [],
      },
    }
    const baseTile = `tiles/${biome}/all_ground.png`;
    const baseTiles: { path: string, probability: number }[] = [
      { path: baseTile, probability: 20 },
      ...layers[biome].baseTiles.map(path => ({ path, probability: 1 }))
    ]
    const baseTileChoice = chooseObjectWithProbability(baseTiles, this.random);
    const layer2Tiles: { path: string, probability: number }[] = [
      // No tile is the higher probability default so that this layers tiles are rarer
      { path: '', probability: 20 },
      ...layers[biome].layer2Tiles.map(path => ({ path, probability: 1 }))
    ]
    const layer2Choice = chooseObjectWithProbability(layer2Tiles, this.random);
    const layer3Tiles: { path: string, probability: number }[] = [
      // No tile is the higher probability default so that this layers tiles are rarer
      { path: '', probability: 20 },
      ...layers[biome].layer3Tiles.map(path => ({ path, probability: 1 }))
    ]
    const layer3Choice = chooseObjectWithProbability(layer3Tiles, this.random);
    return [baseTileChoice ? baseTileChoice.path : baseTile, layer2Choice ? layer2Choice.path : '', layer3Choice ? layer3Choice.path : ''];

  }
  addGroundTileImages(biome: Biome) {
    if (globalThis.headless) {
      return;
    }
    // Lay down a ground tile for every tile that is not liquid
    for (let tile of this.imageOnlyTiles.filter(t => t.image.indexOf('liquid') === -1)) {
      if (tile.image) {
        const layers = this.pickGroundTileLayers(biome);
        for (let path of layers) {
          if (path) {
            const sprite = addPixiSprite(path, containerBoard);
            if (sprite) {
              sprite.x = tile.x - config.COLLISION_MESH_RADIUS;
              sprite.y = tile.y - config.COLLISION_MESH_RADIUS;
            }
          }
        }
      }
    }
    if (!this.lastLevelCreated) {
      console.error('cannot lay down wall tiles, no lastLevelCreated to get biome from');
      return;
    }
    // Then lay down wall tiles on top of them
    for (let tile of this.imageOnlyTiles.filter(t => !t.image.includes(`tiles/${this.lastLevelCreated?.biome}/all_ground`))) {
      if (tile.image) {
        if (tile.image == `tiles/${this.lastLevelCreated.biome}/all_liquid.png`) {
          // liquid tiles are rendered with a shader
          continue;
        }
        // Ground tiles that border liquid should go in containerBoard
        // Wall tiles should go in containerUnits, yes UNITS so that they can be
        // z-index sorted with units so that when units die behind a wall their corpse image
        // doesn't get painted on top of the wall 
        const isWall = tile.image.toLowerCase().includes('wall');
        const sprite = addPixiSprite(tile.image, isWall ? containerUnits : containerBoard);
        if (sprite) {
          sprite.x = tile.x - config.COLLISION_MESH_RADIUS;
          sprite.y = tile.y - config.COLLISION_MESH_RADIUS;
        }
      }
    }
  }
  // fromSource is used when the spawn in question is spawning FROM something else,
  // like clone.  This prevents clones from spawning through walls
  isPointValidSpawn(spawnPoint: Vec2, radius: number, fromSource?: Vec2): boolean {
    if (fromSource) {
      // Ensure attemptSpawn isn't through any walls or liquidBounds
      if ([...this.walls, ...this.liquidBounds].some(wall => lineSegmentIntersection({ p1: fromSource, p2: spawnPoint }, wall))) {
        return false;
      }
    }
    // Ensure spawnPoint doesn't intersect any walls with radius:
    if ([...this.walls, ...this.liquidBounds].some(wall => {
      const rightAngleIntersection = findWherePointIntersectLineSegmentAtRightAngle(spawnPoint, wall);
      return rightAngleIntersection && math.distance(rightAngleIntersection, spawnPoint) <= radius;
    })) {
      return false;
    }
    // Ensure spawnPoint doesn't share coordinates with any other entity
    // (This prevents units from spawning directly on top of each other)
    const entities = this.getPotentialTargets(false);
    if (entities.some(entity => Vec.equal(Vec.round(entity), Vec.round(spawnPoint)))) {
      return false;
    }
    // Ensure spawnPoint isn't out of bounds
    if (this.isCoordOnWallTile(spawnPoint) || isOutOfBounds(spawnPoint, this)) {
      return false;
    }
    return true;

  }
  // ringLimit limits how far away from the spawnSource it will check for valid spawn locations
  // same as below "findValidSpanws", but shortcircuits at the first valid spawn found and returns that
  findValidSpawn(spawnSource: Vec2, ringLimit: number, radius: number = config.COLLISION_MESH_RADIUS): Vec2 | undefined {
    const honeycombRings = ringLimit;
    for (let s of math.honeycombGenerator(radius, spawnSource, honeycombRings)) {
      const attemptSpawn = { ...s, radius: config.COLLISION_MESH_RADIUS };
      if (this.isPointValidSpawn(attemptSpawn, config.COLLISION_MESH_RADIUS, spawnSource)) {
        return attemptSpawn
      }
    }
    return undefined;
  }
  // Same as above "findValidSpawn", but returns an array of valid spawns
  findValidSpawns(spawnSource: Vec2, radius: number = config.COLLISION_MESH_RADIUS / 4, ringLimit: number): Vec2[] {
    const validSpawns: Vec2[] = [];
    const honeycombRings = ringLimit;
    // The radius passed into honeycombGenerator is how far between vec2s each honeycomb cell is
    for (let s of math.honeycombGenerator(radius, spawnSource, honeycombRings)) {
      // attemptSpawns radius must be the full config.COLLISION_MESH_RADIUS to ensure
      // that the spawning unit wont intersect something it shouldn't
      const attemptSpawn = { ...s, radius: config.COLLISION_MESH_RADIUS };
      if (this.isPointValidSpawn(attemptSpawn, config.COLLISION_MESH_RADIUS, spawnSource)) {
        // Return the first valid spawn found
        validSpawns.push(attemptSpawn);
      }
    }
    return validSpawns;

  }

  cleanUpLevel() {
    // false ensures that all emitters are cleaned up, not just the
    // turn-scoped emitters
    this.particleFollowers = [];
    cleanUpEmitters(false);

    // Now that it's a new level clear out the level's dodads such as
    // bone dust left behind from destroyed corpses
    containerDoodads?.removeChildren();
    containerParticles?.removeChildren();
    containerParticlesUnderUnits?.removeChildren();
    // Clean previous level info
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      // Clear all remaining AI units
      if (u && u.unitType === UnitType.AI) {
        Unit.cleanup(u);
        this.units.splice(i, 1);
      }
    }
    // Now that the units have been cleaned up syncPredictionEntities
    // so they are not out of sync with the underworld units array
    this.syncPredictionEntities();
    // Clear all pickups
    for (let p of this.pickups) {
      Pickup.removePickup(p, this, false);
    }
    // Clear pickups arrow now that all pickups have been flaggedForDeletion
    this.pickups = [];
    // Clear all wall images:
    // Note: walls are stored in container Units so they can be sorted z-index
    // along with units
    // so this removes all unit images too.
    containerUnits?.removeChildren();


    // Empty any remaining forceMoves
    this.forceMove = [];
    this.forceMovePrediction = [];

    // Clear all floor images
    containerBoard?.removeChildren();
    containerLiquid?.removeChildren();
    cleanUpLiquidFilter();
    // Clean up blood
    cleanBlood();
    this.imageOnlyTiles = [];

    // Clear card usage counts, otherwise players will be
    // incentivied to bum around after a level to clear it themselves
    // which would be a bad player experience
    for (let p of this.players) {
      p.cardUsageCounts = {};
    }
  }
  postSetupLevel() {
    document.body?.classList.toggle('loading', false);
    runCinematicLevelCamera(this).then(() => {
      console.log('Cinematic Cam: Finished');
      // Set the first turn phase
      this.broadcastTurnPhase(turn_phase.PlayerTurns);
      cameraAutoFollow(false);
      setCameraToMapCenter(this);
      // If in a multiplayer game and it's a few levels in (giving time for players to get situated)
      // explaining pinging
      if (this.players.length > 1 && this.levelIndex > 2) {
        explain(EXPLAIN_PING);
      }
    });
  }
  // creates a level from levelData
  createLevelSyncronous(levelData: LevelData) {

    console.log('Setup: createLevelSyncronous');
    this.lastLevelCreated = levelData;
    setAbyssColor(levelData.biome);
    // Clean up the previous level
    this.cleanUpLevel();

    const { levelIndex, biome, limits, liquid, imageOnlyTiles, pickups, enemies, obstacles } = levelData;
    this.levelIndex = levelIndex;

    this.limits = limits;

    // Setup liquid
    setupLiquidFilter();
    for (let tile of liquid) {
      const sprite = addPixiTilingSprite(tile.image, containerLiquid);
      if (sprite) {
        sprite.x = tile.x - config.COLLISION_MESH_RADIUS;
        sprite.y = tile.y - config.COLLISION_MESH_RADIUS;
        this.liquidSprites.push(sprite);
      }
    }
    // empty tiles are tiles with an image of ''
    this.cacheWalls(obstacles, imageOnlyTiles.filter(x => x.image == ''));
    this.imageOnlyTiles = imageOnlyTiles;
    this.addGroundTileImages(biome);
    for (let p of pickups) {
      const pickup = Pickup.pickups[p.index];
      if (pickup) {
        Pickup.create({ pos: p.coord, pickupSource: pickup }, this, false);
      } else {
        console.error('Could not find pickup with index', p.index);
      }
    }
    for (let e of enemies) {
      this.spawnEnemy(e.id, e.coord, e.isMiniboss);
    }

    // Show text in center of screen for the new level
    queueCenteredFloatingText(
      ['Level', (this.levelIndex + 1).toString()],
      'white'
    );
    console.log('Setup: resetPlayerForNextLevel; reset all players')
    for (let player of this.players) {
      Player.resetPlayerForNextLevel(player, this);
    }
    // Change song now that level has changed:
    if (globalThis.playNextSong) {
      globalThis.playNextSong();
    }

    if (this.levelIndex !== 0) {
      // If this is not the first level allow players to pick a new perk
      this.players.forEach(p => p.perksLeftToChoose++);
    }
    // Reset diedDuringLevel now that we are starting a new level,
    // this must be called AFTER showUpgrades so that the players
    // that died will miss the chance to upgrade perks
    this.players.forEach(p => {
      p.diedDuringLevel = false;
    });

    // NOTE: Any data that needs to be synced from host to clients from this function MUST
    // be set BEFORE postSetupLevel is invoked because postSetupLevel will send a sync message
    // that will override the clientside data.
    this.postSetupLevel();
  }
  async createLevel(levelData: LevelData) {
    return new Promise<void>(resolve => {
      document.body?.classList.toggle('loading', true);
      // Add timeout so that loading can update dom
      setTimeout(() => {
        this.createLevelSyncronous(levelData);
        resolve();
      }, 10)
    });
  }
  generateLevelDataSyncronous(levelIndex: number): LevelData {
    console.log('Setup: generateLevelDataSyncronous', levelIndex);
    this.levelIndex = levelIndex;
    // Generate level
    let level;
    do {
      // Invoke generateRandomLevel again until it succeeds
      level = this.generateRandomLevelData(levelIndex);
    } while (level === undefined);
    this.pie.sendData({
      type: MESSAGE_TYPES.CREATE_LEVEL,
      level
    });
    return level;
  }
  async generateLevelData(levelIndex: number): Promise<LevelData> {
    console.log('Setup: generateLevelData');
    return new Promise<LevelData>(resolve => {
      document.body?.classList.toggle('loading', true);
      // setTimeout allows the UI to refresh before locking up the CPU with
      // heavy level generation code
      setTimeout(() => {
        resolve(this.generateLevelDataSyncronous(levelIndex));
      }, 10);
    })
  }
  checkPickupCollisions(unit: Unit.IUnit, prediction: boolean) {
    for (let pu of ((prediction && this.pickupsPrediction) ? this.pickupsPrediction : this.pickups)) {
      // Note, units' radius is rather small (to allow for crowding), so
      // this distance calculation uses neither the radius of the pickup
      // nor the radius of the unit.  It is hard coded to 2 COLLISION_MESH_RADIUSES
      // which is currently 64 px (or the average size of a unit);
      if (math.distance(unit, pu) < config.COLLISION_MESH_RADIUS) {
        Pickup.tryTriggerPickup(pu, unit, this, prediction);
      }
    }
  }
  isCoordOnWallTile(coord: Vec2): boolean {
    const cellX = Math.round(coord.x / config.OBSTACLE_SIZE);
    const cellY = Math.round(coord.y / config.OBSTACLE_SIZE);
    const originalTile = this.lastLevelCreated?.imageOnlyTiles[vec2ToOneDimentionIndexPreventWrap({ x: cellX, y: cellY }, this.lastLevelCreated?.width)];
    return !!originalTile && (originalTile.image === undefined || originalTile.image == '' || originalTile.image.includes('wall'));
  }
  getMousePos(): Vec2 {
    if (!(app && containerBoard)) {
      return { x: 0, y: 0 }
    }
    const { x, y } = containerBoard.toLocal(
      app.renderer.plugins.interaction.mouse.global,
    );
    return { x, y };
  }
  isGameOver(): boolean {
    // TODO will have to update this to allow PVP / factions
    const playerFactions = this.players.map(p => p.unit.faction);
    // Game is over once ALL units on player factions are dead (this includes player units)
    // so long as there are some players in the game.
    const isAllyNPCAlive = this.units.filter(u => u.unitType == UnitType.AI && playerFactions.includes(u.faction)).some(u => u.alive);
    // Note: unspawned players still own an "alive" unit
    const isConnectedPlayerAlive = this.players.filter(p => p.clientConnected && p.unit.alive).some(p => p.unit.alive)
    return this.players.length !== 0 && !isConnectedPlayerAlive && !isAllyNPCAlive;
  }
  updateGameOverModal() {
    // Add stats to modal:
    const elGameOverStats = document.getElementById('game-over-stats');
    const player = globalThis.player;
    if (!globalThis.headless) {
      if (elGameOverStats && player && player.stats) {
        elGameOverStats.innerHTML = `
Got to level ${this.levelIndex + 1}
      
Survived for ${((Date.now() - player.stats.gameStartTime) / 60000).toFixed(2)} Minutes

Total Kills: ${this.enemiesKilled}

Best Spell killed ${player.stats.bestSpell.unitsKilled} units
      <div class="stats-spell">
${CardUI.cardListToImages(player.stats.bestSpell.spell)}
      </div>
      ${JSON.stringify(player.stats.bestSpell.spell) !== JSON.stringify(player.stats.longestSpell) ?
            `
Longest Spell:
      <div class="stats-spell">
${CardUI.cardListToImages(player.stats.longestSpell)}
      </div>
        `
            : ''}
      `;

      } else {
        console.error('Cannot render stats');
      }
    }

  }
  tryGameOver(): boolean {
    // Clear previous timeout that would toggle game over state
    if (gameOverModalTimeout !== undefined) {
      clearTimeout(gameOverModalTimeout);
    }
    const isOver = this.isGameOver();
    if (!isOver) {
      // If clearing the game-over modal, clear it immediately
      document.body.classList.toggle('game-over', isOver);
    } else {
      // Show game over modal after a delay
      gameOverModalTimeout = setTimeout(() => {
        document.body.classList.toggle('game-over', isOver);
      }, 3000);
    }
    this.updateGameOverModal();
    if (globalThis.headless) {
      if (isOver) {
        const overworld = this.overworld;
        const pie = this.pie;
        // Only allow it to start the process of creating a new underworld once
        // because this function tryGameOver should be able to be called any number
        // of times and only the first time that it detects game over should it trigger
        // a new game
        if (!this.isRestarting) {
          const millisTillRestart = 10000;
          console.log('-------------------Host app game over', isOver, `restarting in ${Math.floor(millisTillRestart / 1000)} seconds`);
          this.isRestarting = setTimeout(() => {
            const newUnderworld = new Underworld(overworld, pie, Math.random().toString());
            // Add players back to underworld
            ensureAllClientsHaveAssociatedPlayers(overworld, overworld.clients)
            // Generate the level data
            newUnderworld.lastLevelCreated = newUnderworld.generateLevelDataSyncronous(0);
            // Actually create the level 
            newUnderworld.createLevelSyncronous(newUnderworld.lastLevelCreated);
          }, millisTillRestart);
        }
      } else {
        // If no longer game over, clear restarting timer
        if (this.isRestarting) {
          clearTimeout(this.isRestarting);
        }
      }
    }
    return isOver;
  }
  tryEndPlayerTurnPhase(): boolean {
    let doEndPlayerTurnPhase = false;
    // Only move on from the player turn phase if there are players in the game,
    // otherwise, wait for players to be in the game so that the serve doesn't just 
    // run cycles pointlessly
    const activePlayers = this.players.filter(Player.ableToAct);
    if (this.turn_phase === turn_phase.PlayerTurns && activePlayers.length > 0) {
      // If all players that can act have ended their turns...
      if (
        activePlayers.every(p => p.endedTurn)
      ) {
        doEndPlayerTurnPhase = true;
      } else {
        console.log('PlayerTurn: Check end player turn phase; players havent ended turn yet:', activePlayers.filter(p => !p.endedTurn).map(p => p.clientId));
      }
    }
    // If all connected players are dead
    if (this.players.filter(p => p.clientConnected).every(p => !p.unit.alive)) {
      // end the player turn phase to let the AI hash it out
      doEndPlayerTurnPhase = true;
    }
    if (doEndPlayerTurnPhase) {
      console.log('Underworld: TurnPhase: End player turn phase');
      // Safety, force die any units that are out of bounds (this should never happen)
      // Note: Player Controlled units are out of bounds when they are inPortal so that they don't collide,
      // this filters out PLAYER_CONTROLLED so that they don't get die()'d when they are inPortal
      for (let u of this.units.filter(u => u.alive && u.unitType !== UnitType.PLAYER_CONTROLLED)) {
        if (this.lastLevelCreated) {
          // Don't kill out of bound units if they are already flagged for removal
          // (Note: flaggedForRemoval units are set to NaN,NaN;  thus they are out of bounds, but 
          // they will be cleaned up so they shouldn't be killed here as this check is just to ensure
          // no living units that are unreachable hinder progressing through the game)
          if (!u.flaggedForRemoval) {
            // TODO ensure that this works on headless
            const originalTile = this.lastLevelCreated.imageOnlyTiles[vec2ToOneDimentionIndexPreventWrap({ x: Math.round(u.x / config.OBSTACLE_SIZE), y: Math.round(u.y / config.OBSTACLE_SIZE) }, this.lastLevelCreated.width)];
            if (!originalTile || originalTile.image == '') {
              console.error('Unit was force killed because they ended up out of bounds', u.unitSubType)
              Unit.die(u, this, false);
            }
          }
        }
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
      CardUI.updateCardBadges(this);
      // At the end of the player turn, deal damage if still in liquid
      for (let player of this.players) {
        if (player.unit.inLiquid && player.unit.alive) {
          doLiquidEffect(this, player.unit, false);
          floatingText({ coords: player.unit, text: 'Liquid damage', style: { fill: 'red' } });
        }
      }
      // Move onto next phase
      // Note: BroadcastTurnPhase should happen last because it
      // queues up a unitsync, so if changes to the units
      // were to happen AFTER broadcastTurnPhase they would be
      // overwritten when the sync occurred
      this.broadcastTurnPhase(turn_phase.NPC_ALLY);
      return true;
    }
    return false;
  }

  // This function is invoked when all factions have finished their turns
  async endFullTurnCycle() {
    // Move onto next phase
    // --
    // Note: The reason this logic happens here instead of in initializeTurnPhase
    // is because initializeTurnPhase needs to be called on game load to put everything
    // in a good state when updating to the canonical client's game state. (this 
    // happens when one client disconnects and rejoins).
    // --
    // Trigger onTurnEnd Events
    for (let unit of this.units.filter(u => u.unitType === UnitType.AI)) {
      await Promise.all(unit.onTurnEndEvents.map(
        async (eventName) => {
          const fn = Events.onTurnEndSource[eventName];
          return fn ? await fn(unit, this) : false;
        },
      ));
    }
    // Increment the turn number now that it's starting over at the first phase
    this.turn_number++;

    for (let p of this.pickups) {
      if (p.turnsLeftToGrab !== undefined) {
        p.turnsLeftToGrab--;
        if (p.text) {
          p.text.text = `${p.turnsLeftToGrab}`;
        }
        if (p.turnsLeftToGrab == 1) {
          // @ts-ignore: jid is a custom identifier to differentiate this child sprite
          const timeCircleSprite = p.image?.sprite.children.find(c => c.jid == Pickup.TIME_CIRCLE_JID);
          if (timeCircleSprite) {
            const timeCircleColorFilter = new MultiColorReplaceFilter(
              [
                // Change to red to warn the player that it's about to disappear
                [0x306082, 0xff0000],
              ],
              0.1
            );
            if (!timeCircleSprite.filters) {

              timeCircleSprite.filters = [];
            }
            timeCircleSprite.filters.push(timeCircleColorFilter);

          }

        }
      }
      if (p.turnsLeftToGrab !== undefined && p.turnsLeftToGrab < 0) {
        if (p.name == Pickup.CARDS_PICKUP_NAME) {
          playSFXKey('scroll_disappear');
          makeScrollDissapearParticles(p, false);
          explain(EXPLAIN_MISSED_SCROLL);
        }
        // Remove pickup
        Pickup.removePickup(p, this, false);
      }
    }
    // Add mana to AI units
    for (let unit of this.units.filter((u) => u.unitType === UnitType.AI && u.alive)) {
      unit.mana += unit.manaPerTurn;
      // Cap manaPerTurn at manaMax
      unit.mana = Math.min(unit.mana, unit.manaMax);
    }
  }
  syncTurnMessage() {
    console.log('syncTurnMessage: phase:', turn_phase[this.turn_phase]);
    let yourTurn = false;
    if (!this.tryGameOver() && this.turn_phase === turn_phase.PlayerTurns) {
      if (!globalThis.player?.endedTurn) {
        yourTurn = true;
      }
    }
    document.body?.classList.toggle('your-turn', yourTurn);
    Player.syncLobby(this);

  }
  async initializePlayerTurns() {
    await this.mergeExcessUnits();
    // Prevent possible desynce where portals don't spawn when unit dies
    // so it must spawn here to ensure players can move on
    this.checkIfShouldSpawnPortal();
    for (let player of this.players) {
      // Reset player.endedTurn
      // --
      // Important: This must be set for ALL players
      // before the rest of player initialization happens because
      // players that cannot start their turn (for various reasons)
      // will have their turn ended during initialization
      // and when a turn is ended it checks if it should move on to the
      // next phase and that check considers if all players are either
      // unable to act or have already ended their turns. and so if the
      // first player has their turn auto ended before the other players
      // have had their .endedTurn property reset to false, then the game
      // would go to the next phase thinking all players had ended their turns
      // or been unable to act.
      player.endedTurn = false;
    }
    for (let player of this.players) {
      if (player.unit.alive) {
        // Restore player to max mana at start of turn
        // Let mana remain above max if it already is (due to other influences that may
        // make it go above max like mana potions, spells, perks, etc);
        player.unit.mana = Math.max(player.unit.manaMax, player.unit.mana);
      }

      // If this current player is NOT able to take their turn...
      if (!Player.ableToAct(player)) {
        // Skip them
        this.endPlayerTurn(player.clientId);
        // Do not continue with initialization
        continue;
      }
      if (player == globalThis.player && globalThis.player.isSpawned) {
        // Notify the current player that their turn is starting
        queueCenteredFloatingText(`Your Turn`);
        // Don't play turn sfx when recording
        if (!globalThis.isHUDHidden && !document.body?.classList.contains('hide-card-holders')) {
          playSFXKey('yourTurn');
        }
      }
      // Trigger attributePerks
      const perkRandomGenerator = seedrandom(getUniqueSeedString(this, player));
      for (let i = 0; i < player.attributePerks.length; i++) {
        const perk = player.attributePerks[i];
        if (perk) {
          tryTriggerPerk(perk, player, 'everyTurn', perkRandomGenerator, this, 700 * i);
        }
      }
      // Trigger onTurnStart Events
      const onTurnStartEventResults: boolean[] = await Promise.all(player.unit.onTurnStartEvents.map(
        async (eventName) => {
          const fn = Events.onTurnStartSource[eventName];
          return fn ? await fn(player.unit, false, this) : false;
        },
      ));
      if (onTurnStartEventResults.some((b) => b)) {
        // If any onTurnStartEvents return true, skip the player
        console.log(`Force end player turn, player ${player.clientId} due to onTurnStartEvent`)
        this.endPlayerTurn(player.clientId);
        // Do not continue with initialization for this player
        continue;
      }
      // If player is killed at the start of their turn (for example, due to poison)
      // end their turn
      if (!player.unit.alive) {
        console.log(`Force end player turn, player ${player.clientId} died when their turn started`)
        this.endPlayerTurn(player.clientId);
        // Do not continue with initialization for this player
        continue;
      }
    }
    this.syncTurnMessage();
  }
  // Sends a network message to end turn
  async endMyTurn() {
    if (globalThis.player) {
      if (!globalThis.player.isSpawned) {
        console.log('You cannot end your turn until you are spawned.');
        return;
      }
      // Turns can only be manually ended during the PlayerTurns phase
      if (this.isMyTurn()) {
        // Check globalThis.player.isSpawned to prevent quicksaving an invalid underworld file
        if (globalThis.save && globalThis.player.isSpawned) {
          // For now, only save if in a singleplayer game (as determined by solomode_client_id)
          // because save support hasn't been added to multiplayer yet
          if (isSinglePlayer(globalThis.player.clientId)) {
            console.info(`Dev: quick saving game as "${globalThis.quicksaveKey}"`);
            // Force overwrite for quicksave, never prompt "are you sure?" when auto saving a quicksave
            globalThis.save(globalThis.quicksaveKey, true);
          }
        }
        let affirm = true
        // Interrupt endTurn with a cancellable prompt IF
        // player hasn't already ended their turn (note if they already HAVE ended their turn, just allow the END_TURN message to go through; this
        // might, but hopefully never, come in handy in the event that there is a desync and the client thinks it's ended its turn but the server doesn't. then
        // the client can end it again)
        // and stamina is still max
        // and player has not cast yet
        if (!globalThis.player.endedTurn && globalThis.player.unit.stamina == globalThis.player.unit.staminaMax && !globalThis.castThisTurn) {
          // Don't prompt "are you sure" for end turn when recording
          if (!globalThis.isHUDHidden && !document.body?.classList.contains('hide-card-holders')) {
            affirm = await Jprompt({ text: 'Are you sure you want to end your turn without moving or casting?', noBtnText: 'Cancel', noBtnKey: 'Escape', yesText: 'End Turn', yesKey: 'Space', yesKeyText: 'Spacebar' });
          }
        }
        if (affirm) {
          // Clear your selected spells when ending your turn.  This is a user preference inspried by a playtest
          CardUI.clearSelectedCards(this);
          console.log('endMyTurn: send END_TURN message');
          // Don't play turn sfx when recording
          if (!globalThis.isHUDHidden && !document.body?.classList.contains('hide-card-holders')) {
            playSFXKey('endTurn');
          }
          // When a user ends their turn, clear tints and spell effect projections
          // so they they don't cover the screen while AI take their turn
          clearSpellEffectProjection(this);
          clearTints(this);
          this.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
        }
      }
    }
  }
  async endPlayerTurn(clientId: string) {
    if (this.turn_phase == turn_phase.Stalled) {
      // Do not end a players turn while game is Stalled or it will trigger
      // an exit of the Stalled phase and that should ONLY happen when a player reconnects
      return;
    }
    const playerIndex = this.players.findIndex((p) => p.clientId === clientId);
    const player = this.players[playerIndex];
    if (!player) {
      console.error('Cannot end turn, player with clientId:', clientId, 'does not exist');
      return;
    }
    if (this.turn_phase != turn_phase.PlayerTurns) {
      // (A player "ending their turn" when it is not their turn
      // can occur when a client disconnects when it is not their turn)
      console.info('Cannot end the turn of a player when it isn\'t currently their turn')
      return
    }
    // Ensure players can only end the turn when it IS their turn
    if (this.turn_phase === turn_phase.PlayerTurns) {
      // Don't trigger onTurnEndEvents more than once
      if (!player.endedTurn) {
        player.endedTurn = true;
        // Trigger onTurnEnd Events
        await Promise.all(player.unit.onTurnEndEvents.map(
          async (eventName) => {
            const fn = Events.onTurnEndSource[eventName];
            return fn ? await fn(player.unit, this) : false;
          },
        ));
      }
      // Extra guard to protect against unexpected state
      // where a player is dead but their turn is not ended
      // Ensure that dead players are set to "turn ended"
      for (let player of this.players) {
        const unit = player.unit;
        // If player is dead,
        if (unit && !unit.alive) {
          // and their turn has not been ended yet,
          // set their endedTurn to true
          if (!player.endedTurn) {
            player.endedTurn = true;
          }
        }
      }
      console.log('PlayerTurn: End player turn', clientId);
      this.syncTurnMessage();

      // If all enemies are dead and all non portaled players are dead, make non portaled players portal
      // so the game can continue
      const allEnemiesAreDead = this.units.filter(u => u.faction == Faction.ENEMY).every(u => !u.alive);
      if (allEnemiesAreDead && this.players.filter(p => !Player.inPortal(p)).every(p => !p.unit.alive)) {
        console.log('Make dead, non-portaled players enter portal');
        this.players.forEach(p => {
          Unit.resurrect(p.unit);
          Player.enterPortal(p, this);
        });
      }
      // If player hotseat multiplayer
      if (numberOfHotseatPlayers > 1) {
        // Change to next player
        // Shift front player to the back so that first player found for fromPlayer is the next player
        const shifted = this.players.shift();
        if (shifted) {
          this.players.push(shifted);
        } else {
          console.error('Hotseat: shifted player is undefined');
        }
        if (this.players[0]) {

          globalThis.player = this.players[0];
        } else {
          console.error('Hotseat: Tried to change player but player is undefined');
        }
        CardUI.recalcPositionForCards(globalThis.player, this);
        CardUI.syncInventory(undefined, this);
        runPredictions(this);
        // Show upgrades if player has received an upgrade
        this.showUpgrades();

        // Announce new players' turn
        if (globalThis.player && globalThis.player.name) {
          queueCenteredFloatingText(globalThis.player.name);
        }

        // Turn on auto follow if they are spawned, and off if they are not
        cameraAutoFollow(!!globalThis.player?.isSpawned);
      }

      // Note: This should occur AFTER dead, non-portaled players may have entered the portal
      // because checkForEndOfLevel considers if all players are portaled.
      const wentToNextLevel = this.checkForEndOfLevel();
      if (wentToNextLevel) {
        return;
      }
      const gameIsOver = this.tryGameOver();
      if (gameIsOver) {
        // Prevent infinite loop since there are no players
        // alive it would continue to loop endlessly and freeze up
        // the game if it didn't early return here
        return;
      }
      const wentToNextPhase = this.tryEndPlayerTurnPhase();
      if (wentToNextPhase) {
        return;
      }
    } else {
      console.error("turn_phase must be PlayerTurns to end turn.  Cannot be ", this.turn_phase);
    }
    Player.syncLobby(this);
  }
  chooseUpgrade(player: Player.IPlayer, upgrade: Upgrade.IUpgrade) {
    if (upgrade.type == 'card') {
      // Reset reroll counter now that player has chosen a card
      player.reroll = 0;
      if (player.upgradesLeftToChoose <= 0) {
        console.log('Player:', player);
        console.error('Player managed to choose an upgrade without being supposed to');
      }
      // Decrement and 
      // Ensure it doesn't go negative
      player.upgradesLeftToChoose = Math.max(0, player.upgradesLeftToChoose - 1);
    } else if (upgrade.type == 'special') {
      // Any future logic for special cards such as 'reroll' goes here

    }
    upgrade.effect(player, this);

    // Special upgrades don't get added to the upgrade list because they just
    // execute some functionality on the client side
    if (upgrade.type !== 'special') {
      player.upgrades.push(upgrade);
    }
    if (player == globalThis.player) {
      document.body?.querySelector(`.card[data-upgrade="${upgrade.title}"]`)?.classList.toggle('chosen', true);
      // Clear upgrades when current player has picked one
      document.body?.classList.toggle(showUpgradesClassName, false);
      // Show next round of upgrades
      this.showUpgrades();

    }

  }

  showUpgrades() {
    const player = globalThis.player;
    if (document.body?.classList.contains(showUpgradesClassName)) {
      console.log('showUpgrades: showUpgrades was called but it is already visible so this function returns immediately to avoid regenerating upgrades');
      return;
    }
    if (!player) {
      // Only log error if this is not a headless instance because a headless instance
      // will never have globalThis.player
      if (!globalThis.headless) {
        console.error('showUpgrades: Cannot show upgrades, no globalThis.player');
      }
      return
    }
    // Return immediately if player has no upgrades that left to pick from
    if (player.upgradesLeftToChoose <= 0 && player.perksLeftToChoose <= 0) {
      console.log('showUpgrades: Closing upgrade screen, nothing left to pick')
      return;
    }
    const isPerk = player.upgradesLeftToChoose == 0;
    let minimumProbability = 0;
    if (player.upgradesLeftToChoose > 0 && player.inventory.length < config.STARTING_CARD_COUNT) {
      // Limit starting cards to a probability of 10 or more
      minimumProbability = 10;
      if (elUpgradePickerLabel) {
        elUpgradePickerLabel.innerHTML = `Pick a Spell`;
      }
    } else {
      if (elUpgradePickerLabel) {
        elUpgradePickerLabel.innerHTML = isPerk ? 'Pick an Upgrade' : 'Pick a Spell';
      }
    }
    // If playing hotseat multiplayer, prepend the player name so users know which player they
    // are picking an upgrade for
    if (elUpgradePickerLabel) {
      const hotseatPlayerName = globalThis.numberOfHotseatPlayers > 1 ? `${player.name}: ` : '';;
      elUpgradePickerLabel.innerHTML = hotseatPlayerName + elUpgradePickerLabel?.innerHTML;
    }
    // Now that level is complete, move to the Upgrade view where players can choose upgrades
    // before moving on to the next level
    // Generate Upgrades
    document.body?.classList.toggle(showUpgradesClassName, true);
    if (!elUpgradePicker || !elUpgradePickerContent) {
      console.error('showUpgrades: elUpgradePicker or elUpgradePickerContent are undefined.');
    }
    if (player) {
      const numberOfUpgradesToChooseFrom = 3 - player.reroll;
      if (isPerk) {
        const perks = generatePerks(numberOfUpgradesToChooseFrom, this);
        // Show the perks that you already have
        showPerkList(player);
        const elPerks = perks.map(perk => createPerkElement(perk, player, this));
        if (elUpgradePickerContent) {
          elUpgradePickerContent.innerHTML = '';
          for (let elUpgrade of elPerks) {
            if (elUpgrade) {
              elUpgradePickerContent.appendChild(elUpgrade);
              if (globalThis.devAutoPickUpgrades && elUpgrade == elPerks[0]) {
                elUpgrade.click();
              }
            } else {
              console.warn('showUpgrades: perk is undefined, this block should never be executed in headless mode')
            }
          }
          // Allow reroll if there is more than 1 upgrade to choose from
          if (numberOfUpgradesToChooseFrom > 1) {
            // Reroll perks button
            this.addRerollButton(player);
          }
        }

      } else {
        // Only show upgrades, not perk list
        hidePerkList();

        const upgrades = Upgrade.generateUpgrades(player, numberOfUpgradesToChooseFrom, minimumProbability, this);
        if (!upgrades.length) {
          // Player already has all the upgrades
          document.body?.classList.toggle(showUpgradesClassName, false);
          warnNoMoreSpellsToChoose();
        } else {
          const elUpgrades = upgrades.map((upgrade) => Upgrade.createUpgradeElement(upgrade, player, this));
          if (elUpgradePickerContent) {
            elUpgradePickerContent.innerHTML = '';
            for (let elUpgrade of elUpgrades) {
              if (elUpgrade) {
                elUpgradePickerContent.appendChild(elUpgrade);
                if (globalThis.devAutoPickUpgrades && elUpgrade == elUpgrades[0]) {
                  elUpgrade.click();
                }
              } else {
                console.warn('showUpgrades: Upgrade is undefined, this block should never be executed in headless mode')
              }
            }
          }
          // Allow reroll if there is more than 1 upgrade to choose from
          if (numberOfUpgradesToChooseFrom > 1) {
            this.addRerollButton(player);
          }
        }
      }
    } else {
      console.error('showUpgrades: Upgrades cannot be generated, player not found');
    }
  }

  addRerollButton(player: Player.IPlayer) {
    if (elUpgradePickerContent) {
      const elRerollPerks = document.createElement('div');
      elRerollPerks.classList.add('reroll-btn');
      elRerollPerks.style.color = 'white';
      elRerollPerks.addEventListener('click', () => {
        playSFXKey('reroll');
        player.reroll++;
        // Clear upgrades
        document.body?.classList.toggle(showUpgradesClassName, false);
        this.showUpgrades();
      });
      elRerollPerks.addEventListener('mouseenter', (e) => {
        playSFXKey('click');
      });
      elUpgradePickerContent.appendChild(elRerollPerks);
    }
  }

  // Returns true if it goes to the next level
  checkForEndOfLevel(): boolean {
    // All living (and client connected) players
    // Also check if they are spawned, otherwise in multiplayer,
    // it will cycle through level after level quickly and infinitely
    // because all players are in the portal and alive.  Adding the isSpawned
    // check ensures that it will only move on once all connected players have
    // spawned and are in the portal
    const livingSpawnedPlayers = this.players.filter(
      (p) => p.unit.alive && p.clientConnected && p.isSpawned,
    );
    const areAllLivingPlayersInPortal =
      livingSpawnedPlayers.filter(Player.inPortal).length === livingSpawnedPlayers.length;
    // Advance the level if there are living players and they all are in the portal:
    if (livingSpawnedPlayers.length && areAllLivingPlayersInPortal) {
      console.log('All living, spawned players are inPortal, go to the next level');
      // Invoke initLevel within a timeout so that this function
      // doesn't have to wait for level generation to complete before
      // returning
      setTimeout(() => {
        // Make all dead players go "in portal" so they share the same state at the living players in
        // preparation for the next level:
        this.players.filter(p => !p.unit.alive).forEach(player => {
          // Copied from Player.enterPortal. This code puts the dead-at-end-of-level players
          // in the same state as portaled players so they don't show up at the next level where they died.
          Image.hide(player.unit.image);
          Unit.setLocation(player.unit, { x: NaN, y: NaN });
          player.diedDuringLevel = true;
        });
        // Prepare the next level
        if (globalThis.isHost(this.pie)) {
          this.generateLevelData(++this.levelIndex);
        } else {
          console.log('This instance is not host, host will trigger next level generation.');
        }
      }, 0);
      // Return of true signifies it went to the next level
      return true;
    }
    return false;
  }
  getRandomCoordsWithinBounds(bounds: Limits, seed?: prng): Vec2 {
    const x = randInt(bounds.xMin || 0, bounds.xMax || 0, seed || this.random);
    const y = randInt(bounds.yMin || 0, bounds.yMax || 0, seed || this.random);
    return { x, y };
  }
  tryRestartTurnPhaseLoop() {
    // See GameLoops.md for more details 
    if (this.turn_phase == turn_phase.Stalled && this.players.some(player => Player.ableToAct(player))) {
      console.log('Turn Management: Restarting turn loop with PlayerTurns')
      this.broadcastTurnPhase(turn_phase.PlayerTurns);
      // Special Case: in the event that a client is stuck with a stalled turn phase
      // it can set itself back to PlayerTurns. (The server won't send another 
      // SET_PHASE to player_turns message because it probably already is on player_turns
      // and it won't send duplicate.)
      // This is an extra safety to ensure that no client gets stuck.  And it called setTurnPhase
      // directly by design because it's not initializing a turn_phase, just changing it.
      if (!globalThis.isHost(this.pie)) {
        this.setTurnPhase(turn_phase.PlayerTurns);
      }
    }
  }
  async broadcastTurnPhase(p: turn_phase) {
    // If host, send sync; if non-host, ignore 
    if (globalThis.isHost(this.pie)) {
      console.log('Broadcast SET_PHASE: ', turn_phase[p]);

      this.pie.sendData({
        type: MESSAGE_TYPES.SET_PHASE,
        phase: p,
        units: this.units.filter(u => !u.flaggedForRemoval).map(Unit.serialize),
        pickups: this.pickups.filter(p => !p.flaggedForRemoval).map(Pickup.serialize),
        players: this.players.map(Player.serialize),
        lastUnitId: this.lastUnitId,
        lastPickupId: this.lastPickupId,
        // the state of the Random Number Generator
        RNGState: this.random.state(),
        // TODO sync doodads here
      });
    }
  }
  // sets underworld.turn_phase variable and syncs related html classes
  // Do not confuse with initializeTurnPhase which runs initialization
  // logic when the turn phase changes.  Note: initializeTurnPhase
  // calls this function
  // Important Note: This should never be called directly by a client, it shall only
  // be triggered through a network message from the host which in turn invokes
  // initializeTurnPhase (on each client and itself);
  // otherwise the clients and host could get out of sync
  setTurnPhase(p: turn_phase) {
    console.log('setTurnPhase(', turn_phase[p], ')');
    this.turn_phase = p;
    this.syncTurnMessage();

    // Remove all phase classes from body
    if (!globalThis.headless) {
      // @ts-expect-error Property 'values' does not exist on type 'DOMTokenList'
      for (let phaseClass of document.body?.classList.values()) {
        if (phaseClass.includes('phase-')) {
          document.body?.classList.remove(phaseClass);
        }
      }
    }
    const phase = turn_phase[this.turn_phase];
    if (phase) {
      // Add current phase class to body
      document.body?.classList.add('phase-' + phase.toLowerCase());
    } else {
      console.error('Invalid turn phase', this.turn_phase)
    }

  }
  // Initialization logic that runs to setup a change of turn_phase
  // Invoked only through wsPie, use broadcastTurnPhase in game logic
  // when you want to set the turn_phase
  // See GameLoops.md for more details
  async initializeTurnPhase(p: turn_phase) {
    console.log('initializeTurnPhase(', turn_phase[p], ')');

    // Clear cast this turn
    globalThis.castThisTurn = false;

    // Clear debug graphics
    globalThis.debugGraphics?.clear()

    // Change the underworld.turn_phase variable and
    // related html classes that are used by the UI to
    // know what turn phase it is
    this.setTurnPhase(p);

    // Clean up invalid units
    const keepUnits: Unit.IUnit[] = [];
    for (let u of this.units) {
      if (!u.flaggedForRemoval) {
        keepUnits.push(u);
      }
    }
    this.units = keepUnits;

    // Clean up invalid pickups
    const keepPickups: Pickup.IPickup[] = [];
    for (let p of this.pickups) {
      if (!p.flaggedForRemoval) {
        keepPickups.push(p);
      }
    }
    this.pickups = keepPickups;

    const phase = turn_phase[this.turn_phase];
    if (phase) {
      switch (phase) {
        case turn_phase[turn_phase.PlayerTurns]:
          if (this.players.every(p => !p.clientConnected)) {
            // This is the only place where the turn_phase can become Stalled, when it is supposed
            // to be player turns but there are no players connected.
            // Note: the Stalled turn_phase should be set immediately, not broadcast
            // This is an exception because if the game is stalled, by definition, there
            // are no players to broadcast to.
            // Setting it immediately ensures that any following messages in the queue won't reengage
            // the turn_phase loop, causing an infinite loop
            this.turn_phase = turn_phase.Stalled;
            console.log('Turn Management: Skipping initializingPlayerTurns, no players connected. Setting turn_phase to "Stalled"');
          } else {
            // Start the players' turn
            for (let u of this.units.filter(u => u.unitType == UnitType.PLAYER_CONTROLLED)) {
              // Reset stamina for player units so they can move again
              // Allow overfill with stamina potion so this only sets it UP to
              // staminaMax, it won't lower it
              if (u.stamina < u.staminaMax) {
                u.stamina = u.staminaMax;
              }
            }
            // Lastly, initialize the player turns.
            // Note, it is possible that calling this will immediately end
            // the player phase (if there are no players to take turns)
            this.initializePlayerTurns();
          }
          // Note: The player turn occurs asyncronously because it depends on player input so the call to
          // `broadcastTurnPhase(turn_phase.NPC_ALLY)` happens inside tryEndPlayerTurnPhase(); whereas the other blocks in
          // this switch statement always move to the next faction turn on their last line before the break, but this one does
          // not.
          break;
        case turn_phase[turn_phase.NPC_ALLY]:
          // Now that player's turn is over, clear any emitters that failed to clean up themselves
          // that are marked as "turn lifetime" 
          cleanUpEmitters(true);
          // Clear enemy attentionMarkers since it's now their turn
          globalThis.attentionMarkers = [];
          // Only execute turn if there are units to take the turn:
          if (this.units.filter(u => u.unitType == UnitType.AI && u.faction == Faction.ALLY && u.alive).length) {
            // Run AI unit actions
            await this.executeNPCTurn(Faction.ALLY);
          } else {
            console.log('Turn Management: Skipping executingNPCTurn for Faction.ALLY');
          }
          // At the end of their turn, deal damage if still in liquid
          for (let unit of this.units.filter(u => u.unitType == UnitType.AI && u.faction == Faction.ALLY)) {
            if (unit.inLiquid && unit.alive) {
              doLiquidEffect(this, unit, false);
              floatingText({ coords: unit, text: 'Liquid damage', style: { fill: 'red' } });
            }
          }
          // Now that allies are done taking their turn, change to NPC Enemy turn phase
          this.broadcastTurnPhase(turn_phase.NPC_ENEMY)
          break;
        case turn_phase[turn_phase.NPC_ENEMY]:
          // Clear enemy attentionMarkers since it's now their turn
          globalThis.attentionMarkers = [];
          // Only execute turn if there are units to take the turn:
          if (this.units.filter(u => u.unitType == UnitType.AI && u.faction == Faction.ENEMY && u.alive).length) {
            // Run AI unit actions
            await this.executeNPCTurn(Faction.ENEMY);
          } else {
            console.log('Turn Management: Skipping executingNPCTurn for Faction.ENEMY');
          }
          await this.endFullTurnCycle();
          // At the end of their turn, deal damage if still in liquid
          for (let unit of this.units.filter(u => u.unitType == UnitType.AI && u.faction == Faction.ENEMY)) {
            if (unit.inLiquid && unit.alive) {
              doLiquidEffect(this, unit, false);
              floatingText({ coords: unit, text: 'Liquid damage', style: { fill: 'red' } });
            }
          }
          // Loop: go back to the player turn
          this.broadcastTurnPhase(turn_phase.PlayerTurns);
          break;
        default:
          break;
      }
      // Sync player health, mana, stamina bars to ensure that it's up to date
      // at the start of any turn_phase so there's no suprises
      this.syncPlayerPredictionUnitOnly();
      Unit.syncPlayerHealthManaUI(this);
    } else {
      console.error('Invalid turn phase', this.turn_phase)
    }
  }

  async executeNPCTurn(faction: Faction) {
    console.log('game: executeNPCTurn', Faction[faction]);
    const cachedTargets: { [id: number]: { targets: Unit.IUnit[], canAttack: boolean } } = {};
    for (let u of this.units.filter(
      (u) => u.unitType === UnitType.AI && u.alive && u.faction == faction
    )) {
      const unitSource = allUnits[u.unitSourceId];
      if (unitSource) {
        // Set unit stamina to max so that it can calculate if they can attack target
        // Note: This must be done BEFORE caching targets and canUnitAttackTarget so that it
        // will have stamina to make the canUnitAttackTarget evaluation
        u.stamina = u.staminaMax;
        const targets = unitSource.getUnitAttackTargets(u, this);
        cachedTargets[u.id] = { targets, canAttack: this.canUnitAttackTarget(u, targets && targets[0]) };
      }
      // Set all units' stamina to 0 before their turn is initialized so that any melee units that have remaining stamina
      // wont move during the ranged unit turn
      u.stamina = 0;
    }
    for (let subTypes of [[UnitSubType.RANGED_LOS, UnitSubType.RANGED_RADIUS, UnitSubType.SUPPORT_CLASS], [UnitSubType.MELEE]]) {
      const actionPromises: Promise<void>[] = [];
      unitloop: for (let u of this.units.filter(
        (u) => u.unitType === UnitType.AI && u.alive && u.faction == faction && subTypes.includes(u.unitSubType),
      )) {
        // Set unit stamina to max so that they may move now that it is their turn
        u.stamina = u.staminaMax;
        // Trigger onTurnStart Events
        const abortTurn = await Unit.runTurnStartEvents(u, false, this);
        if (abortTurn) {
          continue unitloop;
        }
        // If unit is now dead (due to turnStartEvents)
        // abort their turn
        if (!u.alive) {
          continue unitloop;
        }
        const unitSource = allUnits[u.unitSourceId];
        if (unitSource) {
          const { targets, canAttack } = cachedTargets[u.id] || { targets: [], canAttack: false };
          // Add unit action to the array of promises to wait for
          let promise = raceTimeout(5000, `Unit.action; unitSourceId: ${u.unitSourceId}; subType: ${u.unitSubType}`, unitSource.action(u, targets, this, canAttack).then(async (actionResult) => {
            // Ensure ranged units get out of liquid so they don't take DOT
            // This doesn't apply to melee units since they will automatically move towards you to attack,
            // whereas without this ranged units would be content to just sit in liquid and die from the DOT
            if (u.unitSubType !== UnitSubType.MELEE && u.inLiquid) {

              const seed = seedrandom(`${this.seed}-${this.turn_number}-${u.id}`);
              const coords = findRandomGroundLocation(this, u, seed);
              if (coords) {
                await Unit.moveTowards(u, coords, this);
              }
            }
            return actionResult;
          }));
          actionPromises.push(promise);
        } else {
          console.error(
            'Could not find unit source data for',
            u.unitSourceId,
          );
        }
      }
      this.triggerGameLoopHeadless();
      await Promise.all(actionPromises);
    }

  }
  canUnitAttackTarget(u: Unit.IUnit, attackTarget?: Unit.IUnit): boolean {
    if (!attackTarget) {
      return false;
    }
    switch (u.unitSubType) {
      case UnitSubType.MELEE:
        const maxPathDistance = u.attackRange + u.stamina;
        // optimization: Only calculate full path if the unit is less than or equal to their remaining
        // stamina and attackRange because they certainly cannot attack the target if the target
        // is beyond their stamina radius and range
        // but we need to calculate the full path if they are within the stamina radius because the path
        // might require that they travel farther than they are able to in one turn.
        if (math.distance(u, attackTarget) <= maxPathDistance) {
          this.setPath(u, attackTarget);
          if (u.path && u.path.points.length) {
            // Returns true if melee unit WILL be within range once their done moving
            // (Note: Does not take into account dynamic obstacles)
            // (Note: lastPointInPath may be beyond where the unit's stamina will allow them to go in one turn)
            const lastPointInPath = u.path.points[u.path.points.length - 1]
            if (lastPointInPath && !withinMeleeRange({ ...u, ...lastPointInPath }, attackTarget)) {
              // Note: a unit's path isn't guarunteed to include the target (if 
              // they can't find a valid path it won't include the target)
              // So if the lastPointInPath isn't relatively close to the target,
              // return false because the path doesn't make it all the way to the target
              return false;
            }
            const dist = calculateDistanceOfVec2Array([u, ...u.path.points]);
            return !!u.path.points.length && dist <= maxPathDistance;
          } else {
            // Returns true if melee unit is ALREADY within range
            return withinMeleeRange(u, attackTarget)
          }
        } else {
          return false;
        }
      case UnitSubType.RANGED_LOS:
        return u.alive && this.hasLineOfSight(u, attackTarget) && Unit.inRange(u, attackTarget);
      case UnitSubType.RANGED_RADIUS:
        return u.alive && Unit.inRange(u, attackTarget) && u.mana > u.manaCostToCast;
      case UnitSubType.SUPPORT_CLASS:
        // Support classes (such as priests and summoners) dont attack targets
        return false;
      default:
        console.error('Cannot determine canUnitAttackTarget, unit sub type is unaccounted for', u.unitSubType)
        return false;
    }

  }
  getEntitiesWithinDistanceOfTarget(target: Vec2, distance: number, prediction: boolean) {
    const withinDistance: HasSpace[] = [];
    const potentialTargets = this.getPotentialTargets(prediction);
    for (let entity of potentialTargets) {
      if (math.distance(entity, target) <= distance) {
        withinDistance.push(entity);
      }
    }
    return withinDistance;
  }

  getPickupsWithinDistanceOfTarget(
    target: Vec2,
    distance: number,
    prediction: boolean,
  ): Pickup.IPickup[] {
    const withinDistance: Pickup.IPickup[] = [];
    const pickups = (prediction && this.pickupsPrediction) ? this.pickupsPrediction : this.pickups;
    for (let pickup of pickups) {
      if (math.distance(pickup, target) <= distance) {
        withinDistance.push(pickup);
      }
    }
    return withinDistance;
  }
  getUnitsWithinDistanceOfTarget(
    target: Vec2,
    distance: number,
    prediction: boolean,
  ): Unit.IUnit[] {
    const withinDistance: Unit.IUnit[] = [];
    const units = (prediction && this.unitsPrediction) ? this.unitsPrediction : this.units;
    for (let unit of units) {
      if (math.distance(unit, target) <= distance) {
        withinDistance.push(unit);
      }
    }
    return withinDistance;
  }
  getUnitsAt(coords: Vec2, prediction?: boolean): Unit.IUnit[] {
    const sortedByProximityToCoords = (prediction && this.unitsPrediction ? this.unitsPrediction : this.units)
      // Filter for only valid units, not units with NaN location or waiting to be removed
      .filter(u => !u.flaggedForRemoval && !isNaN(u.x) && !isNaN(u.y))
      // Filter for units within SELECTABLE_RADIUS of coordinates
      .filter(u => math.distance(u, coords) <= (u.isMiniboss ? config.SELECTABLE_RADIUS * config.UNIT_MINIBOSS_SCALE_MULTIPLIER : config.SELECTABLE_RADIUS))
      // Order by closest to coords
      .sort((a, b) => math.distance(a, coords) - math.distance(b, coords))
      // Sort dead units to the back, prefer selecting living units
      // TODO: This should be opposite if the spell is ressurect
      .sort((a, b) => a.alive && b.alive ? 0 : a.alive ? -1 : 1);
    return sortedByProximityToCoords;
  }
  getUnitAt(coords: Vec2, prediction?: boolean): Unit.IUnit | undefined {
    return this.getUnitsAt(coords, prediction)[0];
  }
  getPickupAt(coords: Vec2, prediction?: boolean): Pickup.IPickup | undefined {
    const sortedByProximityToCoords = (prediction && this.pickupsPrediction ? this.pickupsPrediction : this.pickups)
      .filter(p => !p.flaggedForRemoval && !isNaN(p.x) && !isNaN(p.y))
      .filter(p => !isNaN(p.x) && !isNaN(p.y) && math.distance(coords, p) <= p.radius).sort((a, b) => math.distance(a, coords) - math.distance(b, coords));
    const closest = sortedByProximityToCoords[0]
    return closest;
  }
  getDoodadAt(coords: Vec2, prediction?: boolean): Doodad.IDoodad | undefined {
    const sortedByProximityToCoords = (prediction && this.doodadsPrediction ? this.doodadsPrediction : this.doodads)
      // Filter for only valid doodads
      .filter(d => !isNaN(d.x) && !isNaN(d.y))
      // Filter for units within SELECTABLE_RADIUS of coordinates
      .filter(d => math.distance(d, coords) <= config.SELECTABLE_RADIUS)
      // Order by closest to coords
      .sort((a, b) => math.distance(a, coords) - math.distance(b, coords))
    return sortedByProximityToCoords[0];
  }
  addDoodadToArray(doodad: Doodad.IDoodad, prediction: boolean) {
    if (prediction && this.doodadsPrediction) {
      this.doodadsPrediction.push(Doodad.copyForPredictionDoodad(doodad))
    } else {
      this.doodads.push(doodad);
    }
  }
  addUnitToArray(unit: Unit.IUnit, prediction: boolean): Unit.IUnit {
    if (prediction && this.unitsPrediction) {
      const predictionCopy = Unit.copyForPredictionUnit(unit, this)
      this.unitsPrediction.push(predictionCopy);
      return predictionCopy;
    } else {
      this.units.push(unit);
      return unit;
    }
  }
  addPickupToArray(pickup: Pickup.IPickup, prediction: boolean) {
    if (prediction && this.pickupsPrediction) {
      this.pickupsPrediction.push(Pickup.copyForPredictionPickup(pickup))
    } else {
      this.pickups.push(pickup);
    }
  }
  async castCards(
    args: CastCardsArgs
  ): Promise<Cards.EffectState> {
    const {
      casterCardUsage,
      casterUnit,
      casterPositionAtTimeOfCast,
      cardIds,
      castLocation,
      prediction,
      outOfRange,
      magicColor,
      casterPlayer,
      initialTargetedUnitId,
      initialTargetedPickupId,
    } = args;
    if (!prediction && casterUnit == (globalThis.player && globalThis.player.unit)) {
      globalThis.castThisTurn = true;
    }

    if (!prediction) {
      tutorialCompleteTask('cast');
      tutorialCompleteTask('castMultipleInOneTurn', () => casterUnit.mana < casterUnit.manaMax);
    }

    let effectState: Cards.EffectState = {
      cardIds,
      shouldRefundLastSpell: false,
      casterCardUsage,
      casterUnit,
      casterPositionAtTimeOfCast,
      casterPlayer,
      targetedUnits: [],
      targetedPickups: [],
      targetedDoodads: [],
      castLocation,
      aggregator: {
        unitDamage: [],
        radius: 0,
      },
      initialTargetedUnitId,
      initialTargetedPickupId
    };

    // Get initial targets
    let unitsAtCastLocation = this.getUnitsAt(castLocation, prediction);
    const firstCardId = effectState.cardIds[0];
    if (firstCardId) {
      const firstCard = Cards.allCards[firstCardId];
      // If first card in spell has onlySelectDeadUnits to true,
      // filter units for dead ones.  This prevents a living unit
      // standing over a corpse from preventing the caster from
      // selecting the corpse
      if (firstCard && firstCard.onlySelectDeadUnits) {
        unitsAtCastLocation = unitsAtCastLocation.filter(u => !u.alive);
      }
    }
    // Get first unit at cast location
    if (effectState.initialTargetedUnitId !== undefined) {
      const initialTargetUnit = this.units.find(u => u.id == effectState.initialTargetedUnitId);
      if (initialTargetUnit) {
        Cards.addTarget(initialTargetUnit, effectState);
      } else {
        console.error('effectState.initialTargetedUnitId was defined but the unit was not found');
      }
    } else {
      const unitAtCastLocation = unitsAtCastLocation[0];
      if (unitAtCastLocation) {
        effectState.initialTargetedUnitId = unitAtCastLocation.id;
        Cards.addTarget(unitAtCastLocation, effectState);
      }
    }
    // Get first pickup at cast location
    if (effectState.initialTargetedPickupId !== undefined) {
      const initialTargetPickup = this.pickups.find(p => p.id == effectState.initialTargetedPickupId);
      if (initialTargetPickup) {
        Cards.addTarget(initialTargetPickup, effectState);
      } else {
        console.error('effectState.initialTargetedPickupId was defined but the unit was not found');
      }
    } else {
      const pickupAtCastLocation = this.getPickupAt(castLocation, prediction);
      if (pickupAtCastLocation) {
        effectState.initialTargetedPickupId = pickupAtCastLocation.id;
        Cards.addTarget(pickupAtCastLocation, effectState);
      }
    }
    // const doodadAtCastLocation = this.getDoodadAt(castLocation, prediction);
    // if (doodadAtCastLocation) {
    //   Cards.addTarget(doodadAtCastLocation, effectState);
    // }
    // End Get Initial Targets

    if (!effectState.casterUnit.alive) {
      // Prevent dead players from casting
      return effectState;
    }

    const castingParticleEmitter = makeRisingParticles(effectState.casterUnit, prediction, hexToString(magicColor || 0xffffff), -1);

    // "quantity" is the number of identical cards cast in a row. Rather than casting the card sequentially
    // quantity allows the card to have a unique scaling effect when cast sequentially after itself.
    let quantity = 1;
    let excludedTargets: Unit.IUnit[] = [];
    for (let index = 0; index < effectState.cardIds.length; index++) {
      // Reset flag that informs if the last spell was refunded.
      effectState.shouldRefundLastSpell = false;
      const cardId = effectState.cardIds[index];
      if (cardId === undefined) {
        console.error('card id is undefined in loop', index, effectState.cardIds);
        continue;
      }
      const card = Cards.allCards[cardId];
      if (card) {
        // Only increment quantity for sequntial identical cards IF the card
        // explicitly supports quantity
        if (card.supportQuantity) {
          const nextCardId = effectState.cardIds[index + 1];
          if (nextCardId !== undefined) {
            if (nextCardId === cardId) {
              quantity++;
              continue;
            }
          }
        }

        // Refactor notice: This hard-coded "Protection" should be refactored out into
        // an isTargeted callback if there become more uses for preventing or modifying 
        // targeting when it occurs. But for now since it's the only use, "Protection"
        // is hard-coded here
        excludedTargets = excludedTargets.concat(effectState.targetedUnits.filter(u => {
          const protectionModifier = u.modifiers[protection.id];
          const excluded = !!protectionModifier;
          if (excluded) {
            protection.notifyProtected(u, prediction);
            protectionModifier.quantity -= 1;
            if (protectionModifier.quantity <= 0) {
              Unit.removeModifier(u, protection.id, this);
            }
          }
          return excluded;
        }));
        // Filter out protected units
        effectState.targetedUnits = effectState.targetedUnits.filter(u => !excludedTargets.includes(u));

        const cardEffectPromise = card.effect(effectState, card, quantity, this, prediction, outOfRange);
        if (prediction) {
          this.fullySimulateForceMovePredictions();
        }
        if (globalThis.headless) {
          this.triggerGameLoopHeadless();
        }

        // Await the cast
        try {
          effectState = await reportIfTakingTooLong(10000, `${card.id};${prediction}`, cardEffectPromise);
        } catch (e) {
          console.error('Unexpected error from card.effect', e);
        }

        if (!effectState.shouldRefundLastSpell) {
          // Compute spell mana/health cost and add card usage count
          // This happens after the spell is cast so that fizzle spells can be refunded
          const spellCostTally = {
            manaCost: 0,
            healthCost: 0
          };
          for (let i = 0; i < quantity; i++) {
            const singleCardCost = calculateCostForSingleCard(card, (casterCardUsage[card.id] || 0) + i);
            spellCostTally.manaCost += singleCardCost.manaCost;
            spellCostTally.healthCost += singleCardCost.healthCost;
          }
          // Apply mana and health cost to caster
          // Note: it is important that this is done BEFORE a card is actually cast because
          // the card may affect the caster's mana
          effectState.casterUnit.mana -= spellCostTally.manaCost;
          if (spellCostTally.healthCost !== 0) {
            Unit.takeDamage(effectState.casterUnit, spellCostTally.healthCost, effectState.casterUnit, this, prediction, effectState);
          }

          // Increment card usage; now that the caster is using the card
          if (casterCardUsage[cardId] === undefined) {
            casterCardUsage[cardId] = 0;
          }
          casterCardUsage[cardId] += card.expenseScaling * quantity;
          if (!prediction) {
            CardUI.updateCardBadges(this);
          }
        }

        // Clear images from previous card before drawing the images from the new card
        containerSpells?.removeChildren();
      }
      // Reset quantity once a card is cast
      quantity = 1;
    }
    if (!prediction) {
      // Clear spell animations once all cards are done playing their animations
      containerSpells?.removeChildren();
    }

    stopAndDestroyForeverEmitter(castingParticleEmitter);
    this.checkIfShouldSpawnPortal();
    this.tryGameOver();

    return effectState;
  }
  checkIfShouldSpawnPortal() {
    // If all enemy units are dead and at least one player is spawned and connected
    if (this.units.filter(u => u.faction == Faction.ENEMY && !u.flaggedForRemoval).every(u => !u.alive) && this.players.some(p => p.isSpawned && p.clientConnected)) {
      // Make all potion pickups disappear so as to not compell players to waste time walking around picking them
      // all up
      // Also do not remove portals
      this.pickups.filter(p => p.name !== Pickup.CARDS_PICKUP_NAME && p.name !== Pickup.PICKUP_PORTAL_NAME).forEach(p => {
        makeScrollDissapearParticles(p, false);
        Pickup.removePickup(p, this, false);
      });
      // Spawn portal near each player
      const portalPickup = Pickup.pickups.find(p => p.name == Pickup.PICKUP_PORTAL_NAME);
      if (portalPickup) {
        const portalsAlreadySpawned = !!this.pickups.filter(p => !p.flaggedForRemoval && !isNaN(p.x) && !isNaN(p.x)).find(p => p.name === Pickup.PICKUP_PORTAL_NAME)
        if (!portalsAlreadySpawned) {
          for (let playerUnit of this.units.filter(u => u.unitType == UnitType.PLAYER_CONTROLLED && u.alive)) {
            const portalSpawnLocation = this.findValidSpawn(playerUnit, 4) || playerUnit;
            Pickup.create({ pos: portalSpawnLocation, pickupSource: portalPickup }, this, false);
            // Give all player units infinite stamina when portal spawns for convenience.
            playerUnit.stamina = Number.POSITIVE_INFINITY;
            // Give all players max health and mana (it will be reset anyway when they are reset for the next level
            // but this disswades them from going around to pickup potions)
            playerUnit.health = playerUnit.healthMax;
            playerUnit.mana = playerUnit.manaMax;
            // Since playerUnit's health and mana is reset, we need to immediately sync the prediction unit
            // so that it doesn't inncorrectly warn "self damage due to spell" by seeing that the prediction unit
            // has less health than the current player unit.
            this.syncPlayerPredictionUnitOnly();

          }
        } else {
          console.log('Portals have already been spawned, do not spawn additional');
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
  unitIsIdentical(unit: Unit.IUnit, serialized: Unit.IUnitSerialized): boolean {
    return unit.id == serialized.id && unit.unitSourceId == serialized.unitSourceId;
  }
  syncUnits(units: Unit.IUnitSerialized[]) {
    console.log('sync: Syncing units', units.map(u => u.id), 'current units:', this.units.map(u => u.id));

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
    // What couldn't be synced store in an array to create after iterating is finished
    let serializedUnitsLeftToCreate = [];
    // Sync what units you can
    for (let i = 0; i < units.length; i++) {
      const serializedUnit = units[i];
      const currentUnit = this.units[i];
      if (serializedUnit) {
        if (currentUnit) {
          // if there is a unit to compare it to, if they are the same, syncronize;
          // if not, delete and recreate:
          // Ensure currentUnit's image is displaying, if not we have to create a new one
          if (this.unitIsIdentical(currentUnit, serializedUnit) && currentUnit.image?.sprite.parent !== null) {
            // Note: Unit.syncronize maintains the player.unit reference
            Unit.syncronize(serializedUnit, currentUnit);
          } else {
            Unit.cleanup(currentUnit);
            serializedUnitsLeftToCreate.push(serializedUnit);
          }
        } else {
          serializedUnitsLeftToCreate.push(serializedUnit);
        }
      }
    }
    // Create what's left over
    for (let serializedUnit of serializedUnitsLeftToCreate) {
      const newUnit = Unit.load(serializedUnit, this, false);
      Unit.returnToDefaultSprite(newUnit);
    }

  }
  // Sends what this player is thinking to other clients
  // Optimized to only send if message has changed
  sendPlayerThinking(thoughts: { target?: Vec2, cardIds: string[] }) {
    sendPlayerThinkingThrottled(thoughts, this);
  }
  syncPlayers(players: Player.IPlayerSerialized[]) {
    console.log('sync: Syncing players', JSON.stringify(players.map(p => p.clientId)));
    // Clear previous players array
    this.players = [];
    players.map(p => Player.load(p, this));
    if (globalThis.player?.isSpawned) {
      // If player is already spawned, clear spawn instructions
      if (elInstructions) {
        elInstructions.innerText = '';
      }

    }
  }
  pickupIsIdentical(pickup: Pickup.IPickup, serialized: Pickup.IPickupSerialized): boolean {
    return pickup.id == serialized.id && pickup.name == serialized.name;
  }
  syncPickups(pickups: Pickup.IPickupSerialized[]) {
    console.log('sync: Syncing pickups', pickups.map(u => u.id), 'current pickups:', this.pickups.map(u => u.id));

    // Remove excess pickups if local copy of pickups has more pickups than the pickups it
    // should be syncing with
    if (this.pickups.length > pickups.length) {
      console.log('sync: Remove excess pickups')
      for (let i = pickups.length; i < this.pickups.length; i++) {
        const pickup = this.pickups[i];
        if (pickup) {
          Pickup.removePickup(pickup, this, false);
        }
      }
      this.pickups.splice(pickups.length);
    }
    // What couldn't be synced store in an array to create after iterating is finished
    let serializedpickupsLeftToCreate = [];
    let pickupsToRemove = [];
    // Sync what pickups you can
    for (let i = 0; i < pickups.length; i++) {
      const serializedPickup = pickups[i];
      const currentPickup = this.pickups[i];
      if (serializedPickup) {
        if (currentPickup) {
          // if there is a pickup to compare it to, if they are the same, syncronize;
          // if not, delete and recreate:
          // Ensure currentPickup's image is displaying, if not we have to create a new one
          if (this.pickupIsIdentical(currentPickup, serializedPickup) && currentPickup.image?.sprite.parent !== null) {
            const { x, y, radius, inLiquid, immovable, beingPushed, singleUse, playerOnly, turnsLeftToGrab, flaggedForRemoval } = serializedPickup;
            Object.assign(currentPickup, { x, y, radius, inLiquid, immovable, beingPushed, singleUse, playerOnly, turnsLeftToGrab, flaggedForRemoval });
          } else {
            pickupsToRemove.push(currentPickup);
            serializedpickupsLeftToCreate.push(serializedPickup);
          }
        } else {
          serializedpickupsLeftToCreate.push(serializedPickup);
        }
      }
    }
    for (let pickup of pickupsToRemove) {
      Pickup.removePickup(pickup, this, false);
    }
    // Create what's left over
    for (let serializedPickup of serializedpickupsLeftToCreate) {
      Pickup.load(serializedPickup, this, false);
    }

  }
  async mergeExcessUnits() {
    // How many max units there can be to a faction before a merge occurs:
    const FACTION_MAX_UNITS = 20;
    const mergeMapKeys = Object.keys(mergeMap);
    for (let faction of [Faction.ALLY, Faction.ENEMY]) {
      const factionedUnits = this.units.filter(u => u.faction == faction);
      const factionedUnitsOverLimit = factionedUnits.length - FACTION_MAX_UNITS;
      if (factionedUnitsOverLimit > 0) {
        const mergesToDo = factionedUnitsOverLimit / (config.NUMBER_OF_UNITS_TO_MERGE)
        interface MergeCandidate {
          mainUnit: Unit.IUnit,
          mergeUnits: Unit.IUnit[],
        };
        // Find merge candidates
        const mergeCandidates: MergeCandidate[] = [];
        const unitsGroupedByUnitSourceId = factionedUnits.reduce<{ [unitSourceId: string]: Unit.IUnit[] }>((groups, unit) => {
          if (groups[unit.unitSourceId] === undefined) {
            groups[unit.unitSourceId] = [];
          }
          groups[unit.unitSourceId]?.push(unit);
          return groups;
        }, {});
        for (let [unitSourceId, units] of Object.entries(unitsGroupedByUnitSourceId)) {
          if (mergeCandidates.length >= mergesToDo) {
            break;
          }
          if (mergeMapKeys.includes(unitSourceId)) {
            let currentCandidate: MergeCandidate | undefined = undefined;
            for (let u of units) {
              if (!currentCandidate) {
                currentCandidate = {
                  mainUnit: u,
                  mergeUnits: []
                }
                continue;
              } else {
                if (currentCandidate.mergeUnits.length < config.NUMBER_OF_UNITS_TO_MERGE) {
                  currentCandidate.mergeUnits.push(u);
                } else {
                  mergeCandidates.push(currentCandidate);
                  currentCandidate = {
                    mainUnit: u,
                    mergeUnits: []
                  }
                }
              }

            }

          }
        }
        console.log('tjest merge', mergeCandidates);
        let mergePromises = [];
        for (let merge of mergeCandidates) {
          if (merge.mergeUnits.length == config.NUMBER_OF_UNITS_TO_MERGE) {
            mergePromises.push(this.merge(merge.mainUnit, merge.mergeUnits));
          }

        }
        await Promise.all(mergePromises);
      }
    }

  }
  // Returns true if succeeded
  async merge(unit: Unit.IUnit, mergeUnits: Unit.IUnit[]): Promise<boolean> {
    let lastPromise = Promise.resolve();
    for (let u of mergeUnits) {
      if (!globalThis.headless) {
        lastPromise = makeManaTrail(u, unit, this, '#930e0e', '#ff0000');
      }
    }
    await lastPromise;
    // @ts-ignore: allow undefined
    const unitSourceId: string | undefined = mergeMap[unit.unitSourceId];
    if (unitSourceId) {
      const sourceUnit = allUnits[unitSourceId];
      if (sourceUnit) {

        const summonedUnit = Unit.create(
          sourceUnit.id,
          // Start the unit at the summoners location
          unit.x,
          unit.y,
          // A unit always summons units in their own faction
          unit.faction,
          sourceUnit.info.image,
          UnitType.AI,
          sourceUnit.info.subtype,
          sourceUnit.unitProps,
          this
        );
        // Add summoning sickeness so they can't act after they are summoned
        Unit.addModifier(summonedUnit, summoningSicknessId, this, false);
      } else {
        console.error('Cannot find source unit to merge into');
      }
    } else {
      floatingText({ coords: unit, text: 'This unit is not setup to be merged' });
      return false;
    }
    // Clean up units that got merged
    for (let u of mergeUnits) {
      if (u) {
        Unit.cleanup(u);
      }
    }
    Unit.cleanup(unit);
    // runPredictions so the merged units' attack badges disappear
    runPredictions(this);
    return true;

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
    const { pie, overworld, random, players, units, pickups, walls, pathingPolygons, liquidSprites,
      unitsPrediction, pickupsPrediction, doodadsPrediction, particleFollowers, ...rest } = this;
    return {
      ...rest,
      // isRestarting is an id for SetTimeout and cannot be serialized
      isRestarting: undefined,
      players: this.players.map(Player.serialize),
      units: this.units.filter(u => !u.flaggedForRemoval).map(Unit.serialize),
      pickups: this.pickups.filter(p => !p.flaggedForRemoval).map(Pickup.serialize),
      doodads: this.doodads.map(Doodad.serialize),
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
  //   this.turn_number = serialized.turn_number;
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
    const { pie, overworld, players, units, pickups, random, gameLoop, particleFollowers, ...rest } = this;
    const serialized: IUnderworldSerializedForSyncronize = {
      ...rest,
      // isRestarting is an id for SetTimeout and cannot be serialized
      isRestarting: undefined,
      // the state of the Random Number Generator
      RNGState: this.random.state() as SeedrandomState,
    }
    return serialized;
  }
}

type IUnderworldSerialized = Omit<typeof Underworld, "pie" | "overworld" | "prototype" | "players" | "units"
  | "unitsPrediction" | "pickups" | "pickupsPrediction" | "doodads" | "doodadsPrediction" | "random" | "turnInterval" | "liquidSprites"
  | "particleFollowers"
  // walls and pathingPolygons are omitted because they are derived from obstacles when cacheWalls() in invoked
  | "walls" | "pathingPolygons"> & {
    players: Player.IPlayerSerialized[],
    units: Unit.IUnitSerialized[],
    pickups: Pickup.IPickupSerialized[],
    doodads: Doodad.IDoodadSerialized[]
  };
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type UnderworldNonFunctionProperties = Exclude<NonFunctionPropertyNames<Underworld>, null | undefined>;
export type IUnderworldSerializedForSyncronize = Omit<Pick<Underworld, UnderworldNonFunctionProperties>, "pie" | "overworld" | "debugGraphics" | "players" | "units" | "pickups" | "obstacles" | "random" | "gameLoop" | "particleFollowers">;

// globalThis.testUnitAlgorithms = () => {

//   console.log('Previous:')
//   for (let i = 0; i < 10; i++) {
//     const enemies = getEnemiesForAltitude(globalThis.devUnderworld, i)
//     const sums = enemies.reduce((sums, cur) => {
//       if (!sums[cur]) {
//         sums[cur] = 1;
//       } else {
//         sums[cur] += 1
//       }
//       return sums;
//     }, {})
//     console.log(`level ${i}`, sums);
//   }
//   console.log('New:')
//   for (let i = 0; i < 10; i++) {
//     const enemies = getEnemiesForAltitude2(globalThis.devUnderworld, i)
//     const sums = enemies.reduce((sums, cur) => {
//       if (!sums[cur]) {
//         sums[cur] = 1;
//       } else {
//         sums[cur] += 1
//       }
//       return sums;
//     }, {})
//     console.log(`level ${i}`, sums);
//   }
// }

function getEnemiesForAltitude2(underworld: Underworld, levelIndex: number): string[] {
  // Feel: Each level should feel "themed"
  // Requirements
  // - Any level, including starting levels, should have variety
  // - The higher the level number the more types of enemies can spawn
  // - The higher the level number the more amount of enemies can spawn
  //   - But it should consider a budget, for example, lots of high level enemies should mean less low level enemies

  // Prevent negative values which can happen during tutorial
  const adjustedLevelIndex = Math.max(0, levelIndex);

  const numberOfTypesOfEnemies = 2 + Math.floor(adjustedLevelIndex / 2);
  let possibleUnitsToChoose = Object.values(allUnits)
    .filter(u => u.spawnParams && u.spawnParams.unavailableUntilLevelIndex <= adjustedLevelIndex && isModActive(u, underworld))
    .map(u => ({ id: u.id, probability: u.spawnParams?.probability || 1, budgetCost: u.spawnParams?.budgetCost || 1 }))
  const unitTypes = Array(numberOfTypesOfEnemies).fill(null)
    // flatMap is used to remove any undefineds
    .flatMap(() => {
      const chosenUnitType = chooseObjectWithProbability(possibleUnitsToChoose, underworld.random)
      // Remove chosen Unit type from pick source
      if (chosenUnitType) {
        possibleUnitsToChoose = possibleUnitsToChoose.filter(u => u.id !== chosenUnitType.id)
        return [chosenUnitType]
      }
      return [];
    })
    // Sort by most expensive first
    .sort((a, b) => b.budgetCost - a.budgetCost);
  // Now that we've determined which unit types will be in the level we have to
  // budget out the quantity
  let units = [];
  let budgetLeft = (adjustedLevelIndex + 1) * Math.max(3, (adjustedLevelIndex + 1) - 3);
  const connectedClients = underworld.players.filter(p => p.clientConnected);
  if (connectedClients.length > config.NUMBER_OF_PLAYERS_BEFORE_BUDGET_INCREASES) {
    const budgetMultiplier = 1 + (1 / config.NUMBER_OF_PLAYERS_BEFORE_BUDGET_INCREASES) * (connectedClients.length - config.NUMBER_OF_PLAYERS_BEFORE_BUDGET_INCREASES);
    console.log('Difficulty: Increase budget by', budgetMultiplier, ' due to the number of players connected');
    budgetLeft *= budgetMultiplier;
  }
  console.log('Budget for level index', adjustedLevelIndex, 'is', budgetLeft);
  const totalBudget = budgetLeft;
  if (levelIndex == config.LAST_LEVEL_INDEX) {
    budgetLeft -= 20;
    units.push(bossmasonUnitId);
  }
  // How we choose:
  // 1. Start with the most expensive unit and random a number between 1 and 50% budget / unit budget cost
  // 2. Keep iterating with other units
  while (budgetLeft > 0) {
    for (let chosenUnitType of unitTypes
      // Sort by most expensive first
      .sort((a, b) => b.budgetCost - a.budgetCost)) {
      // Prevent overspend
      if (chosenUnitType.budgetCost > budgetLeft) {
        // Prevent infinite loop
        budgetLeft--;
        continue;
      }
      // Never let one unit type take up more than 70% of the budget (this prevents a level from being
      // mostly an expensive unit)
      // and never let one unit type have more instances than the levelIndex (this prevents
      // late game levels with a huge budget from having an absurd amount of cheap units)
      const maxNumberOfThisUnit = Math.min(levelIndex, Math.floor(totalBudget * 0.7 / chosenUnitType.budgetCost));
      const howMany = randInt(1, maxNumberOfThisUnit, underworld.random);
      for (let i = 0; i < howMany; i++) {
        units.push(chosenUnitType.id);
        budgetLeft -= chosenUnitType.budgetCost;
      }
    }
  }
  return units;
}

// Idea: Higher probability of tougher units at certain levels
function getEnemiesForAltitude(underworld: Underworld, levelIndex: number): string[] {
  const numberOfUnits = 3 + levelIndex;
  const possibleUnitsToChoose = Object.values(allUnits)
    .filter(u => u.spawnParams && u.spawnParams.unavailableUntilLevelIndex <= levelIndex)
    .map(u => ({ id: u.id, probability: u.spawnParams ? u.spawnParams.probability : 0 }))
  const unitIds = Array(numberOfUnits).fill(null)
    // flatMap is used to remove any undefineds
    .flatMap(() => {
      const chosenUnit = chooseObjectWithProbability(possibleUnitsToChoose, underworld.random)
      return chosenUnit ? [chosenUnit.id] : []
    })
  return unitIds;
}

// Explicit list of biome types
export type Biome = 'water' | 'lava' | 'blood' | 'ghost';

export function biomeTextColor(biome?: Biome): number | string {
  switch (biome) {
    case 'blood':
      return 'white';
    case 'lava':
      return 'white';
    case 'water':
      return 'white';//colors.textSoftBlack;
    case 'ghost':
      return 'white';
    default:
      return 'white';
  }
}
export interface LevelData {
  levelIndex: number,
  biome: Biome,
  limits: Limits,
  obstacles: Obstacle.IObstacle[];
  liquid: Tile[];
  imageOnlyTiles: Tile[];
  // Width in tiles
  width: number;
  pickups: {
    index: number;
    coord: Vec2;
  }[];
  enemies: {
    id: string,
    coord: Vec2,
    isMiniboss: boolean
  }[];
}

interface CastCardsArgs {
  casterCardUsage: Player.CardUsage,
  casterUnit: Unit.IUnit,
  casterPositionAtTimeOfCast: Vec2,
  cardIds: string[],
  castLocation: Vec2,
  prediction: boolean,
  // True if the cast is out of range, this can be used to draw UI elements differently
  // (like the color of a radius circle in the "Target Circle" card) to clue the user in to
  // the fact that the spell is out of range but it's showing them what would happen.
  outOfRange?: boolean,
  magicColor?: number,
  casterPlayer?: Player.IPlayer,
  initialTargetedUnitId?: number,
  initialTargetedPickupId?: number,

}
const mergeMap = {
  [golem_unit_id]: BLOOD_GOLEM_ID,
  [ARCHER_ID]: BLOOD_ARCHER_ID,
  [BLOOD_GOLEM_ID]: MANA_VAMPIRE_ID,
  [BLOOD_ARCHER_ID]: DARK_PRIEST_ID

}