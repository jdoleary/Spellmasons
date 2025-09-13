import seedrandom from 'seedrandom';
import * as config from './config';
import * as Unit from './entity/Unit';
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
import * as immune from './cards/immune';
import * as CSSClasses from './CSSClasses';
import * as log from './log';
import safeStringify from 'fast-safe-stringify';
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
  getCamera, containerPlayerThinking,
  addPixiSprite,
  graphicsBloodSmear,
  containerLiquid,
  setupLiquidFilter,
  cleanUpLiquidFilter,
  BloodParticle,
  setAbyssColor,
  setCameraToMapCenter,
  addPixiTilingSprite,
  cleanBlood,
  cacheBlood,
  containerWalls,
} from './graphics/PixiUtils';
import floatingText, { queueCenteredFloatingText, warnNoMoreSpellsToChoose } from './graphics/FloatingText';
import { UnitType, Faction, UnitSubType, GameMode, Pie } from './types/commonTypes';
import type { Vec2 } from "./jmath/Vec";
import * as Vec from "./jmath/Vec";
import Events from './Events';
import { UnitSource, allUnits } from './entity/units';
import { clearSpellEffectProjection, clearTints, drawHealthBarAboveHead, drawUnitMarker, isOutOfBounds, predictAIActions, runPredictions, updatePlanningView } from './graphics/PlanningView';
import { chooseObjectWithProbability, chooseOneOfSeeded, getUniqueSeedString, getUniqueSeedStringPerPlayer, prng, randFloat, randInt, SeedrandomState, shuffle } from './jmath/rand';
import { calculateCostForSingleCard, CardCost } from './cards/cardUtils';
import { lineSegmentIntersection, LineSegment, findWherePointIntersectLineSegmentAtRightAngle } from './jmath/lineSegment';
import { expandPolygon, isVec2InsidePolygon, mergePolygon2s, Polygon2, Polygon2LineSegment, toLineSegments, toPolygon2LineSegments } from './jmath/Polygon2';
import { calculateDistanceOfVec2Array, findPath } from './jmath/Pathfinding';
import { keyDown, useMousePosition } from './graphics/ui/eventListeners';
import Jprompt from './graphics/Jprompt';
import { collideWithLineSegments, reflectVelocityOnWall, ForceMove, isForceMoveProjectile, isForceMoveUnitOrPickup, isVecIntersectingVecWithCustomRadius, moveWithCollisions, handleWallCollision } from './jmath/moveWithCollision';
import { IHostApp, hostGiveClientGameState } from './network/networkUtil';
import { withinMeleeRange } from './entity/units/actions/meleeAction';
import { baseTiles, caveSizes, convertBaseTilesToFinalTiles, generateCave, getLimits, Limits as Limits, makeFinalTileImages, Map, Tile, toObstacle } from './MapOrganicCave';
import { Material } from './Conway';
import { oneDimentionIndexToVec2, vec2ToOneDimentionIndexPreventWrap } from './jmath/ArrayUtil';
import { raceTimeout } from './Promise';
import { cleanUpEmitters, containerParticles, containerParticlesUnderUnits, makeManaTrail, removeFloatingParticlesFor, updateParticles } from './graphics/Particles';
import { elInstructions } from './network/networkHandler';
import type PieClient from '@websocketpie/client';
import { isOutOfRange, sendPlayerThinkingThrottled } from './PlayerUtils';
import { DisplayObject, TilingSprite } from 'pixi.js';
import { HasSpace } from './entity/Type';
import { explain, EXPLAIN_PING, isTutorialFirstStepsComplete, isTutorialComplete, tutorialCompleteTask, tutorialChecklist, tutorialShowTask } from './graphics/Explain';
import { makeRisingParticles, makeScrollDissapearParticles, stopAndDestroyForeverEmitter } from './graphics/ParticleCollection';
import { ensureAllClientsHaveAssociatedPlayers, Overworld, recalculateGameDifficulty } from './Overworld';
import { Emitter } from 'jdoleary-fork-pixi-particle-emitter';
import { golem_unit_id } from './entity/units/golem';
import deathmason, { ORIGINAL_DEATHMASON_DEATH, bossmasonUnitId, summonUnitAtPickup } from './entity/units/deathmason';
import goru, { GORU_UNIT_ID, getSoulDebtHealthCost, tryCollectSouls } from './entity/units/goru';
import { hexToString } from './graphics/ui/colorUtil';
import { isModActive } from './registerMod';
import { summoningSicknessId } from './modifierSummoningSickness';
import { ARCHER_ID } from './entity/units/archer';
import { BLOOD_ARCHER_ID } from './entity/units/blood_archer';
import { BLOOD_GOLEM_ID } from './entity/units/bloodGolem';
import { MANA_VAMPIRE_ID } from './entity/units/manaVampire';
import { DARK_PRIEST_ID } from './entity/units/darkPriest';
import { LAST_LEVEL_INDEX } from './config';
import { unavailableUntilLevelIndexDifficultyModifier } from './Difficulty';
import { View } from './View';
import { skyBeam } from './VisualEffects';
import { urn_explosive_id } from './entity/units/urn_explosive';
import { urn_ice_id } from './entity/units/urn_ice';
import { urn_poison_id } from './entity/units/urn_poison';
import { elEndTurnBtn } from './HTMLElements';
import { corpseDecayId } from './modifierCorpseDecay';
import { PRIEST_ID } from './entity/units/priest';
import { getSyncActions } from './Syncronization';
import { EXPECTED_MILLIS_PER_GAMELOOP, sumForceMoves } from './effects/force_move';
import { targetConeId } from './cards/target_cone';
import { slashCardId } from './cards/slash';
import { pushId } from './cards/push';
import { test_endCheckPromises, test_startCheckPromises } from './promiseSpy';
import { targetCursedId } from './cards/target_curse';
import { runeGamblerId } from './modifierGambler';
import { runeTimemasonId } from './modifierTimemason';
import { manaBarrierId } from './modifierManaBarrier';
import { modifierBasePierceId } from './modifierBasePierce';
import { modifierBaseRadiusBoostId } from './modifierBaseRadiusBoost';
import { bountyHunterId } from './modifierBountyHunter';
import { placeRandomBounty } from './modifierBounty';
import { heavyImpactsId } from './modifierHeavyImpact';
import { OutlineFilter } from '@pixi/filter-outline';
import { LogLevel } from './RemoteLogging';
import PiePeer from './network/PiePeer';
import { investmentId } from './modifierInvestment';
import { isSinglePlayer } from './network/wsPieSetup';
import { alwaysBounty } from './globalEvents/alwaysBounty';
import { testUnderworldEventsId } from './globalEvents/testUnderworldEvents';

const loopCountLimit = 10000;
export enum turn_phase {
  // turn_phase is Stalled when no one can act
  // This may happen if all players disconnect
  Stalled,
  PlayerTurns,
  NPC_ALLY,
  NPC_ENEMY,
  // TODO - Consider a "Between Level" phase
  // that switches to PlayerTurns after a level is generated
  // To ensure turn start logic for PlayerTurns runs
}
const smearJitter = [
  { x: -3, y: -3 },
  { x: 3, y: -3 },
  { x: 0, y: 3 },
]
let gameOverModalTimeout: NodeJS.Timeout;
let forceMoveTimeoutId: NodeJS.Timeout;
const elUpgradePicker = document.getElementById('upgrade-picker') as (HTMLElement | undefined);
export const elUpgradePickerContent = document.getElementById('upgrade-picker-content') as (HTMLElement | undefined);
const rerollBtnContainer = document.getElementById('reroll-btn-container') as (HTMLElement | undefined);
const elSeed = document.getElementById('seed') as (HTMLElement | undefined);
const elUpgradePickerLabel = document.getElementById('upgrade-picker-label') as (HTMLElement | undefined);

export const showUpgradesClassName = 'showUpgrades';

let lastTime = 0;
let requestAnimationFrameGameLoopId: number;
const cleanupRegistry = globalThis.hasOwnProperty('FinalizationRegistry') ? new FinalizationRegistry((heldValue) => {
  console.log('GC: Cleaned up ', heldValue);
}) : undefined;
let localUnderworldCount = 0;
export default class Underworld {
  seed: string;
  gameMode?: GameMode;
  difficulty: number = 1;
  // A simple number to keep track of which underworld this is
  // Used for development to help ensure that all references to the underworld are current
  localUnderworldNumber: number;
  // A backreference to it's parent container
  overworld: Overworld;
  random: prng;
  pie: Pie;
  // The index of the level the players are on
  levelIndex: number = -1;
  isTutorialRun: boolean = false;
  wave: number = 1;
  // for serializing random: prng
  RNGState?: SeedrandomState;
  turn_phase: turn_phase = turn_phase.Stalled;
  // The order in which units will take their turn
  subTypesTurnOrder: UnitSubType[][] = [[UnitSubType.GORU_BOSS], [UnitSubType.RANGED_LOS, UnitSubType.RANGED_RADIUS], [UnitSubType.SUPPORT_CLASS], [UnitSubType.MELEE], [UnitSubType.SPECIAL_LOS], [UnitSubType.DOODAD]];
  // All subtypes currently taking their turn
  subTypesCurrentTurn?: UnitSubType[];
  // An id incrementor to make sure no 2 units share the same id
  lastUnitId: number = -1;
  lastPickupId: number = -1;
  // A count of which turn it is, this is useful for
  // governing AI actions that occur every few turns
  // instead of every turn.  A "turn" is a full cycle,
  // meaning, players take their turn, npcs take their
  // turn, then it resets to player turn, that is a full "turn"
  turn_number: number = 0;
  hasSpawnedBoss: boolean = false;
  limits: Limits = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  players: Player.IPlayer[] = [];
  units: Unit.IUnit[] = [];
  unitsPrediction: Unit.IUnit[] = [];
  pickups: Pickup.IPickup[] = [];
  pickupsPrediction: Pickup.IPickup[] = [];
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
  events: string[] = [alwaysBounty];
  // Not to be synced between clients but should belong to the underworld as they are unique
  // to each game lobby:
  // A list of units and pickups and an endPosition that they are moved to via a "force",
  // like a push or pull or explosion.
  // Important note: This array MUST NOT be pushed to directly, use underworld.addForceMove
  // instead
  forceMove: ForceMove[] = [];
  forceMovePrediction: ForceMove[] = [];
  forceMovePromise: Promise<void> | undefined;
  // Used to smoothly simulate force moves on a fixed timestep
  timeSinceLastSimulationStep: number = 0;
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
    target: Vec2,
    keepOnDeath?: boolean
  }[] = [];
  companions: {
    image: Image.IImageAnimated,
    target: Vec2,
  }[] = [];
  activeMods: string[] = [];
  generatingLevel: boolean = false;
  simulatingMovePredictions: boolean = false;
  // This counter is a kill switch to ensure that the game doesn't get into a state
  // where it's ally npcs fighting enemy npcs and neither is able to progress
  // (for any reason, maybe everyone got slowed to the point where everyone's max
  // stamina is 0) which would result in the server binding up in infinite loops of 
  // AI turns.
  allyNPCAttemptWinKillSwitch: number = 0;
  aquirePickupQueue: { pickupId: number, unitId: number, timeout: number, flaggedForRemoval: boolean }[] = [];
  // for speed running
  startTime: number | undefined;
  winTime: number | undefined;
  headlessTimeouts: { time: number, callback: () => void }[] = [];
  // Use the function underworld.battleLog('event string') to log
  // significant happenings.  The battleLog is used for players to view
  // what has happened
  _battleLog: string[] = [];
  serverStabilityMaxUnits: number | undefined;
  serverStabilityMaxPickups: number | undefined;

  constructor(overworld: Overworld, pie: Pie, seed: string, RNGState: SeedrandomState | boolean = true) {
    // Clean up previous underworld:
    overworld.underworld?.cleanup();
    console.log('Setup: Creating new underworld');
    this.battleLog('New Game');
    this.pie = pie;
    this.overworld = overworld;
    this.overworld.underworld = this;
    this.localUnderworldNumber = ++localUnderworldCount;
    this.startTime = Date.now();
    // Clear inventory html from previous game
    CardUI.resetInventoryContent();
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

    globalThis.spellCasting = false;
    this.setContainerUnitsFilter();

    // Create the host player
    if (pie instanceof PiePeer) {
      ensureAllClientsHaveAssociatedPlayers(overworld, [pie.clientId], [storage.get(storage.STORAGE_ID_PLAYER_NAME) || ''])
    }
    this.serverStabilityMaxPickups = globalThis.serverStabilityMaxPickups;
    this.serverStabilityMaxUnits = globalThis.serverStabilityMaxUnits;
    if (this.serverStabilityMaxPickups || this.serverStabilityMaxUnits) {
      console.log('Server Stability: ', this.serverStabilityMaxUnits, this.serverStabilityMaxPickups);
    }
  }
  addEvent(eventId: string) {
    if (!this.events.includes(eventId)) {
      this.events.push(eventId);
      // TODO
      // this.events.sort(Cards.eventsSorter(Cards.allModifiers));
    }
  }
  getAllUnits(prediction: boolean): Unit.IUnit[] {
    return prediction ? this.unitsPrediction : this.units;
  }
  // Returns all potentially targetable entities
  // See cards/index.ts's getCurrentTargets() for the function that returns 
  // the current targets of a spell.
  getPotentialTargets(prediction: boolean): HasSpace[] {
    if (prediction) {
      return [...this.unitsPrediction.filter(u => !u.flaggedForRemoval), ...this.pickupsPrediction.filter(p => !p.flaggedForRemoval)]
    } else {
      return [...this.units.filter(u => !u.flaggedForRemoval), ...this.pickups.filter(p => !p.flaggedForRemoval)];
    }
  }
  calculateKillsNeededForLevel(level: number): number {
    // Check if should drop cards
    let numberOfEnemiesKilledNeededForNextDrop = 0;
    const startNumberOfEnemiesNeededToDrop = 1;
    for (let i = startNumberOfEnemiesNeededToDrop; i < level + startNumberOfEnemiesNeededToDrop; i++) {
      numberOfEnemiesKilledNeededForNextDrop += i;
    }
    return numberOfEnemiesKilledNeededForNextDrop;

  }
  getNumberOfEnemyKillsNeededForNextLevelUp(): number {
    return this.calculateKillsNeededForLevel(this.cardDropsDropped + 1);
  }
  reportEnemyKilled(unit: Unit.IUnit) {
    if (unit.unitSubType === UnitSubType.DOODAD) {
      // Dodads do not provide EXP
      return;
    }
    this.enemiesKilled++;
    if (document.body?.classList.contains('HUD-hidden')) {
      console.log('HUD-hidden: Skipping dropping scroll pickup')
      return;
    }
    const numberOfEnemiesKilledNeededForNextDrop = this.getNumberOfEnemyKillsNeededForNextLevelUp();
    if (numberOfEnemiesKilledNeededForNextDrop <= this.enemiesKilled) {
      // Stop dropping cards if players have enough scrolls have been dropped to cover all cards that can be picked
      if (Object.values(Cards.allCards).filter(c => c.probability > 0).length > this.cardDropsDropped) {
        console.log('Give players new card');
        this.cardDropsDropped++;
        // Give EVERY player an upgrade when any one player picks up a scroll
        this.players.forEach(p => Pickup.givePlayerUpgrade(p, this));
      } else {
        console.log('No more cards to drop');
      }
    }
  }
  syncPlayerPredictionUnitOnly() {
    if (this.unitsPrediction && exists(globalThis.player)) {
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
  }
  syncronizeRNG(RNGState: SeedrandomState | boolean) {
    // For now, since there's no way for users to control the seed
    // don't display the seed on the homescreen
    // if (elSeed) {
    //   elSeed.innerText = `Seed: ${this.seed}`;
    // }
    console.debug('RNG create with seed:', this.seed, ', state: ', RNGState);
    // state of "true" initializes the RNG with the ability to save it's state,
    // state of a state object, rehydrates the RNG to a particular state
    this.random = seedrandom(this.seed, { state: RNGState })
    return this.random;
  }
  // Simulate the forceMove until it's complete
  fullySimulateForceMovePredictions() {
    if (this.simulatingMovePredictions) {
      console.debug('Already simulating move predictions');
      return;
    }
    this.simulatingMovePredictions = true;
    const prediction = true;
    const PREVENT_INFINITE_WITH_WARN_LOOP_THRESHOLD = 1000;
    let loopCount = 0;
    if (globalThis.predictionGraphicsWhite) {
      globalThis.predictionGraphicsWhite.beginFill(colors.forceMoveColor);
    }
    while (this.forceMovePrediction.length > 0 && loopCount < PREVENT_INFINITE_WITH_WARN_LOOP_THRESHOLD) {
      loopCount++;
      for (let i = this.forceMovePrediction.length - 1; i >= 0; i--) {
        const forceMoveInst = this.forceMovePrediction[i];
        if (forceMoveInst) {
          const startPos = Vec.clone(forceMoveInst.pushedObject);
          const done = this.runForceMove(forceMoveInst, EXPECTED_MILLIS_PER_GAMELOOP, prediction);
          // Draw prediction lines
          if (globalThis.predictionGraphicsWhite && !globalThis.isHUDHidden) {
            globalThis.predictionGraphicsWhite.lineStyle(2, colors.forceMoveColor, 1.0);
            globalThis.predictionGraphicsWhite.moveTo(startPos.x, startPos.y);
            globalThis.predictionGraphicsWhite.lineTo(forceMoveInst.pushedObject.x, forceMoveInst.pushedObject.y);
            // Draw circle at the end so the line path isn't a trail of rectangles with sharp edges
          }
          if (done) {
            // Draw a circle at the end position
            if (globalThis.predictionGraphicsWhite && !globalThis.isHUDHidden) {
              globalThis.predictionGraphicsWhite.drawCircle(forceMoveInst.pushedObject.x, forceMoveInst.pushedObject.y, 2);
            }
            if (isForceMoveUnitOrPickup(forceMoveInst)) {
              forceMoveInst.resolve();
            }
            this.forceMovePrediction.splice(i, 1);
          }
        }
      }
    }
    if (globalThis.predictionGraphicsWhite) {
      globalThis.predictionGraphicsWhite.endFill();
    }
    if (loopCount >= PREVENT_INFINITE_WITH_WARN_LOOP_THRESHOLD) {
      console.error('forceMove simulation hit PREVENT_INFINITE threshold');
    }
    // Empty forceMovePredictions to prepare for next simulation
    this.forceMovePrediction = [];
    this.simulatingMovePredictions = false;
  }
  // Returns true when forceMove is complete
  runForceMove(forceMoveInst: ForceMove, deltaTime: number, prediction: boolean): boolean {
    const { pushedObject, velocity, timedOut, sourceUnit } = forceMoveInst;
    if (timedOut) {
      return true;
    }
    if (isNaN(pushedObject.x) || isNaN(pushedObject.y)) {
      // Object has been cleaned up or has invalid coordinates so pushing cannot continue
      // and is "complete"
      return true;
    }
    // Represents the positional offset for this simulation loop
    // AKA the Vec2 distance to travel
    const deltaPosition = Vec.multiply(deltaTime, velocity)
    if (Vec.magnitude(deltaPosition) < 0.1) {
      // It's close enough, return true to signify complete 
      return true;
    }
    const aliveUnits = ((prediction && this.unitsPrediction) ? this.unitsPrediction : this.units).filter(u => u.alive);
    if (isForceMoveUnitOrPickup(forceMoveInst)) {
      const { velocity_falloff } = forceMoveInst;
      const collision = handleWallCollision(forceMoveInst, this, deltaTime);

      if (collision.wall) {
        // The unit collided with a wall, now we check if it was a heavy impact
        // Heavy impacts occur when a unit hits a wall at a high velocity
        // Heavy impacts deal impact damage and can cause other effects
        const estimatedCollisionVelocity = Vec.multiply(Math.pow(velocity_falloff, collision.msUntilCollision), velocity);
        let magnitudeOfImpact = Vec.magnitude(estimatedCollisionVelocity);

        // Runes increase the magnitude of the impact:
        let impactMultiplier = 1;
        this.players.forEach(p => {
          const heavyImpactModifier = p.unit.modifiers[heavyImpactsId];
          if (heavyImpactModifier) {
            impactMultiplier += 0.01 * heavyImpactModifier.quantity;
          }
        });
        magnitudeOfImpact *= impactMultiplier;

        // Heavy Impact if magnitude > 2
        if (magnitudeOfImpact > 2) {
          // Calculate impact damage using magnitude
          const impactDamage = Math.floor((magnitudeOfImpact - 2) * 10);

          if (Unit.isUnit(pushedObject)) {
            Unit.takeDamage({ unit: pushedObject, amount: impactDamage, fromVec2: Vec.add(pushedObject, { x: velocity.x, y: velocity.y }), sourceUnit }, this, prediction);
            if (!prediction) {
              floatingText({ coords: pushedObject, text: `${impactDamage} Impact damage!` });
            }
          }

          // The unit stops against the wall
          velocity.x = 0;
          velocity.y = 0;
        } else {
          // Non-Heavy-Impact collision behavior is currently handled by collideWithLineSegments();
          // Which pushes units away from the walls when they get close.
          // Ideally, instead of moving the unit too far and making a correction
          // We should premptively calculate where the unit needs to be
          // to prevent units going through walls and other weird behavior
          // TODO - put collideWithLineSegments() here instead of past the if/else

          // We can also decide what happens on non-impact collisions here:
          // Does the unit bounce of the wall, slide along it, stop entirely, or something else?
          // Examples below: May require slight modifications to work 100% as intended

          // Makes the unit bounce off of the wall
          // const newVelocity = reflectVelocityOnWall(velocity, collision.wall);
          // velocity.x = newVelocity.x;
          // velocity.y = newVelocity.y;

          // Sets the unit's new velocity to the projection along the wall
          // Units will keep moving parallel to the wall after passing it
          // const newVelocity = projectVelocityAlongWall(velocity, collision.wall);
          // velocity.x = newVelocity.x;
          // velocity.y = newVelocity.y;

          // Stops the unit
          //velocity.x = 0;
          //velocity.y = 0;

          // If testing out the above examples, make sure to uncomment this chunk of code as well
          // Use remaining delta time after collision to continue movement based on new velocity
          //const newPosition = Vec.add(pushedObject, Vec.multiply(deltaTime - collision.msUntilCollision, velocity));
          //pushedObject.x = newPosition.x;
          //pushedObject.y = newPosition.y;
        }
      } else {
        // If forceMove wasn't going to collide with a wall,
        // move it according to it's velocity
        const newPosition = Vec.add(pushedObject, deltaPosition);
        pushedObject.x = newPosition.x;
        pushedObject.y = newPosition.y;
      }
      collideWithLineSegments(pushedObject, this.walls, this);
      forceMoveInst.velocity = Vec.multiply(Math.pow(velocity_falloff, deltaTime), velocity);
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
      Obstacle.tryFallInOutOfLiquid(forceMoveInst.pushedObject, this, prediction, forceMoveInst.sourceUnit);
    } else if (isForceMoveProjectile(forceMoveInst)) {
      // ignoreCollisionLiftime is only set if we ignore collisions
      // so for everything else, run collision logic
      if (isNullOrUndef(forceMoveInst.ignoreCollisionLifetime)) {
        const collision = handleWallCollision(forceMoveInst, this, deltaTime);
        if (collision.wall) {
          if (Events.onProjectileCollisionSource) {
            const collideFn = Events.onProjectileCollisionSource[forceMoveInst.collideFnKey];
            if (collideFn) {
              collideFn({ unit: undefined, underworld: this, prediction, projectile: forceMoveInst });
            } else {
              console.error('No projectile collide fn for', forceMoveInst.collideFnKey);
            }
          }

          if (forceMoveInst.bouncesRemaining <= 0) {
            // If cannot bounce and collides with a wall, remove
            return true;
          } else {
            // Bounce the projectile
            forceMoveInst.bouncesRemaining--;
            this.resetForceMoveTimeout();

            // Reflect velocity
            const newVelocity = reflectVelocityOnWall(velocity, collision.wall);
            velocity.x = newVelocity.x;
            velocity.y = newVelocity.y;
            if (pushedObject.image) {
              // Velocity has changed, so sprite rotation changes too
              pushedObject.image.sprite.rotation = Math.atan2(velocity.y, velocity.x);
            }

            // Move for remaining delta time (after wall collision)
            const newPosition = Vec.add(pushedObject, Vec.multiply(deltaTime - collision.msUntilCollision, velocity));
            pushedObject.x = newPosition.x;
            pushedObject.y = newPosition.y;
            if (!prediction) {
              playSFXKey('ricochet');
            }
          }
        } else {
          // If projectile wasn't going to collide with a wall,
          // move it according to it's velocity
          const newPosition = Vec.add(pushedObject, deltaPosition);
          pushedObject.x = newPosition.x;
          pushedObject.y = newPosition.y;
        }

        // TODO - For accuracy, we may have to predict these collisions before they happen (Needs testing)
        for (let unit of aliveUnits) {
          // Omit the unit that triggered the projectile:
          // Projectiles must not collide with the sourceUnit
          if (unit == forceMoveInst.sourceUnit) {
            continue;
          }
          if (isVecIntersectingVecWithCustomRadius(pushedObject, unit, config.COLLISION_MESH_RADIUS)) {
            if (forceMoveInst.collidingUnitIds.includes(unit.id)) {
              // If already colliding with this unit, skip to the next one
              continue;
            }

            if (Events.onProjectileCollisionSource) {
              const collideFn = Events.onProjectileCollisionSource[forceMoveInst.collideFnKey];
              if (collideFn) {
                collideFn({ unit: unit, underworld: this, prediction, projectile: forceMoveInst });
              } else {
                console.error('No projectile collide fn for', forceMoveInst.collideFnKey);
              }

              if (forceMoveInst.piercesRemaining <= 0) {
                if (forceMoveInst.bouncesRemaining <= 0) {
                  // If cannot pierce or bounce and collides with a unit, remove
                  return true;
                } else {
                  forceMoveInst.bouncesRemaining--;
                  this.resetForceMoveTimeout();
                  forceMoveInst.collidingUnitIds.push(unit.id);
                  // Units aren't walls, so we use a different method for reflecting velocity
                  const directionToProjectile = Vec.normalized({ x: unit.x - pushedObject.x, y: unit.y - pushedObject.y });

                  // Reflect velocity
                  // Note that because a unit is not a wall segment, we use a different function
                  const newVelocity = Vec.reflectOnNormal(velocity, directionToProjectile)
                  velocity.x = newVelocity.x;
                  velocity.y = newVelocity.y;
                  if (pushedObject.image) {
                    // Velocity has changed, so sprite rotation changes too
                    pushedObject.image.sprite.rotation = Math.atan2(velocity.y, velocity.x);
                  }

                  if (!prediction) {
                    playSFXKey('ricochet');
                  }
                }
              } else {
                forceMoveInst.piercesRemaining--;
                forceMoveInst.collidingUnitIds.push(unit.id);
              }
            }
          } else {
            if (forceMoveInst.collidingUnitIds.includes(unit.id)) {
              // Left the collision zone for a unit, may want to collide with it again later (pierce/bounce)
              forceMoveInst.collidingUnitIds = forceMoveInst.collidingUnitIds.filter(id => id != unit.id);
            }
          }
        }
      } else {
        // This projectile is ignoring collisions. Common for VFX
        // Since we aren't destroying the projectile through collision logic
        // We give it a maximum lifetime, and destroy it at the end
        if (forceMoveInst.ignoreCollisionLifetime > 0) {
          forceMoveInst.ignoreCollisionLifetime -= deltaTime;
          // Move according to its velocity
          const newPosition = Vec.add(pushedObject, deltaPosition);
          pushedObject.x = newPosition.x;
          pushedObject.y = newPosition.y;
        } else {
          // Destroy projectile if lifetime is complete
          return true;
        }
      }

      // All projectiles should face the direction they are moving
      if (pushedObject.image) {
        pushedObject.image.sprite.x = pushedObject.x;
        pushedObject.image.sprite.y = pushedObject.y;
      }
    }
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
  // This is the ONLY way forceMove array can be added to because it creates a forceMovePromise
  // if it doesn't already exist so that other places in the codebase can await forceMoves.
  // Never push to this.forceMove anywhere but here.
  addForceMove(forceMoveInst: ForceMove, prediction: boolean) {
    // TODO: Further parity with promises?
    // Add to existing forceMove if it already exists 
    // to eliminate wobbly lines:
    const foundForceMove = (prediction ? this.forceMovePrediction : this.forceMove).find(fm => fm.pushedObject == forceMoveInst.pushedObject);
    if (prediction) {
      if (foundForceMove) {
        // Add the velocity of the new force move to the existing force move
        sumForceMoves(foundForceMove, forceMoveInst);
      } else {
        // Add new forceMove
        this.forceMovePrediction.push(forceMoveInst);
      }
    }
    else {
      if (foundForceMove) {
        // Add the velocity of the new force move to the existing force move
        sumForceMoves(foundForceMove, forceMoveInst);
      } else {
        this.forceMove.push(forceMoveInst);
      }
      if (!this.forceMovePromise) {
        // If there is no forceMovePromise, create a new one,
        // it will resolve when the current forceMove instances
        // have finished; so anything that needs to await the
        // forceMove instances can raceTimeout this.forceMovePromise
        this.forceMovePromise = new Promise(res => {
          forceMoveResolver = res;
        });
      }
      // Reset the timeout every time a new forceMove is added
      this.resetForceMoveTimeout();
    }
  }
  // Some force moves may take longer than the timeout
  // for example if an arrow bounces or if a new force move
  // is added (say by an explosion), so the forceMove timeout
  // has to be reset to allow for more time to pass
  resetForceMoveTimeout() {
    clearTimeout(forceMoveTimeoutId);
    forceMoveTimeoutId = setTimeout(() => {
      if (forceMoveResolver) {
        forceMoveResolver();
        console.error('Error: forceMovePromise timed out');
      }
    }, config.FORCE_MOVE_PROMISE_TIMEOUT_MILLIS);

  }
  // Returns true if there is more processing yet to be done on the next
  // gameloop
  gameLoopForceMove = (deltaTime: number) => {
    // No need to process if there are no instances to process
    if (!this.forceMove.length) {
      return false;
    }
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
        let done = this.runForceMove(forceMoveInst, deltaTime, false);
        const endPos = { x: forceMoveInst.pushedObject.x, y: forceMoveInst.pushedObject.y + unitImageYOffset };
        if (!globalThis.noGore && graphicsBloodSmear && Unit.isUnit(forceMoveInst.pushedObject) && exists(forceMoveInst.pushedObject.health) && forceMoveInst.pushedObject.health <= 0) {
          if (this.isCoordOnVoidTile(endPos)) {
            // Don't render blood for units out of bounds, this causes the "delete the floor bug"
            done = true;
          } else {
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
        }
        // Remove it from forceMove array once the distance has been covers
        // This works even if collisions prevent the unit from moving since
        // distance is modified even if the unit doesn't move each loop
        if (done) {
          if (isForceMoveUnitOrPickup(forceMoveInst)) {
            forceMoveInst.resolve();
          } else if (isForceMoveProjectile(forceMoveInst)) {
            Image.cleanup(forceMoveInst.pushedObject.image);
          }
          this.forceMove.splice(i, 1);
        }
      }
    }
    const finishedForceMoves = this.forceMove.length == 0;
    if (finishedForceMoves) {
      // Force moves have finished, resolve the promise and clear it
      // so that new forceMoves can have a new promise that other parts
      // of the code can await
      if (forceMoveResolver) {
        forceMoveResolver();
      } else {
        console.error('Unexpected: Finished forceMoves but forceMoveResolver is undefined');
      }
      // Clear the promise and resolver now that it has resolved
      forceMoveResolver = undefined;
      this.forceMovePromise = undefined;
    }
    return !finishedForceMoves;
  }

  // TODO - Examine this for state machine refactor
  // Issue: https://github.com/jdoleary/Spellmasons/issues/388

  // returns true if there is more processing yet to be done on the next game loop
  gameLoopUnit = (u: Unit.IUnit, aliveNPCs: Unit.IUnit[], deltaTime: number): boolean => {
    if (u) {
      while (u.path && u.path.points[0] && Vec.equal(Vec.round(u), Vec.round(u.path.points[0]))) {
        // Remove next points until the next point is NOT equal to the unit's current position
        // This prevent's "jittery" "slow" movement where it's moving less than {x:1.0, y:1.0}
        // because the unit's position may have a decimal while the path does not so it'll stop
        // moving when it reaches the target which may be less than 1.0 and 1.0 away.
        u.path.points.shift();
        if (u.path.points.length == 0) {
          u.resolveDoneMoving(true);
        }
      }

      const takeAction = Unit.canAct(u) && Unit.isUnitsTurnPhase(u, this)
        && (u.unitType == UnitType.PLAYER_CONTROLLED || this.subTypesCurrentTurn?.includes(u.unitSubType));

      if (u.path && u.path.points[0] && u.stamina > 0 && takeAction) {
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
          moveDist = math.distance(u, stepTowardsTarget);
          // Only move other NPCs out of the way, never move player units
          moveWithCollisions(u, stepTowardsTarget, [...aliveNPCs], this);
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
        // check for collisions with pickups in new location
        this.checkPickupCollisions(u, false);
        if (u.stamina > 0 && u.path && u.path.points.length !== 0) {
          // more processing yet to be done
          return true;
        } else {
          // Ensure that resolveDoneMoving is invoked when unit is out of stamina (and thus, done moving)
          // or when find point in the path has been reached.
          // This is necessary to end the moving units turn because elsewhere we are awaiting the fulfillment of that promise
          // to know they are done moving
          u.resolveDoneMoving(true);
          if (u.path) {
            // Update last position that changed via own movement
            u.path.lastOwnPosition = Vec.clone(u);
          }
          // done processing this unit for this unit's turn
          return false;

        }
      } else {
        // unit has nothing to do and thus is done processing
        return false;
      }
    } else {
      // Unit is dead, no processing to be done
      return false;
    }
  }
  awaitForceMoves = async (prediction: boolean = false) => {
    if (prediction) {
      this.fullySimulateForceMovePredictions();
    } else {
      // Ensure server isn't stuck waiting for forceMoves
      this.triggerGameLoopHeadless();
      if (this.forceMove.length == 0) {
        // No force moves to await
        return;
      } else if (this.forceMovePromise) {
        // Note: This promise shall NOT use raceTimeout.  See 
        // https://github.com/jdoleary/Spellmasons/issues/352 and 
        // search for `forceMoveTimeoutId` in this codebase for more
        // information
        await this.forceMovePromise;
        // Now that the promise has resolved, clear it so that it can await the next
        this.forceMovePromise = undefined;
      }
    }
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
        moreProcessingToBeDone = this._gameLoopHeadless(loopCount);
        if (loopCount > loopCountLimit) {
          // TODO: this number is arbitrary, test later levels and make sure this is high enough
          // so that it doesn't early exit
          console.error('Force return from headless gameloop to prevent infinite loop');
          return
        }
      }

      if (loopCount > 500) {
        console.log('Headless server executed gameloop in ', (performance.now() - headlessGameLoopPerfStart).toFixed(2), ' millis with', loopCount, ' loops.');
      }
    }
  }
  // Only to be invoked by triggerGameLoopHeadless
  // Returns true if there is more processing to be done
  // See GameLoops.md for more details
  _gameLoopHeadless = (loopCount: number): boolean => {
    const stillProcessingForceMoves = this.gameLoopForceMove(EXPECTED_MILLIS_PER_GAMELOOP);
    if (loopCount > loopCountLimit && stillProcessingForceMoves) {
      console.error('_gameLoopHeadless hit limit; stillProcessingForceMoves');
      // Extra debugging:
      if (this.forceMove[0]?.pushedObject.debugName) {
        console.error('headless: Stuck processing forceMove for unknown type:', this.forceMove[0]?.pushedObject.debugName);
      } else {
        const firstPushedObject = this.forceMove[0]?.pushedObject as any;
        if (Unit.isUnit(firstPushedObject)) {
          console.error('headless: Stuck processing forceMove for unit:', firstPushedObject.unitSourceId);
        } else if (Pickup.isPickup(firstPushedObject)) {
          console.error('headless: Stuck processing forceMove for pickup:', firstPushedObject.name);
        } else {
          console.error('headless: Stuck processing forceMove for unknown type:', JSON.stringify(firstPushedObject));
        }
      }
      // Since there is at least one forceMove that is now broken (unending)
      // clear them all out so that the next time _gameLoopHeadless is called
      // it wont hit limit again and keep emergency exiting the loop
      this.forceMove = [];
    }
    let stillProcessingUnits = 0;
    const aliveNPCs = this.units.filter(u => u.alive && u.unitType == UnitType.AI);
    for (let u of this.units) {
      const unitStillProcessing = this.gameLoopUnit(u, aliveNPCs, EXPECTED_MILLIS_PER_GAMELOOP);
      if (unitStillProcessing) {
        stillProcessingUnits++;
        if (loopCount > loopCountLimit) {
          console.error('_gameLoopHeadless hit limit; stillProcessingUnits', u.unitSourceId);
        }
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

    globalThis.projectileGraphics?.clear();
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

    // We should always run gameLoopForceMoves in a specific simulation step to ensure
    // there is no desync between headless/prediction/gameloop at different framerates.
    // We also want to create the illusion of smooth movement/simulation by tracking time passed
    // and only simulating X ms of force movement after X ms of real time has passed
    this.timeSinceLastSimulationStep += deltaTime;
    if (this.timeSinceLastSimulationStep >= EXPECTED_MILLIS_PER_GAMELOOP) {
      // Simulate one step of all forces in this.forceMove
      this.gameLoopForceMove(EXPECTED_MILLIS_PER_GAMELOOP);
      this.timeSinceLastSimulationStep -= EXPECTED_MILLIS_PER_GAMELOOP;
    }

    const aliveNPCs = this.units.filter(u => u.alive && u.unitType == UnitType.AI);
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u) {
        this.gameLoopUnit(u, aliveNPCs, deltaTime);
        // Sync Image even for non moving units since they may be moved by forces other than themselves
        // This keeps the unit.image in the same place as unit.x, unit.y
        Unit.syncImage(u)
        drawHealthBarAboveHead(i, this, zoom);

        // Sometimes runPredictions doesn't trigger if another is already processing
        // (for example, in multiplayer when another player is casting), so this extra
        // call to syncStaminaBar ensures that the player's stamina bar will update while the
        // player is moving even if another player is casting
        if (globalThis.player && globalThis.player.unit == u) {
          Unit.syncStaminaBar();
        }
        // Animate shield modifier sprites
        if ((u.modifiers[shield.shieldId] || u.modifiers[fortify.id] || u.modifiers[immune.id] || u.modifiers[manaBarrierId]) && u.image) {
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
    // Run onTooltip events for selected unit
    if (globalThis.selectedUnit) {
      for (let eventName of globalThis.selectedUnit.events) {
        const fn = Events.onTooltipSource[eventName];
        if (fn) {
          fn(globalThis.selectedUnit, this);
        }
      }
    }
    // Remove destroyed emitters from particle followers
    this.particleFollowers = this.particleFollowers.filter(pf => pf.emitter && !pf.emitter.destroyed);
    // Now that units have moved update any particle emitters that are following them:
    for (let { displayObject, emitter, target, keepOnDeath } of this.particleFollowers) {
      if (isNullOrUndef(target)) {
        console.warn('Emitter destroyed because target is undefined');
        stopAndDestroyForeverEmitter(emitter);
      } else if (Unit.isUnit(target) && ((!target.alive && !keepOnDeath) || target.flaggedForRemoval)) {
        stopAndDestroyForeverEmitter(emitter);
      } else if (Pickup.isPickup(target) && (target.flaggedForRemoval)) {
        stopAndDestroyForeverEmitter(emitter);
      } else if (!(Unit.isUnit(target) && target.unitType == UnitType.PLAYER_CONTROLLED) && (isNaN(target.x) || isNaN(target.y))) {
        // If not a player controlled unit with NaN position, destroy
        // (Player controlled units have a NaN position temporarily before they choose a spawn and we want to keep the emitter in this case)
        stopAndDestroyForeverEmitter(emitter);
      } else if (emitter && !emitter.destroyed) {

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
    for (let companion of this.companions) {
      if (isNaN(companion.image.sprite.x) || isNaN(companion.image.sprite.y)) {
        companion.image.sprite.x = 0;
        companion.image.sprite.y = 0;
      }
      const multX = Unit.isUnit(companion.target) ? companion.target.image?.sprite.scale.x || 1 : 1
      const offsetTarget = Vec.add(companion.target, { x: multX * 30, y: -30 });
      const distance = math.distance(companion.image.sprite, offsetTarget)
      const speed = math.lerp(0.5, 6, distance / 600);
      const next = math.getCoordsAtDistanceTowardsTarget(companion.image.sprite, offsetTarget, speed);
      // Orient:
      if (offsetTarget.x >= companion.image.sprite.x) {
        companion.image.sprite.scale.x = -Math.abs(companion.image.sprite.scale.x);
      } else {
        companion.image.sprite.scale.x = Math.abs(companion.image.sprite.scale.x);
      }
      companion.image.sprite.x = next.x;
      companion.image.sprite.y = next.y;
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
      const ay = exists(a.ySortPositionOverride) ? a.ySortPositionOverride : a.y;
      // Protect against a DisplayObject with NaN from disrupting the entire sort
      const A = (ay + aExtraHeight + config.UNIT_SIZE_RADIUS * a.scale.y);
      if (isNaN(A)) {
        return -1;
      }
      // @ts-ignore: ySortPositionOverride is a custom property that I've added that was made
      // specifically to be used in this context - sorting containerUnits - so that
      // a display object may have a sort position that is different than it's actual
      // y position
      const by = exists(b.ySortPositionOverride) ? b.ySortPositionOverride : b.y;
      // Protect against a DisplayObject with NaN from disrupting the entire sort
      const B = (by + bExtraHeight + config.UNIT_SIZE_RADIUS * b.scale.y);
      if (isNaN(B)) {
        return 1;
      }
      return A - B
    });

    // Special: Handle timemason:
    const timemasons = this.players.filter(p => p.unit.modifiers[runeTimemasonId]);
    if (this.turn_phase == turn_phase.PlayerTurns && timemasons.length && globalThis.view == View.Game) {
      timemasons.forEach(timemason => {
        const modifier = timemason.unit.modifiers[runeTimemasonId];
        if (modifier && timemason.isSpawned && timemason.unit.alive && timemason.unit.mana > 0) {
          if (numberOfHotseatPlayers > 1 && timemason !== globalThis.player) {
            // Do not run timemason timer on hotseat multiplayer unless it is the timemasons turn
            return;
          }
          let drainPerSecond = timemason.unit.manaMax * config.TIMEMASON_PERCENT_DRAIN / 100;
          // Drain doubles per quantity of rune
          drainPerSecond *= Math.pow(2, modifier.quantity - 1);

          //@ts-ignore Special logic for timemason, does not need to be persisted
          if (!timemason.manaToDrain) {
            //@ts-ignore Special logic for timemason, does not need to be persisted
            timemason.manaToDrain = deltaTime / 1000 * drainPerSecond;
          } else {
            //@ts-ignore Special logic for timemason, does not need to be persisted
            timemason.manaToDrain += deltaTime / 1000 * drainPerSecond;

            //@ts-ignore Special logic for timemason, does not need to be persisted
            if (timemason.manaToDrain >= 1) {
              //@ts-ignore Special logic for timemason, does not need to be persisted
              timemason.unit.mana -= Math.floor(timemason.manaToDrain);
              //@ts-ignore Special logic for timemason, does not need to be persisted
              timemason.manaToDrain -= Math.floor(timemason.manaToDrain);
              timemason.unit.mana = Math.max(0, timemason.unit.mana);

              this.syncPlayerPredictionUnitOnly();
              Unit.syncPlayerHealthManaUI(this);
            }
          }
        }
      })
    }

    updateCameraPosition(this, deltaTime);
    this.drawEnemyAttentionMarkers();
    this.drawResMarkers();
    this.drawPlayerThoughts();
    updatePlanningView(this);
    useMousePosition(this);
    // Particles
    updateParticles(deltaTime, this.bloods, this.random, this);

    // Trigger any timed out pickups in queue
    this.aquirePickupQueue = this.aquirePickupQueue.filter(p => !p.flaggedForRemoval);
    const now = Date.now();
    for (let queuedPickup of this.aquirePickupQueue) {
      if (queuedPickup.timeout <= now) {
        const pickup = this.pickups.find(p => p.id == queuedPickup.pickupId);
        const unit = this.units.find(u => u.id == queuedPickup.unitId);
        if (pickup) {
          if (unit) {
            const player = this.players.find(p => p.unit == unit);
            Pickup.triggerPickup(pickup, unit, player, this, false);
            queuedPickup.flaggedForRemoval = true;
            console.error('Queued pickup timed out and was force triggered');
          } else {
            console.error('Attempted to aquire queued pickup via timeout but unit is undefined');
            // Prevent error from triggering more than once
            queuedPickup.flaggedForRemoval = true;
          }
        } else {
          console.error('Attempted to aquire queued pickup via timeout but pickup is undefined');
          // Prevent error from triggering more than once
          queuedPickup.flaggedForRemoval = true;
        }
      }
    }
    predictAIActions(this, false);

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
      drawUnitMarker(resurrect.thumbnail, marker);
    }

  }
  // Draw attention markers which show if an NPC will
  // attack you next turn
  drawEnemyAttentionMarkers() {
    if (globalThis.headless) {
      return;
    }
    if (globalThis.isHUDHidden) {
      // Don't draw attention markers if the hud is hidden
      return;
    }
    // Only draw attention markers during player turn
    if (this.turn_phase !== turn_phase.PlayerTurns) {
      return;
    }
    // Note: this block must come after updating the camera position
    // We're iterating unitsPrediction instead of units because attentionMarkers are transient
    // and stored on the prediction units (which are accurate because they may be forceMoved or killed
    // or cloned after the predicted spell is cast and so THAT is the unit - the prediction unit - that
    // we want to show attentionMarkers for)
    for (let unit of this.unitsPrediction) {
      if (unit) {
        const marker = unit.attentionMarker;
        if (marker) {
          // Draw Attention Icon to show the enemy will hurt you next turn
          drawUnitMarker(marker.imagePath, marker.pos, marker.unitSpriteScaleY, marker.markerScale);
        }
      }
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
    for (let [thinkerId, thought] of Object.entries(this.playerThoughts)) {
      const { target, cardIds, ellipsis } = thought;
      const thinkingPlayer = this.players.find(p => p.playerId == thinkerId);
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
            let thumbnail = card.thumbnail;
            if (thumbnail.includes('spellmasons-mods')) {
              // Fix path to modded thumbnails that exist in the spritesheet
              thumbnail = thumbnail.split('/').slice(-1)[0] || '';
            }
            const sprite = addPixiSprite(thumbnail, containerPlayerThinking);
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
  //   if (exists(requestAnimationFrameGameLoopId)) {
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
    // Dereference underworld
    this.overworld.underworld = undefined;
    globalThis.resMarkers = [];
    globalThis.numberOfHotseatPlayers = 1;
    forceMoveResolver = undefined;

    // Remove game-over popup
    document.body.classList.toggle('game-over', false);

    // Remove all phase classes from body
    if (document && !globalThis.headless) {
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
    this.units.forEach(u => Unit.cleanup(u, false, true));
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
    this.liquidPolygons = mergePolygon2s(obstacles.filter(o => o.material == Material.LIQUID).map(o => o.bounds))
      // Move bounds up because center of units is not where they stand, and the bounds
      // should be realtive to a unit's feet
      .map(p => p.map(vec2 => ({ x: vec2.x, y: vec2.y - expandMagnitude / 2 })));
    const expandedLiquidPolygons = this.liquidPolygons//.map(p => p.map(Vec.clone))
      .map(p => expandPolygon(p, -expandMagnitude));
    this.liquidBounds = expandedLiquidPolygons
      .map(toLineSegments).flat();
    // TODO: Optimize:
    //.filter(filterRemoveNonGroundAdjacent);

    // Expand pathing walls by the size of the regular unit
    // pathing polygons determines the area that units can move within
    // this.pathingPolygons = mergePolygon2s([...obstacles.map(o => o.bounds)]

    this.pathingPolygons = mergePolygon2s([...getWallPolygons().map(p => expandPolygon(p, config.COLLISION_MESH_RADIUS * 0.4))
      .map(p => p.map(vec2 => ({ x: vec2.x, y: vec2.y - config.PATHING_POLYGON_OFFSET })))
      , ...expandedLiquidPolygons
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
  spawnPickup(index: number, coords: Vec2, prediction?: boolean): Pickup.IPickup | undefined {
    const pickup = Pickup.pickups[index];
    if (pickup) {
      return Pickup.create({ pos: coords, pickupSource: pickup, logSource: 'spawnPickup' }, this, !!prediction);
    } else {
      console.error('Could not find pickup with index', index);
      return undefined;
    }
  }
  spawnEnemy(id: string, coords: Vec2, isMiniboss: boolean): Unit.IUnit | undefined {
    const sourceUnit = allUnits[id];
    if (!sourceUnit) {
      console.error('Unit with id', id, 'does not exist.  Have you registered it in src/units/index.ts?');
      return undefined;
    }
    // levelIndex >= 2: Don't show enemy introductions while the early tutorial explain popups
    // are still coming up otherwise it gets crowded
    if (globalThis.enemyEncountered && !globalThis.enemyEncountered.includes(id) && this.levelIndex >= 2) {
      globalThis.enemyEncountered.push(id);
      storage.set(storage.ENEMY_ENCOUNTERED_STORAGE_KEY, JSON.stringify(globalThis.enemyEncountered));
      // Slightly delay showing enemy introductions so the button doesn't flicker on for a moment before CSS has a chance
      // to mark the cinematic camera as active
      setTimeout(() => {
        Jprompt({ imageSrc: Unit.getExplainPathForUnitId(id), text: `<h1>${i18n(id)}</h1>` + '\n' + i18n(sourceUnit.info.description), yesText: 'Okay' });
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
      { ...sourceUnit.unitProps, isMiniboss, originalLife: true },
      this
    );
    return unit;
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
      imageOnlyTiles: tiles.flatMap(x => isNullOrUndef(x) ? [] : [x]),
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

    // isTutorialRun will always be false on headless
    // If tutorial isn't complete, make this a tutorial run
    if (levelIndex == 0) {
      this.isTutorialRun = !isTutorialComplete();
      if (this.isTutorialRun && !storage.get(`BEAT_DIFFICULTY-tutorial`)) {
        console.log('Set gamemode to "tutorial" so that the first playthrough is easier');
        this.gameMode = 'tutorial';
        if (!isTutorialFirstStepsComplete(['portal'])) {
          // Set the level index to -1 to spawn the first tutorial level
          levelIndex = -1;

          // Give the player default tutorial cards
          if (globalThis.player) {
            for (let spell of [targetConeId, slashCardId, pushId]) {
              const upgrade = Upgrade.getUpgradeByTitle(spell);
              if (upgrade) {
                this.forceUpgrade(globalThis.player, upgrade, false);
              }
            }
          }
        }
      }
    }
    const isFirstTutorialLevel = (levelIndex == -1);

    let caveParams = caveSizes.extrasmall;
    if (isFirstTutorialLevel) {
      // First level override
      caveParams = caveSizes.tutorial;
    } else if (this.isTutorialRun) {
      // Tutorial Run - Smaller maps
      if (levelIndex >= 6) {
        caveParams = caveSizes.small;
      } else if (levelIndex >= config.LAST_LEVEL_INDEX) {
        caveParams = caveSizes.medium;
      }
    } else {
      // Not Tutorial Run - Standard maps
      if (levelIndex >= 3) {
        caveParams = caveSizes.small;
      } else if (levelIndex >= 6) {
        caveParams = caveSizes.medium;
      }
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
    levelData.imageOnlyTiles = tiles.flatMap(x => isNullOrUndef(x) ? [] : [x]);

    // Adjust difficulty via level index for tutorial runs so that it's not as hard
    // If the player has not completed the tutorial, this will make the game easier
    const levelIndexForEnemySpawn = this.isTutorialRun ? levelIndex - 1 : levelIndex;

    // Spawn units at the start of the level
    let unitIds = getEnemiesForAltitude(this, levelIndexForEnemySpawn);
    if (isFirstTutorialLevel) {
      unitIds = [];
    } else if (levelIndexForEnemySpawn < 0) {
      unitIds = [golem_unit_id];
    }
    const numberOfPickups = isFirstTutorialLevel ? 0 : 4 + levelIndex;
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
    // Teleport Trap!  Spawn at least 2 blue portals in each level that can be used to teleport
    if (levelIndex >= 5) {
      const bluePortalPickupIndex = Pickup.pickups.findIndex(p => p.name == Pickup.BLUE_PORTAL);
      if (bluePortalPickupIndex) {
        if (validSpawnCoords.length >= 2) {
          const numberOfBluePortals = levelIndex < 8 ? 2 : 2 + Math.floor((levelIndex - 8) / 2) * 2
          for (let bluePortal = 0; bluePortal < numberOfBluePortals; bluePortal++) {
            const validSpawnCoordsIndex = randInt(0, validSpawnCoords.length - 1, this.random);
            const coord = validSpawnCoords.splice(validSpawnCoordsIndex, 1)[0];
            if (coord) {
              levelData.pickups.push({ index: bluePortalPickupIndex, coord })
            }
          }
        }
      }
    }
    if (levelIndex > 2) {
      const doSpawnUrns = chooseOneOfSeeded([false, true], this.random);
      if (doSpawnUrns) {
        const numberOfUrns = randInt(2, 6, this.random);
        const typeOfUrn = chooseOneOfSeeded([urn_explosive_id, urn_ice_id, urn_poison_id], this.random);
        if (typeOfUrn) {
          for (let i = 0; i < numberOfUrns; i++) {
            unitIds.push(typeOfUrn);
          }
        }
      }
    }
    const numberOfMinibossesAllowed = levelIndex > LAST_LEVEL_INDEX
      ? (levelIndex - LAST_LEVEL_INDEX) * 2 + 2
      : Math.ceil(Math.max(0, (levelIndex - 4) / 4));
    let numberOfMinibossesMade = 0;
    for (let id of unitIds) {
      if (validSpawnCoords.length == 0) { break; }
      const validSpawnCoordsIndex = randInt(0, validSpawnCoords.length - 1, this.random);
      const coord = validSpawnCoords.splice(validSpawnCoordsIndex, 1)[0];
      const sourceUnit = allUnits[id];
      const { unitMinLevelIndexSubtractor } = unavailableUntilLevelIndexDifficultyModifier(this);
      // Disallow miniboss for a unit spawning on the first levelIndex that they are allowed to spawn
      const minibossAllowed = !sourceUnit?.spawnParams?.excludeMiniboss && ((sourceUnit?.spawnParams?.unavailableUntilLevelIndex || 0) - unitMinLevelIndexSubtractor) < levelIndex;
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
          `${biome}/all_ground_dirt_1.png`,
          `${biome}/all_ground_dirt_2.png`,
          `${biome}/all_ground_dirt_3.png`,
          `${biome}/all_ground_dirt_4.png`,
          `${biome}/all_ground_dirt_5.png`,
          `${biome}/all_ground_dirt_6.png`,
          `${biome}/all_ground_dirt_7.png`,
          `${biome}/all_ground_dirt_8.png`,
          `${biome}/all_ground_dirt_9.png`,
        ],
        layer2Tiles: [
          `${biome}/all_ground_meat_1.png`,
          `${biome}/all_ground_meat_2.png`,
          `${biome}/all_ground_meat_3.png`,
          `${biome}/all_ground_meat_4.png`,
          `${biome}/all_ground_meat_5.png`,
          `${biome}/all_ground_meat_6.png`,
          `${biome}/all_ground_meat_7.png`,
          `${biome}/all_ground_meat_8.png`,
          `${biome}/all_ground_meat_9.png`,

        ],
        layer3Tiles: [
          `${biome}/all_ground_moss_1.png`,
          `${biome}/all_ground_moss_2.png`,
          `${biome}/all_ground_moss_3.png`,
          `${biome}/all_ground_moss_4.png`,
          `${biome}/all_ground_moss_5.png`,
          `${biome}/all_ground_moss_6.png`,
          `${biome}/all_ground_moss_7.png`,
          `${biome}/all_ground_moss_8.png`,
          `${biome}/all_ground_moss_9.png`,
        ],
      },
      'lava': {
        baseTiles: [
          `${biome}/all_ground_open_1.png`,
          `${biome}/all_ground_open_2.png`,
          `${biome}/all_ground_open_3.png`,
          `${biome}/all_ground_open_4.png`,
          `${biome}/all_ground_open_5.png`,
          `${biome}/all_ground_open_6.png`,
          `${biome}/all_ground_open_7.png`,
          `${biome}/all_ground_open_8.png`,
          `${biome}/all_ground_open_9.png`,
        ],
        layer2Tiles: [
          `${biome}/all_ground_flower_1.png`,
          `${biome}/all_ground_flower_2.png`,
          `${biome}/all_ground_flower_3.png`,
          `${biome}/all_ground_flower_4.png`,
          `${biome}/all_ground_flower_5.png`,
          `${biome}/all_ground_flower_6.png`,
          `${biome}/all_ground_flower_7.png`,
          `${biome}/all_ground_flower_8.png`,
          `${biome}/all_ground_flower_9.png`,
        ],
        layer3Tiles: [],
      },
      'water': {
        baseTiles: [
          `${biome}/all_ground_soil_1.png`,
          `${biome}/all_ground_soil_2.png`,
          `${biome}/all_ground_soil_3.png`,
          `${biome}/all_ground_soil_4.png`,
          `${biome}/all_ground_soil_5.png`,
          `${biome}/all_ground_soil_6.png`,
          `${biome}/all_ground_soil_7.png`,
          `${biome}/all_ground_soil_8.png`,
          `${biome}/all_ground_soil_9.png`,
        ],
        layer2Tiles: [
          `${biome}/all_ground_brick_1.png`,
          `${biome}/all_ground_brick_2.png`,
          `${biome}/all_ground_brick_3.png`,
          `${biome}/all_ground_brick_4.png`,
          `${biome}/all_ground_brick_5.png`,
          `${biome}/all_ground_brick_6.png`,
          `${biome}/all_ground_brick_7.png`,
          `${biome}/all_ground_brick_8.png`,
          // brick_9 has too many bricks and is obviously
          // a "square tile" so I'm omitting it from possible tiles
          // `${biome}/all_ground_brick_9.png`,
        ],
        layer3Tiles: [
          `${biome}/all_ground_shroom_1.png`,
          `${biome}/all_ground_shroom_2.png`,
          `${biome}/all_ground_shroom_3.png`,
          `${biome}/all_ground_shroom_4.png`,
          `${biome}/all_ground_shroom_5.png`,
          `${biome}/all_ground_shroom_6.png`,
          `${biome}/all_ground_shroom_7.png`,
          `${biome}/all_ground_shroom_8.png`,
          `${biome}/all_ground_shroom_9.png`,
        ],
      },
      'ghost': {
        baseTiles: [],
        layer2Tiles: [],
        layer3Tiles: [],
      },
    }
    const baseTile = `${biome}/all_ground.png`;
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
    for (let tile of this.imageOnlyTiles.filter(t => !t.image.includes(`${this.lastLevelCreated?.biome}/all_ground`))) {
      if (tile.image) {
        if (tile.image == `${this.lastLevelCreated.biome}/all_liquid.png`) {
          // liquid tiles are rendered with a shader
          continue;
        }
        // Ground tiles that border liquid should go in containerBoard
        // Wall tiles should go in containerWalls, so that when units 
        // die behind a wall their corpse image
        // doesn't get painted on top of the wall 
        const isWall = tile.image.toLowerCase().includes('wall');
        const sprite = addPixiSprite(tile.image, isWall ? containerWalls : containerBoard);
        if (sprite) {
          sprite.x = tile.x - config.COLLISION_MESH_RADIUS;
          sprite.y = tile.y - config.COLLISION_MESH_RADIUS;
        }
        // Add wall shadows
        if (tile.image.endsWith('wallN.png')) {
          const sprite = addPixiSprite('wallShadow.png', containerBoard);
          if (sprite) {
            sprite.x = tile.x - config.COLLISION_MESH_RADIUS;
            // Place directly below the wall
            sprite.y = tile.y + config.COLLISION_MESH_RADIUS;
          }

        }
      }
    }
  }
  // unobstructedPoint is used when the spawn in question is spawning FROM something else, 
  // Ex. A summoner. This prevents summoners from creating units through walls
  isPointValidSpawn(spawnPoint: Vec2, prediction: boolean,
    extra?: { intersectionRadius?: number, allowLiquid?: boolean, unobstructedPoint?: Vec2, }): boolean {
    // Setup extra args:
    let intersectionRadius = extra?.intersectionRadius || config.COLLISION_MESH_RADIUS / 2;
    let allowLiquid = extra?.allowLiquid || false;
    let unobstructedPoint = extra?.unobstructedPoint || undefined;

    // SpawnPoint is invalid if...
    // ...Is out of bounds
    if (isOutOfBounds(spawnPoint, this)) {
      return false;
    }

    // ...Is in a wall
    if (this.isCoordOnWallTile(spawnPoint)) {
      return false;
    }
    // ...Is intersecting with a wall
    if ([...this.walls].some(wall => {
      const rightAngleIntersection = findWherePointIntersectLineSegmentAtRightAngle(spawnPoint, wall);
      return rightAngleIntersection && math.distance(rightAngleIntersection, spawnPoint) < intersectionRadius;
    })) {
      return false;
    }

    // Prevents spawning in liquid
    if (!allowLiquid) {
      // ...Is in liquid
      if (Obstacle.isCoordInLiquid(spawnPoint, this)) {
        return false;
      }
      // ...Is intersecting with liquid
      if ([...this.liquidBounds].some(wall => {
        const rightAngleIntersection = findWherePointIntersectLineSegmentAtRightAngle(spawnPoint, wall);
        return rightAngleIntersection && math.distance(rightAngleIntersection, spawnPoint) < intersectionRadius;
      })) {
        return false;
      }
    }

    // Prevents units from spawning directly on top of eachother
    // Ensure spawnPoint doesn't share coordinates with any other entity
    const entities = this.getPotentialTargets(prediction);
    // Filter out dead units, dead units shouldn't block spawning
    if (entities.filter(e => Unit.isUnit(e) ? e.alive : true).some(entity => Vec.equal(Vec.round(entity), Vec.round(spawnPoint)))) {
      return false;
    }

    // If an unobstructedPoint is passed, the SpawnPoint must be connected to it,
    // meaning the two points cannot be separated by a wall or liquid.
    // Ex. This can be used to prevent a summoner from summoning over a wall
    if (unobstructedPoint) {
      // Ensure spawnPoint isn't through any walls or liquidBounds
      if ([...this.walls, ...this.liquidBounds].some(wall => exists(unobstructedPoint) && lineSegmentIntersection({ p1: unobstructedPoint, p2: spawnPoint }, wall))) {
        return false;
      }
    }

    return true;
  }

  findValidSpawnInWorldBounds(prediction: boolean, seed: prng,
    extra?: { allowLiquid?: boolean, unobstructedPoint?: Vec2 }): Vec2 | undefined {
    // Setup extra args:
    let allowLiquid = extra?.allowLiquid || false;
    let unobstructedPoint = extra?.unobstructedPoint || undefined;

    let spawnPoint = undefined;
    for (let i = 0; i < 100; i++) {
      // Get random coords within the bounding box of the map
      spawnPoint = this.getRandomCoordsWithinBounds(this.limits, seed);

      // If spawnPoint is valid, break the loop
      if (this.isPointValidSpawn(spawnPoint, prediction, { allowLiquid, unobstructedPoint })) {
        break;
      }

      // spawnPoint was invalid, set to undefined and continue loop
      spawnPoint = undefined;
    }

    if (isNullOrUndef(spawnPoint)) {
      console.error('Could not find valid spawn point in world bounds');
    }

    return spawnPoint;
  }

  // WARNING: Do NOT use this function for batching or else it will choose the same location over
  // and over and everything will spawn on top of each other. Instead, see how Deathmason handles
  // finding multiple random spawns in a radius
  DEPRECIATED_findValidSpawnInRadius(center: Vec2, prediction: boolean,
    extra?: { allowLiquid?: boolean, unobstructedPoint?: Vec2, radiusOverride?: number }): Vec2 | undefined {
    let allowLiquid = extra?.allowLiquid || false;
    let unobstructedPoint = extra?.unobstructedPoint || undefined;

    let spawnPoint = undefined;
    const radius = extra && exists(extra.radiusOverride) ? extra.radiusOverride : config.COLLISION_MESH_RADIUS / 4;
    for (let s of math.honeycombGenerator(radius, center, 7)) {
      spawnPoint = s;

      // If spawnPoint is valid, break the loop
      if (this.isPointValidSpawn(spawnPoint, prediction, { allowLiquid, unobstructedPoint })) {
        break;
      }

      // spawnPoint was invalid, set to undefined and continue loop
      spawnPoint = undefined;
    }

    if (isNullOrUndef(spawnPoint)) {
      console.error('Could not find valid spawn point in radius');
      spawnPoint = center;
    }

    return spawnPoint;
  }
  // ringLimit limits how far away from the spawnSource it will check for valid spawn locations
  // same as below "findValidSpawns", but shortcircuits at the first valid spawn found and returns that
  // findValidSpawn({ spawnSource, ringLimit, radius = config.COLLISION_MESH_RADIUS / 4, prediction }: { spawnSource: Vec2, ringLimit: number, radius?: number, prediction: boolean }): Vec2 | undefined {
  //   if (isNaN(spawnSource.x) || isNaN(spawnSource.y)) {
  //     console.error('Attempted to findValidSpawn but spawnSource was NaN');
  //     return undefined;
  //   }
  //   const honeycombRings = ringLimit;
  //   for (let s of math.honeycombGenerator(radius, spawnSource, honeycombRings)) {
  //     const attemptSpawn = { ...s, radius: config.COLLISION_MESH_RADIUS };
  //     if (this.isPointValidSpawn(attemptSpawn, prediction, spawnSource)) {
  //       return attemptSpawn
  //     }
  //   }
  //   return undefined;
  // }
  // Same as above "findValidSpawn", but returns an array of valid spawns
  findValidSpawns({ spawnSource, ringLimit, radius = config.COLLISION_MESH_RADIUS / 4, prediction }: { spawnSource: Vec2, ringLimit: number, radius?: number, prediction: boolean }, extra?: { allowLiquid?: boolean, unobstructedPoint?: Vec2, radiusOverride?: number }): Vec2[] {
    const validSpawns: Vec2[] = [];
    const honeycombRings = ringLimit;
    // The radius passed into honeycombGenerator is how far between vec2s each honeycomb cell is
    for (let s of math.honeycombGenerator(radius, spawnSource, honeycombRings)) {
      // attemptSpawns radius must be the full config.COLLISION_MESH_RADIUS to ensure
      // that the spawning unit wont intersect something it shouldn't
      const attemptSpawn = { ...s, radius: config.COLLISION_MESH_RADIUS };
      if (this.isPointValidSpawn(attemptSpawn, prediction, extra)) {
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
    for (let companion of this.companions) {
      Image.cleanup(companion.image);
    }
    this.companions = [];

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
    containerWalls?.removeChildren();

    // Empty any remaining forceMoves
    this.forceMove = [];
    this.forceMovePrediction = [];

    // Clear all floor images
    containerBoard?.removeChildren();
    containerLiquid?.removeChildren();
    cleanUpLiquidFilter();
    cleanBlood(this);
    this.imageOnlyTiles = [];

    // Clear card usage counts, otherwise players will be
    // incentivied to bum around after a level to clear it themselves
    // which would be a bad player experience
    for (let p of this.players) {
      p.cardUsageCounts = {};
    }

    // Reset kill switch
    this.allyNPCAttemptWinKillSwitch = 0;
    // Reset wave count
    this.wave = 1;
    // Reset has spawned boss boolean
    this.hasSpawnedBoss = false;
  }
  postSetupLevel() {
    // runPrediction cleans up overlay from last level and sets up new health bars
    runPredictions(this);
    document.body?.classList.toggle('loading', false);
    // Set the first turn phase
    this.broadcastTurnPhase(turn_phase.PlayerTurns);
    cameraAutoFollow(false);
    setCameraToMapCenter(this);
    // If in a multiplayer game and it's a few levels in (giving time for players to get situated)
    // explaining pinging
    if (this.players.length > 1 && this.levelIndex > 2) {
      explain(EXPLAIN_PING);
    }
    this.quicksave('Level Start');
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
    recalculateGameDifficulty(this);
    globalThis.castThisTurn = false;
    // Update level tracker
    const elLevelTracker = document.getElementById('level-tracker');
    if (elLevelTracker) {
      elLevelTracker.innerHTML = i18n(['Level', this.getLevelText()]);
    }

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
        Pickup.create({ pos: p.coord, pickupSource: pickup, logSource: 'createLevelSyncronous' }, this, false);
      } else {
        console.error('Could not find pickup source with index', p.index);
      }
    }

    for (let e of enemies) {
      this.spawnEnemy(e.id, e.coord, e.isMiniboss);
    }

    // each bounty hunter places a bounty on a random unit in an opposing faction
    this.units.forEach(u => {
      if (u.modifiers[bountyHunterId] || levelIndex > 4) {
        placeRandomBounty(u, this, false);
      }
    });

    // Show text in center of screen for the new level
    queueCenteredFloatingText(
      ['Level', this.getLevelText()],
      'white'
    );

    console.log('Setup: resetPlayerForNextLevel; reset all players')
    for (let player of this.players) {
      Player.resetPlayerForNextLevel(player, this);
    }
    this.changeToFirstHotseatPlayer();

    // If a player's first game is in multiplayer, the tutorial will not immedaitely appear
    // and will have some buggy behavior, such as tasks not completing or showing in the correct order
    // this call is here to show tutorial tasks immediately and prevent these bugs
    isTutorialComplete();

    // Update toolbar (since some card's disabledLabel needs updating on every new label)
    CardUI.recalcPositionForCards(globalThis.player, this);
    // Now that level is done being generated, set generatingLevel to
    // false so that the next level generation may begin when it is time
    this.generatingLevel = false;

    // NOTE: Any data that needs to be synced from host to clients from this function MUST
    // be set BEFORE postSetupLevel is invoked because postSetupLevel will send a sync message
    // that will override the clientside data.
    this.postSetupLevel();
  }
  _getLevelText(levelIndex: number): string {
    if (levelIndex > LAST_LEVEL_INDEX) {
      return `${levelIndex - LAST_LEVEL_INDEX}+`;
    } else {
      return `${levelIndex + 1}`;
    }
  }
  getLevelText(): string {
    return this._getLevelText(this.levelIndex);
  }
  giveStartOfLevelStatPoints({ levelIndex }: LevelData) {
    // Give stat points, but not in the first level
    if (levelIndex > 0) {
      for (let player of this.players) {
        let points = config.STAT_POINTS_PER_LEVEL;
        // Less stat points per level for Goru and Deathmason
        if (player.wizardType == 'Deathmason' || player.wizardType == 'Goru') {
          points *= 0.6;
        }
        player.statPointsUnspent += points + (player.extraStatPointsPerRound || 0);
        Player.incrementPresentedRunesForPlayer(player, this);
        if (!tutorialChecklist.spendUpgradePoints.complete && levelIndex >= 3) {
          tutorialShowTask('spendUpgradePoints');
        }
        CardUI.tryShowStatPointsSpendable();
        console.log("Setup: Gave player: [" + player.clientId + "] " + points + " upgrade points for level index: " + levelIndex);
      }
    }
    // Grant investment SP after saving to prevent exploit where it would grant it and then save, and then regenerating the level
    // grants it again
    for (let player of this.players) {
      // Exception: Run logic for `Investment` rune:
      const modifier = player.unit.modifiers[investmentId];
      if (modifier) {
        if (player) {
          const dividend = Math.round(player.statPointsUnspent * (modifier.quantity / 100));
          player.statPointsUnspent += dividend;
          if (globalThis.player === player) {
            queueCenteredFloatingText(`${i18n(investmentId)}: ${dividend} SP`);
          }
        }
      }
    }

  }
  async createLevel(levelData: LevelData, gameMode?: GameMode) {
    if (exists(gameMode)) {
      this.gameMode = gameMode;
      // Must be called when difficulty (gameMode) changes to update summon spell stats
      Cards.refreshSummonCardDescriptions(this);
    }

    // When you get to the first plus level after beating the last level,
    // record the winTime for speedrunning
    if (levelData.levelIndex == config.LAST_LEVEL_INDEX + 1) {
      this.winTime = Date.now();
    }

    return new Promise<void>(resolve => {
      document.body?.classList.toggle('loading', true);
      // Add timeout so that loading can update dom
      setTimeout(() => {
        this.createLevelSyncronous(levelData);
        resolve();
      }, 10);
    });
  }
  generateLevelDataSyncronous(levelIndex: number, gameMode?: GameMode): LevelData {
    console.log('Setup: generateLevelDataSyncronous', levelIndex, gameMode);
    // Generate level
    let level;
    do {
      // Invoke generateRandomLevel again until it succeeds
      level = this.generateRandomLevelData(levelIndex);
      if (isNullOrUndef(level)) console.log("Undefined level. Regenerating");
    } while (isNullOrUndef(level));
    this.pie.sendData({
      type: MESSAGE_TYPES.CREATE_LEVEL,
      level,
      gameMode
    });
    return level;
  }
  async generateLevelData(levelIndex: number): Promise<void> {
    console.log('Setup: generateLevelData');
    if (this.generatingLevel) {
      console.warn('Setup: Shortcircuit generateLevelData; another level is already in the process of being generated');
      return;
    }
    this.generatingLevel = true;
    return new Promise<LevelData>(resolve => {
      document.body?.classList.toggle('loading', true);
      resolve(this.generateLevelDataSyncronous(levelIndex, this.gameMode));
    }).then(() => {
      // We set generatingLevel = false in createLevelSyncronous because we want to
      // create the level we already generated before generating more
      // The old way caused a bug that caused players to regenerate the level if many network messages were queued up
      return;
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
  isCoordOnVoidTile(coord: Vec2): boolean {
    const cellX = Math.round(coord.x / config.OBSTACLE_SIZE);
    const cellY = Math.round(coord.y / config.OBSTACLE_SIZE);
    const originalTile = this.lastLevelCreated?.imageOnlyTiles[vec2ToOneDimentionIndexPreventWrap({ x: cellX, y: cellY }, this.lastLevelCreated?.width)];
    return !originalTile || (isNullOrUndef(originalTile.image) || originalTile.image == '');
  }
  isCoordOnWallTile(coord: Vec2): boolean {
    const cellX = Math.round(coord.x / config.OBSTACLE_SIZE);
    const cellY = Math.round(coord.y / config.OBSTACLE_SIZE);
    const originalTile = this.lastLevelCreated?.imageOnlyTiles[vec2ToOneDimentionIndexPreventWrap({ x: cellX, y: cellY }, this.lastLevelCreated?.width)];
    return !!originalTile && (isNullOrUndef(originalTile.image) || originalTile.image == '' || originalTile.image.includes('wall'));
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
  getRemainingPlayerUnits(): Unit.IUnit[] {
    // Returns all remaining units currently controlled by a player; See isRemaining()
    return this.players.filter(p => p.clientConnected && p.isSpawned).map(p => p.unit).filter(u => Unit.isRemaining(u, this, false));
  }
  getRemainingPlayerAllies(): Unit.IUnit[] {
    // Returns all remaining units that share a faction with a player; See isRemaining()
    const playerFactions = Player.getFactionsOf(this.players);
    return this.units.filter(u => Unit.isRemaining(u, this, false) && playerFactions.includes(u.faction) && u.unitSubType != UnitSubType.DOODAD);
  }
  getRemainingPlayerEnemies(): Unit.IUnit[] {
    // Returns all remaining units that don't share a faction with a player; See isRemaining()
    const playerFactions = Player.getFactionsOf(this.players);
    return this.units.filter(u => Unit.isRemaining(u, this, false) && !playerFactions.includes(u.faction) && u.unitSubType != UnitSubType.DOODAD);
  }
  // Handles level completion, game over, turn phases, and hotseat
  async progressGameState() {
    console.log('[GAME] Progress Game State...');

    // Game State should not progress if no players are connected
    const connectedPlayers = this.players.filter(p => p.clientConnected);
    if (connectedPlayers.length == 0) {
      console.log('[GAME] No connected players: ', this.players);
      console.log('[GAME] Progress Game State Complete');
      return;
    }

    // Game State should not progress if a level is currently being generated/loaded
    if (this.generatingLevel) {
      console.log('[GAME] Level still generating: Return');
      console.log('[GAME] Progress Game State Complete');
      return false;
    }

    // Game State should not progress if a level is currently being generated/loaded
    if (this.levelIndex === -1 && !tutorialChecklist['spawn'].complete) {
      console.log('[GAME] Do not progress on first tutorial level until you spawn');
      return;
    }

    // We should try completing the level before ending the game
    // in case the player has beaten the level and died at the same time
    // Favoring the player in this scenario should only improve player experience
    if (this.isLevelComplete()) {
      // If the level is complete, try going to the next one
      // Will fail if players aren't ready (haven't ended turns / entered portals)
      if (this.tryGoToNextLevel()) {
        console.log('[GAME] Progress Game State Complete');
        return;
      }
      // Double check that portals are spawned, and spawn more if needed
      if (this.trySpawnPortals()) {
        console.log('[GAME] Progress Game State Complete');
        return;
      }
      // If we don't spawn portals or go to the next level, coontinue
      // progressGameState to check for a gameOver() and cycle turn phases
    }

    if (this.isGameOver()) {
      this.doGameOver();
      console.log('[GAME] Progress Game State Complete');
      return;
    }

    console.log('[GAME] Turn Phase\nCurrent == ', turn_phase[this.turn_phase]);

    // TODO - It might be cleaner if we found a way to move all TurnPhase logic here
    // https://github.com/jdoleary/Spellmasons/pull/398

    // Most turn phases are currently handled in InitializeTurnPhase()
    // the Player Turn depends on player input and thus happens asyncronously
    // So we make a special case to handle it here instead
    if (this.turn_phase == turn_phase.PlayerTurns) {
      // If all hotseat players are ready, try end player turn
      await this.handleNextHotseatPlayer();

      // Moves to next Turn Phase [NPC.ALLY] if possible
      if (await this.tryEndPlayerTurnPhase()) {
        this.broadcastTurnPhase(turn_phase.NPC_ALLY);
      }
    }

    console.log('[GAME] Turn Phase\nNew == ', turn_phase[this.turn_phase]);
    console.log('[GAME] Progress Game State Complete');
    return;
  }
  async trySpawnBoss(): Promise<boolean> {
    if (this.hasSpawnedBoss) {
      console.debug('[GAME] Can\'t Spawn Boss\nBoss is already spawned');
      return false;
    }

    // Don't spawn boss if the game is over
    if (this.isGameOver()) {
      return false;
    }

    if (config.IS_ANNIVERSARY_UPDATE_OUT && this.levelIndex == config.GORU_LEVEL_INDEX) {
      await introduceBoss(goru, this);
    }
    if (this.levelIndex == config.LAST_LEVEL_INDEX) {
      await introduceBoss(deathmason, this);
    }

    // For extra challenge, on loop levels spawn champion versions of the bosses
    if (this.levelIndex == config.LAST_LEVEL_INDEX + 1) {
      await introduceBoss(goru, this, true);
    }
    if (this.levelIndex == config.LAST_LEVEL_INDEX + 2) {
      await introduceBoss(deathmason, this, true);
    }
    // Spawn both goru and deathmason
    if (this.levelIndex >= config.LAST_LEVEL_INDEX + 3) {
      await introduceBoss(goru, this, true);
      // Reset hasSpawnedBoss so it will spawn both
      this.hasSpawnedBoss = false;
      await introduceBoss(deathmason, this, true);
    }
    return true;
  }
  trySpawnNextWave(): boolean {
    const wavesToSpawn = Math.max(1, (this.levelIndex - config.LAST_LEVEL_INDEX) + 1);
    if (this.wave >= wavesToSpawn) {
      console.debug('[GAME] Can\'t Spawn Next Wave\nNo more waves to spawn: ', this.wave, '/', wavesToSpawn);
      return false;
    }

    const remainingEnemies = this.getRemainingPlayerEnemies();
    if (remainingEnemies.length > 0) {
      console.debug('[GAME] Can\'t Spawn Next Wave\nRemaining enemies: ', remainingEnemies);
      return false;
    }

    // Don't spawn waves if the game is over
    if (this.isGameOver()) {
      return false;
    }

    this.wave++;
    queueCenteredFloatingText(`Wave ${this.wave} of ${wavesToSpawn}`);
    // Add corpse decay to all dead NPCs
    this.units.filter(u => u.unitType == UnitType.AI && !u.alive).forEach(u => {
      Unit.addModifier(u, corpseDecayId, this, false);
    });
    // Trick for finding valid spawnable tiles
    const validSpawnCoords = this.lastLevelCreated?.imageOnlyTiles.filter(x => x.image.endsWith('all_ground.png')) || [];

    // Copied from generateRandomLevelData
    const unitIds = getEnemiesForAltitude(this, this.levelIndex);
    const numberOfMinibossesAllowed = Math.ceil(Math.max(0, (this.levelIndex - 4) / 4));
    let numberOfMinibossesMade = 0;
    for (let id of unitIds) {
      if (validSpawnCoords.length == 0) { break; }
      const validSpawnCoordsIndex = randInt(0, validSpawnCoords.length - 1, this.random);
      const coord = validSpawnCoords.splice(validSpawnCoordsIndex, 1)[0];
      const sourceUnit = allUnits[id];
      const { unitMinLevelIndexSubtractor } = unavailableUntilLevelIndexDifficultyModifier(this);
      // Disallow miniboss for a unit spawning on the first levelIndex that they are allowed to spawn
      const minibossAllowed = !sourceUnit?.spawnParams?.excludeMiniboss && ((sourceUnit?.spawnParams?.unavailableUntilLevelIndex || 0) - unitMinLevelIndexSubtractor) < this.levelIndex;
      if (coord) {
        const isMiniboss = !minibossAllowed ? false : numberOfMinibossesAllowed > numberOfMinibossesMade;
        if (isMiniboss) {
          numberOfMinibossesMade++;
        }
        this.spawnEnemy(id, coord, isMiniboss)
      }
    }
    // end Copied from generateRandomLevelData
    console.log('[GAME] Spawned new wave of enemies');
    return true;
  }
  isLevelComplete(): boolean {
    // The level is complete if all enemies, waves, and bosses have been killed
    const remainingEnemies = this.getRemainingPlayerEnemies();
    if (remainingEnemies.length > 0) {
      console.log('[GAME] Level Incomplete...\nEnemies remain...');
      return false;
    }

    if ((this.levelIndex == config.LAST_LEVEL_INDEX || this.levelIndex == config.GORU_LEVEL_INDEX) && !this.hasSpawnedBoss) {
      console.log('[GAME] Level Incomplete...\nWaiting to spawn Boss...');
      return false;
    }

    const wavesToSpawn = Math.max(1, (this.levelIndex - config.LAST_LEVEL_INDEX) + 1);
    if (this.wave < wavesToSpawn) {
      console.log('[GAME] Level Incomplete... \nWaiting to spawn new wave');
      return false;
    }

    return true;
  }
  trySpawnPortals(): boolean {
    const remainingPlayers = this.getRemainingPlayerUnits().filter(u => Unit.canAct(u));
    if (remainingPlayers.length == 0) {
      console.debug('[GAME] TrySpawnPortals()...\nNo players to spawn portals for: ', this.players);
      return false;
    }

    const spawnedPortals = this.pickups.filter(p => !p.flaggedForRemoval && p.name === Pickup.PORTAL_PURPLE_NAME);
    if (spawnedPortals.length > 0) {
      console.debug('[GAME] TrySpawnPortals()...\nPortals have already been spawned: ', spawnedPortals);
      return false;
    }

    const portalPickup = Pickup.pickups.find(p => p.name == Pickup.PORTAL_PURPLE_NAME);
    if (!portalPickup) {
      console.error('[GAME] TrySpawnPortals()...\nUnexpected: Portal pickup does not exist: ', Pickup.pickups);
      return false;
    }

    // Make all non-portal pickups disappear so as to not compell players
    // to waste time walking around picking them all up
    this.pickups.filter(p => p.name !== Pickup.PORTAL_PURPLE_NAME && !p.flaggedForRemoval).forEach(p => {
      makeScrollDissapearParticles(p, false);
      Pickup.removePickup(p, this, false);
    });

    // Remove remaining floating souls on end of level so player doesn't feel compelled to pick them up
    this.units.filter(u => !u.alive).forEach(u => {
      removeFloatingParticlesFor(u);
      u.soulFragments = 0;
      u.soulsBeingCollected = false;
    });

    // Spawn a portal near each remaining player
    for (let playerUnit of remainingPlayers) {
      const portalSpawnLocation = this.DEPRECIATED_findValidSpawnInRadius(playerUnit, false, { radiusOverride: config.COLLISION_MESH_RADIUS });
      if (portalSpawnLocation) {
        spawnedPortals.push(Pickup.create({ pos: portalSpawnLocation, pickupSource: portalPickup, logSource: 'Portal' }, this, false));
      }

      // Give all player units huge stamina when portal spawns for convenience.
      playerUnit.stamina = 1_000_000;
      // Clear out soul debt
      playerUnit.soulFragments = Math.max(0, playerUnit.soulFragments);
      // Give all players max health and mana (it will be reset anyway when they are reset for the next level
      // but this disswades them from going around to pickup potions)
      playerUnit.health = playerUnit.healthMax;
      playerUnit.mana = playerUnit.manaMax;
      // Since playerUnit's health and mana is reset, we need to immediately sync the prediction unit
      // so that it doesn't inncorrectly warn "self damage due to spell" by seeing that the prediction unit
      // has less health than the current player unit.
      this.syncPlayerPredictionUnitOnly();
    }
    console.log('[GAME] TrySpawnPortal()\nSuccessfully spawned portals: ', spawnedPortals);
    return true;
  }
  tryGoToNextLevel(): boolean {
    // We can only go to the next level if all players are
    // inPortal or have completed their turn
    // This includes players that can't act due to death/freeze/etc.
    // In hotseat, one player inPortal is enough
    const connectedPlayers = this.players.filter(p => p.clientConnected);
    const goToNextLevel = connectedPlayers.every(p => Player.inPortal(p) || this.hasCompletedTurn(p))
      || (numberOfHotseatPlayers > 1 && connectedPlayers.some(Player.inPortal));

    if (!goToNextLevel) return false;

    console.log('- - -\nLevel Complete\n- - -');
    tutorialCompleteTask('portal');
    if (globalThis.isHost(this.pie)) {
      this.generateLevelData(this.levelIndex + 1);
    } else {
      console.log('This instance is not host, host will trigger next level generation.');
    }
    console.log('[GAME] Level Complete\nMoving to next level');
    return true;
  }
  isGameOver(): boolean {
    // Game is over once ALL units on all connected player factions are dead
    // TODO will have to update this to allow PVP / factions

    // Are there connected players?
    const connectedPlayers = this.players.filter(p => p.clientConnected);
    if (connectedPlayers.length == 0) {
      console.log('[GAME] Game is Over\nNo connected players in player list: ', this.players);
      return true;
    } else {
      console.debug('[GAME] isGameOver?\nConnected Players: ', connectedPlayers);
    }

    const remainingAllies = this.getRemainingPlayerAllies();
    if (remainingAllies.length == 0) {
      console.log('[GAME] Game is Over\nNo allies remain');
      return true;
    } else {
      console.debug('[GAME] isGameOver?\nRemaining allies: ', remainingAllies);
    }

    // If players have not been able to act for X turns
    // there may be a stalemate with ally and enemy NPC's
    // so we need a kill switch to handle this scenario
    const useKillSwitch = this.allyNPCAttemptWinKillSwitch > 50;
    if (useKillSwitch) {
      console.log('[GAME] Game is Over\nKill Switch threshold reached');
      return true;
    } else {
      console.debug('[GAME] isGameOver?\nKill Switch Counter: ', this.allyNPCAttemptWinKillSwitch);
    }

    console.log('[GAME] isGameOver = false\nGame is not over');
    return false;
  }
  clearGameOverModal() {
    // Remove game-over popup
    document.body.classList.toggle('game-over', false);
    clearTimeout(gameOverModalTimeout);
  }
  doGameOver() {
    console.log('- - -\nGame Over\n- - -');
    // allowForceInitGameState so that when the game restarts
    // it will get the full newly created underworld
    this.allowForceInitGameState = true;
    // Show game over modal after a delay
    gameOverModalTimeout = setTimeout(() => {
      document.body.classList.toggle('game-over', true);
      const playAgainBtn = document.getElementById('play-again');
      playAgainBtn?.classList.toggle('display-none', !(isSinglePlayer() || isHost(this.pie)));
    }, 2000);

    this.updateGameOverModal();
    if (globalThis.headless) {
      if (!this.isRestarting) {
        const millisTillRestart = 10000;
        console.log('-------------------Host app game over', true, `restarting in ${Math.floor(millisTillRestart / 1000)} seconds`);
        this.isRestarting = setTimeout(() => {
          this.restart();
        }, millisTillRestart);
      }
    }
  }
  restart() {
    if (!isHost(this.pie)) {
      console.error('Err: Attempting to restart from nonHost');
      return
    }

    const savedWizardTypes = this.players.map(p => ({ wizardType: p.wizardType, playerId: p.playerId }))

    const newUnderworld = new Underworld(this.overworld, this.pie, Math.random().toString());

    // Maintain difficulty
    newUnderworld.gameMode = this.gameMode;
    // Must be called when difficulty (gameMode) changes to update summon spell stats
    Cards.refreshSummonCardDescriptions(newUnderworld);
    recalculateGameDifficulty(newUnderworld);

    // Add players back to underworld
    // defaultLobbyReady: Since they are still in the game, set them to lobbyReady
    let clients = this.overworld.clients
    if (this.pie instanceof PiePeer) {
      clients = Array.from(globalThis.peers)
    }
    console.log('Restart with clients', this.overworld.clients, Array.from(globalThis.peers), clients);

    ensureAllClientsHaveAssociatedPlayers(this.overworld, clients, [], true);

    // Restore wizard info
    for (let savedWizardInfo of savedWizardTypes) {
      const player = newUnderworld.players.find(p => p.playerId == savedWizardInfo.playerId)
      if (!player) {
        console.log('Err: Player id missing', savedWizardInfo.playerId)
        console.error('Attempting to restore player wizard info but no player found with id')
      } else {
        Player.setWizardType(player, savedWizardInfo.wizardType, newUnderworld)
      }
    }
    // Generate the level data
    newUnderworld.lastLevelCreated = newUnderworld.generateLevelDataSyncronous(0, this.gameMode);
    // Actually create the level 
    newUnderworld.createLevelSyncronous(newUnderworld.lastLevelCreated);
    // @ts-ignore jtestExtraClients
    if (globalThis.jtestExtraClients && this.pie instanceof PiePeer) {
      peerHostBroadcastClientsPresenceChanged(this.pie);
    }
    this.overworld.clients.forEach(clientId => {
      hostGiveClientGameState(clientId, newUnderworld, newUnderworld.lastLevelCreated, MESSAGE_TYPES.INIT_GAME_STATE);
    });
  }
  updateGameOverModal() {
    // Add stats to modal:
    const elGameOverStats = document.getElementById('game-over-stats');
    const player = globalThis.player;
    if (!globalThis.headless) {
      if (elGameOverStats && player && player.stats) {
        elGameOverStats.innerHTML = `
Got to level ${this.getLevelText()}
      
Survived for ${((Date.now() - player.stats.gameStartTime) / 60000).toFixed(2)} Minutes
${this.winTime && this.startTime ? `Beat deathmasons in ${((this.winTime - this.startTime) / 60000).toFixed(2)} Minutes` : ''}

Total Kills: ${this.enemiesKilled}

${player.stats.bestSpell.unitsKilled > 0 ? `Best Spell killed ${player.stats.bestSpell.unitsKilled} units
      <div class="stats-spell">
${CardUI.cardListToImages(player.stats.bestSpell.spell)}
      </div>`: ''}
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
  hasCompletedTurn(player: Player.IPlayer) {
    // Return false if the player
    // - Has not spawned
    // - Can act and has not ended turn (alive, not frozen, etc.)
    if (!player.isSpawned) {
      console.log('Game State: \nPlayer has not spawned yet: ', player);
      return false;
    }
    if (Unit.canAct(player.unit) && !player.endedTurn) {
      console.log('Game State: Player can act and has not ended turn yet:', globalThis.headless ? safeStringify(player) : player);
      return false;
    }
    console.log('Game State: Player has completed turn: ', globalThis.headless ? safeStringify(player) : player);
    return true;
  }
  async handleNextHotseatPlayer() {
    // If it's not a hotseat game, return
    if (!(numberOfHotseatPlayers > 1)) return;

    // If current player hasn't completed their turn, return
    // We don't want to change hotseat players unless current player is done
    let currentPlayer = globalThis.player;
    if (currentPlayer && !this.hasCompletedTurn(currentPlayer)) {
      return;
    }

    // Change to the next hotseat player that hasn't completed their turn
    for (let i = 0; i < this.players.length; i++) {
      const currentPlayer = this.players[i];
      // Found a player that has not completed their turn, switch to them
      if (currentPlayer && !this.hasCompletedTurn(currentPlayer)) {
        console.log('[GAME] Turn Phase\nSwitching to hotseat player: ', currentPlayer);
        await this.changeToHotseatPlayer(currentPlayer);
        return;
      }
    }

    console.log('[GAME] Turn Phase\nAll remaining hotseat players have completed their turn');
  }
  async changeToFirstHotseatPlayer() {
    if (!(numberOfHotseatPlayers > 1)) return;

    const firstPlayer = this.players[0];
    if (firstPlayer) {
      await this.changeToHotseatPlayer(firstPlayer)
    }
    else {
      console.error('[GAME] Turn Phase\nFirst hotseat player does not exist');
    }
  }
  async changeToHotseatPlayer(player: Player.IPlayer) {
    console.log('[GAME] Turn Phase\nChange to hotseat player: ' + player.playerId);

    // If the next player has already completed turn or can't act
    // get the next hotseat player
    if (this.hasCompletedTurn(player)) this.handleNextHotseatPlayer();

    // Otherwise, set up hotseat player
    Player.updateGlobalRefToPlayerIfCurrentClient(player);
    CardUI.recalcPositionForCards(globalThis.player, this);
    CardUI.syncInventory(undefined, this);
    await raceTimeout(10_000, 'hotseat runPredictions', runPredictions(this));

    // For hotseat, whenever a player ends their turn, check if the current player
    // has upgrades to choose and if so, show the upgrade button
    if (globalThis.player && this.upgradesLeftToChoose(globalThis.player)) {
      elEndTurnBtn?.classList.toggle('upgrade', true);
    }
    // Now that hotseat player has changed, update inventory glow if needed
    CardUI.tryShowStatPointsSpendable();

    // Announce new players' turn
    if (globalThis.player && globalThis.player.name) {
      queueCenteredFloatingText(globalThis.player.name);
    }
    // Turn on auto follow if they are spawned, and off if they are not
    cameraAutoFollow(!!globalThis.player?.isSpawned);
  }

  // IMPORTANT NOTE: when in a multiplayer context,
  // this function will ONLY be invoked by the host (headless)
  // so do not run any "player turn end" logic here
  async tryEndPlayerTurnPhase(): Promise<Boolean> {
    // We care about the state of all connected players
    // We do not care about players without a connected client
    const connectedPlayers = this.players.filter(p => p.clientConnected);

    // Only move on if there are connected players in the game,
    // so that the server doesn't run cycles pointlessly
    if (!(connectedPlayers.length > 0)) {
      console.error('[GAME] Turn Phase\n tryEndPlayerTurnPhase = false; No active players found');
      return false;
    }

    // Return false if any players have not completed their turn
    for (let player of connectedPlayers) {
      if (!this.hasCompletedTurn(player)) {
        // Log is handled in hasCompletedTurn()

        // Any time the player is able to act
        // we should reset the allyNPCAttemptWinKillSwitch
        this.allyNPCAttemptWinKillSwitch = 0;

        return false;
      }
    }

    return true;
  }
  endPlayerTurnCleanup() {
    console.log('[GAME] Turn Phase\nEnd player turn phase');

    for (let p of this.players) {
      // Decrement card usage counts,
      // This makes spells less expensive
      for (let cardId of p.inventory) {
        // Decrement, cap at 0
        const cardUsage = p.cardUsageCounts[cardId];
        if (exists(cardUsage)) {
          p.cardUsageCounts[cardId] = Math.max(0, cardUsage - 1);
        }
      }

    }

    CardUI.updateCardBadges(this);
  }
  addMissingCompanions(player: Player.IPlayer) {
    // Add missing companions
    if (player.companion) {
      let found = this.companions.find(c => c.target == player.unit);
      // If familiar is the wrong kind, remove it so the right one can be created
      if (found && found.image.sprite.imagePath != player.companion) {
        this.companions = this.companions.filter(c => c.image !== found?.image);
        Image.cleanup(found.image);
        found = undefined;
      }
      if (!found) {
        const newCompanionImage = Image.create({ x: 0, y: 0 }, player.companion, containerUnits)
        if (newCompanionImage) {
          this.companions.push({ image: newCompanionImage, target: player.unit });
        }
      }
    }

  }
  async executePlayerTurn() {
    this.battleLog(`Begin Player Turn Phase`);
    await Unit.startTurnForUnits(this.players.map(p => p.unit), this, false, Faction.ALLY);

    for (let player of this.players) {
      player.endedTurn = false;

      if (player == globalThis.player && globalThis.player.isSpawned) {
        // Notify the current player that their turn is starting
        queueCenteredFloatingText(`Your Turn`);
        // Don't play turn sfx when recording
        if (!globalThis.isHUDHidden && !document.body?.classList.contains('hide-card-holders')) {
          playSFXKey('yourTurn');
        }
      }
      this.addMissingCompanions(player);
    }
    this.syncTurnMessage();
    // Update unit health / mana bars, etc
    await runPredictions(this);

    // Prevent saving "last turn" before any enemies are placed when the level
    // first starts
    if (player?.isSpawned) {
      this.quicksave(`Last Turn`);
    }

    // If there was an attempted save during the enemy turn, save now
    // that the player's turn has started
    if (globalThis.saveASAP && globalThis.save) {
      const forceOverwrite = globalThis.saveASAP.includes('quicksave');
      globalThis.save(globalThis.saveASAP, forceOverwrite);
    }

    this.changeToFirstHotseatPlayer();
    this.progressGameState();
  }
  quicksave(extraInfo?: string) {
    // Quicksave at the beginning of player's turn
    // Check globalThis.player.isSpawned to prevent quicksaving an invalid underworld file
    // .alive: Do not quicksave if player is dead
    if (!globalThis.headless && globalThis.save && globalThis.player && globalThis.player.unit.alive) {
      // For now, only save if in a singleplayer game
      // because save support hasn't been added to multiplayer yet
      const quicksaveName = `${globalThis.quicksaveKey}-${Date.now()}-${!this.pie.soloMode && this.pie.currentRoomInfo && `${this.pie.currentRoomInfo.name}` || 'Singleplayer'}${extraInfo ? `-${extraInfo}` : ''}`;
      console.info(`Dev: quick saving game as "${quicksaveName}"`);
      // Force overwrite for quicksave, never prompt "are you sure?" when auto saving a quicksave
      globalThis.save(quicksaveName, true);
    }

  }
  async executeNPCTurn(faction: Faction) {
    cleanUpEmitters(true);

    console.log('[GAME] Turn Phase\nExecuteNPCTurn', Faction[faction]);
    this.redPortalBehavior(faction);
    const units = this.units.filter(u => u.unitType == UnitType.AI && u.faction == faction);
    if (units.length) {
      this.battleLog(`Begin ${faction === 0 ? 'Ally' : 'Enemy'} NPC Turn Phase`);
    }
    await Unit.startTurnForUnits(units, this, false, faction);

    // TODO - Define/Control actions and smart targeting
    // in Unit rather than gameLoopUnit, for more versatility?
    const cachedTargets = this.getSmartTargets(units, true, true);

    // Ranged units should go before melee units
    for (let subTypes of this.subTypesTurnOrder) {
      this.subTypesCurrentTurn = subTypes;
      const actionPromises: Promise<void>[] = [];
      const readyToTakeTurnUnits = units.filter(u => Unit.canAct(u) && subTypes.includes(u.unitSubType));

      for (let u of readyToTakeTurnUnits) {
        u.path = undefined;
        const unitSource = allUnits[u.unitSourceId];
        if (unitSource) {
          const { targets, canAttack } = cachedTargets[u.id] || { targets: [], canAttack: false };
          // Add unit action to the array of promises to wait for
          let promise = raceTimeout(10000, `Unit.action; unitSourceId: ${u.unitSourceId}; subType: ${u.unitSubType}`, unitSource.action(u, targets, this, canAttack).then(async (actionResult) => {
            // Ensure ranged units get out of liquid so they don't take DOT
            // This doesn't apply to melee units since they will automatically move towards you to attack,
            // whereas without this ranged units would be content to just sit in liquid and die from the DOT
            if (u.unitSubType !== UnitSubType.MELEE && u.inLiquid) {
              // Using attackRange instead of maxStamina ensures they'll eventually walk out of liquid
              const coords = this.DEPRECIATED_findValidSpawnInRadius(u, false, { radiusOverride: config.COLLISION_MESH_RADIUS });
              if (coords) {
                await Unit.moveTowards(u, coords, this);
              }
            }
            return actionResult;
          }));
          actionPromises.push(promise);
        } else {
          console.error('Could not find unit source data for', u.unitSourceId);
        }
      }
      this.triggerGameLoopHeadless();
      await Promise.all(actionPromises);
    }

    // End turn events, liquid damage, mana regen, etc.
    // Use new units list in case it has changed (I.E. summons)
    await Unit.endTurnForUnits(this.units.filter(u => u.unitType == UnitType.AI && u.faction == faction), this, false, faction);
  }
  // This function is invoked when all factions have finished their turns
  async endFullTurnCycle() {
    // Increment the turn number now that it's starting over at the first phase
    this.turn_number++;
    this.allyNPCAttemptWinKillSwitch++;
    // Clear cast this turn
    globalThis.castThisTurn = false;

    // Failsafe: Force die any units that are out of bounds
    // Note: Player Controlled units are out of bounds when they are inPortal so that they don't collide,
    // this filters out PLAYER_CONTROLLED so that they don't get die()'d when they are inPortal
    for (let u of this.units.filter(u => u.alive)) {
      if (this.lastLevelCreated) {
        // Don't kill out of bound units if they are already flagged for removal
        // (Note: flaggedForRemoval units are set to NaN,NaN;  thus they are out of bounds, but 
        // they will be cleaned up so they shouldn't be killed here as this check is just to ensure
        // no living units that are unreachable hinder progressing through the game)
        if (!u.flaggedForRemoval) {
          if (this.isCoordOnWallTile({ x: u.x, y: u.y + config.WALL_BOUNDS_OFFSET })) {
            if (u.unitType == UnitType.PLAYER_CONTROLLED) {
              // Do NOT kill player units that are out of bounds
              console.warn('Player unit out of bounds');
            } else {
              console.error('Unit was force killed because they ended up out of bounds', u.unitSubType)
              Unit.die(u, this, false);
              // We don't want out-of-bound corpses
              Unit.cleanup(u);
            }
          }
        }
      }
    }

    // Pickups - Turns left to grab
    for (let p of this.pickups) {
      if (exists(p.turnsLeftToGrab)) {
        p.turnsLeftToGrab--;
        if (p.turnsLeftToGrab < 0) {
          // Remove pickup
          Pickup.removePickup(p, this, false);
          continue;
        }
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
    }

    // We handle boss and wave spawning here after a full turn has been resolved
    // to make sure the spawning isn't affected by npc turns, turn events, etc.
    // and ensure the newly spawned units don't get an immediate action

    // Deathmason spawns on the last level after players have completed their first turn
    if (await this.trySpawnBoss()) {
      // Boss has been spawned
    }

    // New waves spawn when the current wave of enemies is defeated
    if (this.trySpawnNextWave()) {
      // New wave has been spawned
    }
  }
  // Sends a network message to end turn
  async endMyTurnButtonHandler() {
    if (globalThis.player) {
      // If End turn button is level up button
      if (elEndTurnBtn && (elEndTurnBtn.classList.contains('upgrade') || document.body?.classList.contains(showUpgradesClassName))) {
        const upgradesLeftToChoose = this.upgradesLeftToChoose(globalThis.player)
        if (upgradesLeftToChoose > 0) {
          this.showUpgrades();
          elEndTurnBtn.classList.toggle('upgrade', false);
          // Do not end turn, just show upgrades
          return;
        } else {
          console.error('Unexpected: Cannot choose upgrades, upgrades left to choose:', upgradesLeftToChoose);
        }
        // Prevent ending turn when attempting to upgrade
        console.error('Unexpected: Attempted to show upgrades but cannot');
        // Catch, since we unexpectedly can't upgrade, remove upgrade button
        elEndTurnBtn.classList.toggle('upgrade', false)
        // Do not end turn
        return;
      }

      if (!globalThis.player.isSpawned) {
        console.log('You cannot end your turn until you are spawned.');
        return;
      }
      // Turns can only be manually ended during the PlayerTurns phase
      if (this.isMyTurn()) {
        let affirm = true
        // Interrupt endTurn with a cancellable prompt IF
        // player hasn't already ended their turn (note if they already HAVE ended their turn, just allow the END_TURN message to go through; this
        // might, but hopefully never, come in handy in the event that there is a desync and the client thinks it's ended its turn but the server doesn't. then
        // the client can end it again)
        // and stamina is still max
        // and player has not cast yet
        if (!globalThis.player.endedTurn && globalThis.player.unit.stamina == globalThis.player.unit.staminaMax && !globalThis.castThisTurn) {
          // Don't prompt "are you sure" for end turn when recording or local development
          if (!location.href.includes('localhost') && !globalThis.isHUDHidden && !document.body?.classList.contains('hide-card-holders')) {
            affirm = await Jprompt({ text: 'Are you sure you want to end your turn without moving or casting?', noBtnText: 'Cancel', noBtnKey: 'Escape', yesText: 'End Turn', yesKey: 'Space', yesKeyText: 'Spacebar' });
          }
        }
        if (affirm) {
          // Clear your selected spells when ending your turn.  This is a user preference inspried by a playtest
          CardUI.clearSelectedCards(this);
          console.log('endMyTurn: send END_TURN message');
          // When a user ends their turn, clear tints and spell effect projections
          // so they they don't cover the screen while AI take their turn
          clearSpellEffectProjection(this);
          clearTints(this);
          this.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
        }
      }
    }
  }
  async endPlayerTurn(player: Player.IPlayer) {
    if (this.turn_phase == turn_phase.Stalled) {
      // Do not end a players turn while game is Stalled or it will trigger
      // an exit of the Stalled phase and that should ONLY happen when a player reconnects
      return;
    }
    if (this.turn_phase != turn_phase.PlayerTurns) {
      // (A player "ending their turn" when it is not their turn
      // can occur when a client disconnects when it is not their turn)
      console.info('Cannot end the turn of a player when it is not currently their turn')
      return
    }
    if (this.players.length > 1 && !player.endedTurn) {
      this.battleLog(`${player.name} ended their turn`)
    }
    // Don't play turn sfx when recording or for auto-ended dead players
    if ((!globalThis.isHUDHidden && !document.body?.classList.contains('hide-card-holders')) && (player.unit.alive || (!player.unit.alive && player.endedTurn))) {
      if (!player.endedTurn) {
        // Play endTurn sfx for any player so you know when they ready up
        playSFXKey('endTurn');
      } else {
        // If turn is already ended for self, play the deny sfx
        // if other player, play nothing.
        if (globalThis.player == player) {
          playSFXKey('deny');
        }
      }
    }
    // Ensure players can only end the turn when it IS their turn
    if (this.turn_phase == turn_phase.PlayerTurns) {
      player.endedTurn = true;

      console.log('[GAME] Turn Phase\nPlayer ended turn: ', player);
      this.syncTurnMessage();
      await this.progressGameState();
    } else {
      console.error('[GAME] Turn Phase\nturn_phase must be PlayerTurns to end turn. Cannot be ', this.turn_phase);
    }

    // Should progress game state go here as a failsafe?
    Player.syncLobby(this);
  }
  // TODO - What is this? Just a logger?
  // This displays "Your Turn" message and updates player-status text in the top left
  syncTurnMessage() {
    console.log('syncTurnMessage: phase:', turn_phase[this.turn_phase]);
    let yourTurn = false;
    if (!this.isGameOver() && this.turn_phase === turn_phase.PlayerTurns) {
      if (!globalThis.player?.endedTurn) {
        yourTurn = true;
      }
    }
    document.body?.classList.toggle('your-turn', yourTurn);
    Player.syncLobby(this);
  }
  // Initialization logic that runs to setup a change of turn_phase
  // Invoked only through wsPie, use broadcastTurnPhase in game logic
  // when you want to set the turn_phase
  // See GameLoops.md for more details
  async initializeTurnPhase(p: turn_phase) {
    console.log('[GAME] Turn Phase\ninitializeTurnPhase: ', turn_phase[p]);

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
    if (!phase) {
      console.error('[GAME] Turn Phase\nInvalid turn phase: ', turn_phase[p]);
      return;
    }

    // Trigger full turn cycle events now that it's restarting at the playerTurn
    if (phase == turn_phase[turn_phase.PlayerTurns]) {
      for (let unit of this.units) {
        const events = [...unit.events, ...this.events];
        await Promise.all(events.map(
          async (eventName) => {
            const fn = Events.onFullTurnCycleSource[eventName];
            if (fn) {
              await fn(unit, this, false);
            }
          },
        ));
      }
    }

    switch (phase) {
      case turn_phase[turn_phase.PlayerTurns]: {
        if (this.players.every(p => !p.clientConnected)) {
          // This is the only place where the turn_phase can become Stalled, when it is supposed
          // to be player turns but there are no players connected.
          // Note: the Stalled turn_phase should be set immediately, not broadcast
          // This is an exception because if the game is stalled, by definition, there
          // are no players to broadcast to.
          // Setting it immediately ensures that any following messages in the queue won't reengage
          // the turn_phase loop, causing an infinite loop
          this.turn_phase = turn_phase.Stalled;
          console.log('[GAME] Turn Phase\nSkipping initializingPlayerTurns, no players connected. Setting turn_phase to "Stalled"');
        } else {
          // Initialize the player turns.
          // Note, it is possible that calling this will immediately end
          // the player phase (if there are no players to take turns)
          await this.executePlayerTurn();
        }
        // Note: The player turn occurs asyncronously because it depends on player input so the call to
        // `broadcastTurnPhase(turn_phase.NPC_ALLY)` happens inside tryEndPlayerTurnPhase(); whereas the other blocks in
        // this switch statement always move to the next faction turn on their last line before the break, but this one does
        // not.
        break;
      }
      case turn_phase[turn_phase.NPC_ALLY]: {
        // End player turn now that it is about to start NPC_ALLY turn
        await Unit.endTurnForUnits(this.players.map(p => p.unit), this, false, Faction.ALLY);
        this.endPlayerTurnCleanup();

        await this.executeNPCTurn(Faction.ALLY);
        this.broadcastTurnPhase(turn_phase.NPC_ENEMY);
        break;
      }
      case turn_phase[turn_phase.NPC_ENEMY]: {
        await this.executeNPCTurn(Faction.ENEMY);
        await this.endFullTurnCycle();
        this.broadcastTurnPhase(turn_phase.PlayerTurns);
        break;
      }
      default: {
        break;
      }
    }
    // Sync player health, mana, stamina bars to ensure that it's up to date
    // at the start of any turn_phase so there's no suprises
    this.syncPlayerPredictionUnitOnly();
    Unit.syncPlayerHealthManaUI(this);
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
    console.log('[GAME] Turn Phase\nsetTurnPhase: ', turn_phase[p]);
    this.turn_phase = p;
    this.syncTurnMessage();

    // Remove all phase classes from body
    if (!globalThis.headless) {
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
  async broadcastTurnPhase(p: turn_phase) {
    // If host, send sync; if non-host, ignore 
    if (globalThis.isHost(this.pie)) {
      console.log('[GAME] Turn Phase\nBroadcast SET_PHASE: ', turn_phase[p]);

      this.pie.sendData({
        type: MESSAGE_TYPES.SET_PHASE,
        // Store the level index that this function was invoked on
        // so that it can be sent along with the message so that if
        // the level index changes, 
        // the old SET_PHASE state won't overwrite the newer state
        currentLevelIndex: this.levelIndex,
        phase: p,
        units: this.units.filter(u => !u.flaggedForRemoval).map(Unit.serialize),
        pickups: this.pickups.filter(p => !p.flaggedForRemoval).map(Pickup.serialize),
        players: this.players.map(Player.serialize),
        lastUnitId: this.lastUnitId,
        lastPickupId: this.lastPickupId,
        // the state of the Random Number Generator
        RNGState: this.random.state(),
      });
    }
  }
  tryRestartTurnPhaseLoop() {
    // See GameLoops.md for more details 
    if (this.turn_phase == turn_phase.Stalled && this.players.some(player => Player.ableToAct(player))) {
      console.log('[GAME] Turn Phase\nRestarting turn loop with PlayerTurns')
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
  forceUpgrade(player: Player.IPlayer, upgrade: Upgrade.IUpgrade, free: boolean) {
    if (free) player.freeSpells.push(upgrade.title);
    upgrade.effect(player, this);
    player.upgrades.push(upgrade.title);
    // Recalc cards so the card changes show up
    if (player === globalThis.player) {
      setTimeout(() => {
        CardUI.recalcPositionForCards(player, this);
        CardUI.syncInventory(undefined, this);
      }, 0);
    }
  }
  chooseUpgrade(player: Player.IPlayer, upgrade: Upgrade.IUpgrade) {
    const upgradesLeftToChoose = this.upgradesLeftToChoose(player);
    if (upgrade.type == 'card') {
      // Reset reroll counter now that player has chosen a card
      player.reroll = 0;
      globalThis.rerollOmit = [];
      if (upgradesLeftToChoose <= 0) {
        // This might be a false error after the refactors
        console.error('Player managed to choose an upgrade without being supposed to: ', player);
      }
    } else if (upgrade.type == 'special') {
      // Any future logic for special cards such as 'reroll' goes here
    }
    upgrade.effect(player, this);

    // Special upgrades don't get added to the upgrade list because they just
    // execute some functionality on the client side
    if (upgrade.type !== 'special' && upgrade.type !== 'mageType') {
      player.upgrades.push(upgrade.title);
    }
    if (player == globalThis.player) {
      document.body?.querySelector(`.card[data-upgrade="${upgrade.title}"]`)?.classList.toggle('chosen', true);
      // Clear upgrades when current player has picked one
      document.body?.classList.toggle(showUpgradesClassName, false);
      // Show next round of upgrades
      this.showUpgrades();
    }
  }
  upgradesLeftToChoose(player: Player.IPlayer): number {
    // invoke generateUpgrades to protect against player having upgradesLeftToChoose but no upgrades being generated by generateUpgrades
    // (this can happen if you have all of the possibly choosable upgrades).
    const hasUpgradesToChooseFrom = !!Upgrade.generateUpgrades(player, 1, this).length;
    if (!hasUpgradesToChooseFrom) {
      return 0;
    }
    // .filter out freeSpells because they shouldn't count against upgrades available since they are given to you
    const upgradesLeftToChoose = this.cardDropsDropped + config.STARTING_CARD_COUNT - player.inventory.filter(spellId => (player.freeSpells || []).indexOf(spellId) == -1).length - (player.skippedCards || 0);
    console.debug('Player upgrades left to choose: ', upgradesLeftToChoose, `;
+ cardDropsDropped: ${this.cardDropsDropped} 
+ config.STARTING_CARD_COUNT ${config.STARTING_CARD_COUNT} 
- player.inventory.filter(spellId => (player.freeSpells || []).indexOf(spellId) == -1).length: ${player.inventory.filter(spellId => (player.freeSpells || []).indexOf(spellId) == -1).length} 
- (player.skippedCards || 0): ${(player.skippedCards || 0)}`)
    return upgradesLeftToChoose;
  }
  upgradeRune(runeModifierId: string, player: Player.IPlayer, payload: { newSP: number }) {
    const isCurrentPlayer = player == globalThis.player;
    if (remoteLog) {
      remoteLog(`Buy Rune: ${runeModifierId}`);
    }
    console.log('CHOOSE_RUNE', runeModifierId, player.statPointsUnspent);
    const modifier = Cards.allModifiers[runeModifierId];
    if (!modifier) {
      console.error(`Failed to upgrade rune ${runeModifierId}`)
      return;
    }
    player.statPointsUnspent = payload.newSP;


    if (isCurrentPlayer) {
      playSFXKey('levelUp');
    }

    Unit.addModifier(player.unit, runeModifierId, this, false, modifier.quantityPerUpgrade || 1);
    // QoL: Unlock rune when maxed out so it won't stick around
    if (CardUI.isRuneMaxed(runeModifierId, player)) {
      player.lockedRunes = player.lockedRunes.filter(lr => lr.key != runeModifierId);
      if (isCurrentPlayer) {
        CardUI.renderRunesMenu(this);
      }
    }
    if (isCurrentPlayer) {
      // Clear special showWalkRope for attackRange hover
      keyDown.showWalkRope = false;
      CardUI.renderRunesMenu(this)
      // Clear gold glow on inv button if necessary
      CardUI.tryShowStatPointsSpendable();
      // Some runes change the cost of cards so the card badges must be upgraded
      // when the current player chooses a rune
      CardUI.updateCardBadges(this);
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
      return;
    }
    const upgradesLeftToChoose = this.upgradesLeftToChoose(player);
    console.log("Upgrades/Curses left to choose:", upgradesLeftToChoose);

    // Return immediately if player has no upgrades that left to pick from
    if (upgradesLeftToChoose <= 0) {
      console.log('showUpgrades: Closing upgrade screen, nothing left to pick');
      // Hide the upgrade button since there are no upgrades left to pick
      elEndTurnBtn?.classList.toggle('upgrade', false);
      return;
    }

    if (elUpgradePickerLabel) {
      elUpgradePickerLabel.innerHTML = i18n('Pick a Spell');
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

    let numberOfUpgradesToChooseFrom = 3 - player.reroll;
    if (player.unit.modifiers[runeGamblerId]) {
      numberOfUpgradesToChooseFrom += player.unit.modifiers[runeGamblerId].quantity;
    }
    const upgrades = Upgrade.generateUpgrades(player, numberOfUpgradesToChooseFrom, this);
    if (!upgrades.length) {
      // Player already has all the upgrades
      document.body?.classList.toggle(showUpgradesClassName, false);
      warnNoMoreSpellsToChoose();
    } else {
      // Store currently shown upgrades in rerollOmit so they won't show in subsequent rerolls
      globalThis.rerollOmit = (globalThis.rerollOmit || []).concat(upgrades.map(u => u.title));
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
      if (numberOfUpgradesToChooseFrom > 1 && (!upgrades[0] || upgrades[0].type !== 'mageType')) {
        this.addRerollButton(player);
      } else {
        // Remove reroll btn
        if (rerollBtnContainer) {
          rerollBtnContainer.innerHTML = '';
        }
      }
    }
  }
  addRerollButton(player: Player.IPlayer) {
    if (rerollBtnContainer) {
      const elReroll = document.createElement('div');
      elReroll.classList.add('reroll-btn');
      elReroll.style.color = 'white';
      elReroll.addEventListener('click', () => {
        playSFXKey('reroll');
        player.reroll++;
        // Clear upgrades
        document.body?.classList.toggle(showUpgradesClassName, false);
        this.showUpgrades();
      });
      elReroll.addEventListener('mouseenter', (e) => {
        playSFXKey('click');
      });
      // Empty before adding new reroll btn
      rerollBtnContainer.innerHTML = '';
      rerollBtnContainer.appendChild(elReroll);
      if (player.inventory.length >= 3 && globalThis.player) {
        const spCost = globalThis.player.wizardType == 'Deathmason' ? -30 : 60
        const elSkipCard = document.createElement('div');
        elSkipCard.classList.add('skip-card-btn');
        elSkipCard.style.color = 'white';
        const isDisabled = spCost < 0 && globalThis.player.statPointsUnspent < Math.abs(spCost)
        if (isDisabled) {
          elSkipCard.classList.toggle('disabled', true)
        }
        elSkipCard.innerHTML = `${spCost > 0 ? '+' : ''}${spCost} SP`;
        elSkipCard.addEventListener('click', () => {
          if (isDisabled) {
            playSFXKey('deny');
          } else {
            playSFXKey('click');
            // Clear upgrades
            document.body?.classList.toggle(showUpgradesClassName, false);
            this.pie.sendData({
              type: MESSAGE_TYPES.SKIP_UPGRADE,
              spCost,
            });
          }
        });
        elSkipCard.addEventListener('mouseenter', (e) => {
          playSFXKey('click');
        });
        rerollBtnContainer.appendChild(elSkipCard);
      }
    }
  }
  getRandomCoordsWithinBounds(bounds: Limits, seed?: prng): Vec2 {
    const x = randInt(bounds.xMin || 0, bounds.xMax || 0, seed || this.random);
    const y = randInt(bounds.yMin || 0, bounds.yMax || 0, seed || this.random);
    return { x, y };
  }
  // Spawn units out of portals
  redPortalBehavior(faction: Faction) {
    const portalName = faction == Faction.ENEMY ? Pickup.RED_PORTAL : Pickup.BLUE_PORTAL;
    const deathmasons = this.units.filter(u => u.unitType == UnitType.AI && u.unitSourceId == bossmasonUnitId && u.faction == faction)
    for (let deathmason of deathmasons) {
      const seed = seedrandom(`${getUniqueSeedString(this)}-${deathmason.id}`);
      const deathmasonPortals = this.pickups.filter(p => p.name == portalName && !p.flaggedForRemoval);
      const deathmasonPortalTeleportIndex = randInt(0, deathmasonPortals.length, seed);
      const portal = deathmasonPortals[deathmasonPortalTeleportIndex];
      if (!portal) {
        continue;
      }
      skyBeam(deathmason);
      skyBeam(portal);
      deathmason.x = portal.x;
      deathmason.y = portal.y;
      Obstacle.tryFallInOutOfLiquid(deathmason, this, false);
      Pickup.removePickup(portal, this, false);
    }
    const deathmasonPortals = this.pickups.filter(p => p.name == portalName && !p.flaggedForRemoval &&
      // @ts-ignore special property of portals to distinguish them from portals that just teleport
      p.doesSpawn);
    for (let i = 0; i < deathmasonPortals.length; i++) {
      const portal = deathmasonPortals[i];
      if (!portal || portal.flaggedForRemoval) {
        continue;
      }
      summonUnitAtPickup(faction, portal, this);
    }
  }
  incrementTargetsNextTurnDamage(targets: Unit.IUnit[], damage: number, canAttack: boolean, sourceUnit: Unit.IUnit) {
    if (canAttack) {
      for (let target of targets) {
        if (target.isMiniboss || target.unitType == UnitType.PLAYER_CONTROLLED) {
          // Skip calculating predictedNextTurnDamage for minibosses and players.
          // This allows them to recieve Overkill damage which is important because
          // this function does not use the onTakeDamage and onDealDamage events
          // which means it is not actually calculating exact damage.
          // It **cannot** invoke those functions because if it did it would
          // lag the game considerably since this is called on all units every 
          // runPrediction.
          // So instead the solution is to just let minibosses and players (who may
          // have onTakeDamage events that limit damage or reduce it) be overkilled
          // so that AI don't skip over them while they are still living.
          continue;
        }
        target.predictedNextTurnDamage += damage;
      }
    }
  }
  // For AI Refactor: https://github.com/jdoleary/Spellmasons/issues/388
  // TODO - This doesn't factor in fortify, debilitate, bloat explosions, etc.
  // This also doesn't play well with units that have different actions, such as the Goru
  // Is there a way for us to better predict the enemy turn, in a way that considers
  // the game state and always stays in sync with the actual outcome of combat?
  // ---
  // This function costs lots of CPU.  It is optimized with a "chunking" strategy
  // that calculates targets for a few at a time in chunks rather than doing all at once
  getSmartTargets(units: Unit.IUnit[], restartChunks: boolean = true, skipChunking: boolean = false): { [id: number]: { targets: Unit.IUnit[], canAttack: boolean } } {
    if (skipChunking || restartChunks) {
      // Clear all units' predictedNextTurnDamage now that is is the next turn
      for (let u of this.units) {
        u.predictedNextTurnDamage = 0;
      }
      globalThis.currentChunk = 0;
    }

    // Optimization, search for "chunks" / "chunking strategy" to learn more
    let startChunk = globalThis.currentChunk || 0;
    // Optimization, search for "chunks" / "chunking strategy" to learn more
    let counter = 0;

    const cachedTargets: { [id: number]: { targets: Unit.IUnit[], canAttack: boolean } } = {};
    for (let subTypes of this.subTypesTurnOrder) {
      const activeTurnUnits = units.filter(u => subTypes.includes(u.unitSubType));
      // Loop through planned unit actions for smart targeting
      for (let u of activeTurnUnits) {
        // Optimization; count how many units have been processed
        counter++;
        // Optimization; if the counter hasn't yet reached the currentChunk
        // keep going, don't reprocess units at the beginning of the array
        if (!skipChunking && counter < globalThis.currentChunk!) {
          continue;
        }
        // Optimization; Once we have processed config.ChunkSize, return what has been cached so far.
        if (!skipChunking && (globalThis.currentChunk || 0) >= startChunk + config.getSmartTargetsChunkSize) {
          return cachedTargets;
        }
        const unitSource = allUnits[u.unitSourceId];
        // Initialize empty so that prediction units will clear their attentionMarker munless there are active targets
        cachedTargets[u.id] = { targets: [], canAttack: false };
        if (!Unit.canAct(u)) {
          // After initializing to canAttack: false, return for units that cannot attack
          // This is important to ensure that units that cannot attack get no attention marker
          // whereas if they weren't in cachedTargets at all, they might keep one from previously
          continue;
        }
        if (unitSource) {
          if (unitSource.id == GORU_UNIT_ID) {
            // Special smart targeting for goru
            // Save for AI refactor?
            const targets = unitSource.getUnitAttackTargets(u, this);
            const canAttack = this.canUnitAttackTarget(u, targets && targets[0])
            cachedTargets[u.id] = { targets, canAttack };
          }
          else {
            const targets = unitSource.getUnitAttackTargets(u, this);
            const canAttack = this.canUnitAttackTarget(u, targets && targets[0])
            cachedTargets[u.id] = { targets, canAttack };
            this.incrementTargetsNextTurnDamage(targets, u.damage, canAttack, u);
            if (unitSource.id == PRIEST_ID) {
              // Signal to other priests that this one is targeted for resurrection
              // so multiple priests don't try to ressurect the same target
              this.incrementTargetsNextTurnDamage(targets, -u.healthMax, true, u);
            }
          }
        }
        // Optimization; Increment the currentChunk (one per unit processed)
        globalThis.currentChunk = (globalThis.currentChunk || 0) + 1;
      }
    }

    // Optimization; Set to -1 to denote that it has finished processing all units
    globalThis.currentChunk = -1;
    return cachedTargets;
  }
  canUnitAttackTarget(u: Unit.IUnit, attackTarget?: Unit.IUnit): boolean {
    if (!attackTarget) {
      return false;
    }
    switch (u.unitSubType) {
      case UnitSubType.MELEE:
        const maxPathDistance = u.attackRange + (Unit.canMove(u) ? u.stamina : 0);
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
      case UnitSubType.SPECIAL_LOS:
        return u.alive && this.hasLineOfSight(u, attackTarget) && Unit.inRange(u, attackTarget) && u.mana >= u.manaCostToCast;
      case UnitSubType.RANGED_LOS:
        return u.alive && this.hasLineOfSight(u, attackTarget) && Unit.inRange(u, attackTarget) && u.mana >= u.manaCostToCast;
      case UnitSubType.RANGED_RADIUS:
        return u.alive && Unit.inRange(u, attackTarget) && u.mana >= u.manaCostToCast;
      case UnitSubType.SUPPORT_CLASS:
        // Support classes (such as priests and summoners) dont attack targets
        return false;
      case UnitSubType.GORU_BOSS:
        // Goru's attention marker is handled elsewhere: He's always going to do some action when he has mana
        // Goru's getUnitAttackTargets functions similarly to summoners, returning himself if he has mana to act
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
      .sort(math.sortCosestTo(coords))
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
      .filter(p => !isNaN(p.x) && !isNaN(p.y) && math.distance(coords, p) <= p.radius)
      .sort(math.sortCosestTo(coords));
    const closest = sortedByProximityToCoords[0]
    return closest;
  }
  // Note, predictions ids intentionally won't always align with real unit ids.
  // If you are trying to find a unit's corresponding prediction or a predictionUnit's
  // corresponding real unit, use unit.predictionCopy or unit.real respectively.
  // See `lastPredictionUnitId` for more context on why ids are different.
  getUnitById(id: number, prediction: boolean): Unit.IUnit | undefined {
    const units = prediction ? this.unitsPrediction : this.units;
    return units.find(u => u.id == id);
  }
  addUnitToArray(unit: Unit.IUnit, prediction: boolean): Unit.IUnit {
    if (prediction && this.unitsPrediction) {
      this.unitsPrediction.push(unit);
      return unit;
    } else {
      this.units.push(unit);
      return unit;
    }
  }
  addPickupToArray(pickup: Pickup.IPickup, prediction: boolean) {
    if (prediction && this.pickupsPrediction) {
      this.pickupsPrediction.push(pickup)
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
      tutorialCompleteTask('cast');
      tutorialCompleteTask('castMultipleInOneTurn', () => casterUnit.mana < casterUnit.manaMax);
      tutorialCompleteTask('combineSpells', () => Array.from(new Set(cardIds)).length > 1);
      globalThis.castThisTurn = true;
    }

    let effectState: Cards.EffectState = {
      // frontload cardIds (quality of life)
      // for spells such as Plus Radius
      // so you can add them anywhere in the spell
      cardIds: cardIds.sort((a, b) => {
        const A = Cards.allCards[a];
        const B = Cards.allCards[b];
        if (!A || !B) {
          return 0;
        }
        if (A.frontload && !B.frontload) {
          return -1;
        }
        if (B.frontload && !A.frontload) {
          return 1;
        }
        return 0;
      }),
      shouldRefundLastSpell: false,
      casterCardUsage,
      casterUnit,
      casterPositionAtTimeOfCast,
      casterPlayer,
      targetedUnits: [],
      targetedPickups: [],
      castLocation,
      aggregator: {
        radiusBoost: casterUnit.modifiers[modifierBaseRadiusBoostId]?.quantity || 0,
        additionalPierce: casterUnit.modifiers[modifierBasePierceId]?.quantity || 0,
        additionalBounce: 0,
      },
      initialTargetedUnitId,
      initialTargetedPickupId,
      spellCostTally: undefined
    };

    // Get initial targets.  If initial targets are already determined (by being passed into this function, use them;
    // this is so that networked SPELL messages have consistent targets).  otherwise determine the initial target
    // based on the castLocation and special logic such as noInitialTarget and onlySelectDeadUnits which depend on the
    // cards being cast
    let unitsAtCastLocation = this.getUnitsAt(castLocation, prediction);
    let useInitialTarget = true;
    const firstCardId = effectState.cardIds[0];
    if (firstCardId) {
      const firstCard = Cards.allCards[firstCardId];
      if (firstCard && firstCard.noInitialTarget) {
        useInitialTarget = false;
      }
      // If first card in spell has onlySelectDeadUnits to true,
      // filter units for dead ones.  This prevents a living unit
      // standing over a corpse from preventing the caster from
      // selecting the corpse
      if (firstCard && firstCard.onlySelectDeadUnits) {
        unitsAtCastLocation = unitsAtCastLocation.filter(u => !u.alive);
      }
    }
    // It is the default expected behavior to use an initial target at the cast location,
    // it is unusual, but possible, to skip this for very specific spells
    if (useInitialTarget) {
      // Get first unit at cast location
      if (exists(effectState.initialTargetedUnitId)) {
        const initialTargetUnit = this.units.find(u => u.id === effectState.initialTargetedUnitId);
        if (initialTargetUnit) {
          Cards.addTarget(initialTargetUnit, effectState, this, prediction);
        } else {
          console.error('effectState.initialTargetedUnitId was defined but the unit was not found');
        }
      } else {
        const unitAtCastLocation = unitsAtCastLocation[0];
        if (unitAtCastLocation) {
          effectState.initialTargetedUnitId = unitAtCastLocation.id;
          Cards.addTarget(unitAtCastLocation, effectState, this, prediction);
        }
      }
      // Get first pickup at cast location
      if (exists(effectState.initialTargetedPickupId)) {
        const initialTargetPickup = this.pickups.find(p => p.id === effectState.initialTargetedPickupId);
        if (initialTargetPickup) {
          Cards.addTarget(initialTargetPickup, effectState, this, prediction);
        } else {
          console.error('effectState.initialTargetedPickupId was defined but the unit was not found');
        }
      } else {
        const pickupAtCastLocation = this.getPickupAt(castLocation, prediction);
        if (pickupAtCastLocation) {
          effectState.initialTargetedPickupId = pickupAtCastLocation.id;
          Cards.addTarget(pickupAtCastLocation, effectState, this, prediction);
        }
      }
    }

    // https://github.com/jdoleary/Spellmasons/pull/521 
    // Refactor notice: Hard-Coded "Target Curse"
    // Add all target-cursed enemies to targets list and decrement curse quantity
    for (const unit of prediction ? this.unitsPrediction : this.units) {
      const targetCurse = unit.modifiers[targetCursedId];
      if (targetCurse) {
        targetCurse.quantity--;
        if (targetCurse.quantity == 0) {
          Unit.removeModifier(unit, targetCursedId, this);
        }
        if (!effectState.targetedUnits.includes(unit) && !unit.flaggedForRemoval) {
          effectState.targetedUnits.push(unit);
        }
      }
    }

    const castingParticleEmitter = makeRisingParticles(effectState.casterUnit, prediction, hexToString(magicColor || 0xffffff), -1);

    // "quantity" is the number of identical cards cast in a row. Rather than casting the card sequentially
    // quantity allows the card to have a unique scaling effect when cast sequentially after itself.
    let quantity = 1;
    let excludedTargets: Unit.IUnit[] = [];
    let precastCharges: { [cardId: string]: number } = { ...(effectState.casterUnit.charges || {}) };
    for (let index = 0; index < effectState.cardIds.length; index++) {
      // Reset flag that informs if the last spell was refunded.
      effectState.shouldRefundLastSpell = false;
      const cardId = effectState.cardIds[index];
      if (isNullOrUndef(cardId)) {
        console.error('card id is undefined in loop', index, effectState.cardIds);
        continue;
      }
      const card = Cards.allCards[cardId];
      if (card) {
        // Only increment quantity for sequntial identical cards IF the card
        // explicitly supports quantity
        if (card.supportQuantity) {
          const nextCardId = effectState.cardIds[index + 1];
          if (exists(nextCardId)) {
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

        if (!prediction) {
          test_startCheckPromises(card.id);
        }
        //// INCUR MANA COST ////
        // Charge for cost of spell before spell is cast so that
        // cards like split can trigger even tho they'll reduce your  mana
        // when executed if self-cast
        const spellCostTally: CardCost = {
          manaCost: 0,
          healthCost: 0,
          staminaCost: 0,
          soulFragmentCost: 0
        };
        let soulDebtHealthCost = 0;
        let cardUsageCountPreCast = 0;
        if (!args.castForFree) {
          // This happens after the spell is cast so that fizzle spells can be refunded
          // Compute spell mana/health cost and add card usage count
          for (let i = 0; i < quantity; i++) {
            const timesUsedSoFar = (casterCardUsage[card.id] || 0) + (quantity > 1 ? i * card.expenseScaling : i);
            const singleCardCost = calculateCostForSingleCard(card, timesUsedSoFar, casterPlayer);
            spellCostTally.manaCost += singleCardCost.manaCost;
            spellCostTally.healthCost += singleCardCost.healthCost;
            spellCostTally.staminaCost += singleCardCost.staminaCost;
            if (exists(spellCostTally.soulFragmentCost)) {
              spellCostTally.soulFragmentCost += singleCardCost.soulFragmentCost || 0;
            }
          }
          // Apply mana and health cost to caster
          // Note: it is important that this is done BEFORE a card is actually cast because
          // the card may affect the caster's mana
          effectState.casterUnit.mana -= spellCostTally.manaCost;
          effectState.casterUnit.stamina -= spellCostTally.staminaCost;
          if (spellCostTally.soulFragmentCost) {
            effectState.casterUnit.soulFragments -= spellCostTally.soulFragmentCost;
            soulDebtHealthCost = getSoulDebtHealthCost(effectState.casterPlayer, prediction);
            spellCostTally.healthCost += soulDebtHealthCost;
          }
          if (effectState.casterUnit.charges) {
            if (isNullOrUndef(effectState.casterUnit.charges[card.id])) {
              effectState.casterUnit.charges[card.id] = 0;
            }
            effectState.casterUnit.charges[card.id] = (effectState.casterUnit.charges[card.id] || 0) - quantity;
          }

          // Increment card usage; now that the caster is using the card
          if (casterCardUsage[cardId] === undefined) {
            casterCardUsage[cardId] = 0;
          }
          cardUsageCountPreCast = casterCardUsage[cardId] || 0;
          casterCardUsage[cardId] += card.expenseScaling * quantity;
          if (!prediction) {
            CardUI.updateCardBadges(this);
          }
        }
        //// end INCUR MANA COST ////
        const cardEffectPromise = card.effect(effectState, card, quantity, this, prediction, outOfRange);
        // Await force moves produced by the cast SYNCRONOUSLY, such as a pull from Dash
        await this.awaitForceMoves(prediction);

        // Await the cast
        try {
          if (globalThis.headless) {
            // The server should timeout a card if it is hanging.
            // The Server; however, calculates each card very quickly, so 1 second is
            // ample padding to finish unless it is hanging in which case we want to timeout
            await raceTimeout(1000, `${card.id};Prediction:${prediction}`, cardEffectPromise.then(state => {
              // Note: Using .then so that effect state is ONLY set if the promise succeeds and does not timeout
              effectState = state;
            }));
          } else {
            effectState = await cardEffectPromise;
          }
        } catch (e) {
          console.error('Unexpected error from card.effect', e);
        }

        // Await force moves produced by the cast ASYNCRONOUSLY, such as pushes from an explosion on death due to the cast
        await this.awaitForceMoves(prediction);

        if (!prediction) {
          test_endCheckPromises();
        }

        //// REFUNDING ////
        // Refund mana if necessary 
        if (effectState.shouldRefundLastSpell) {
          effectState.casterUnit.mana += spellCostTally.manaCost;
          // Reset manacost since it was refunded
          spellCostTally.manaCost = 0;
          effectState.casterUnit.soulFragments += spellCostTally.soulFragmentCost || 0;
          spellCostTally.soulFragmentCost = 0;
        }
        // Refund charges if necessary 
        if (effectState.shouldRefundLastSpell && effectState.casterPlayer && Player.isDeathmason(effectState.casterPlayer) && effectState.casterPlayer.unit.charges) {
          effectState.casterPlayer.unit.charges[cardId] = (effectState.casterPlayer.unit.charges[cardId] || 0) + quantity;
        }
        // If refund, reset cardUsageCount
        if (effectState.shouldRefundLastSpell || args.castForFree) {
          casterCardUsage[cardId] = cardUsageCountPreCast;
        }
        //// end REFUNDING ////

        //// INCUR HEALTH COST ////
        // While mana cost occurs BEFORE the cards effect so that 
        // spells like split and manasteal work well, health cost is taken
        // after because undoing death is not trivial (modifiers, sprites, etc)
        // Also, there are few health cost spells so having it charge after
        // the effect, i think, won't pose the same problem that mana spells
        // would
        if (!args.castForFree && !effectState.shouldRefundLastSpell) {
          if (spellCostTally.healthCost !== 0) {
            Unit.takeDamage({
              unit: effectState.casterUnit,
              amount: spellCostTally.healthCost,
              // Note: sourceUnit is intentionally undefined
              // so that heath-cost spells remain unaffected by runes
              sourceUnit: undefined,
              fromVec2: effectState.casterUnit,
              // spell health cost shouldn't trigger onDamage events
              pureDamage: true,
            }, this, prediction);
          }
          if (soulDebtHealthCost && !prediction) {
            floatingText({ coords: effectState.casterUnit, text: ['Soul Debt floating text', Math.abs(soulDebtHealthCost).toString()], style: { fill: colors.bloodColorDefault } });
          }
        }
        //// end INCUR HEALTH COST ////


        // Bandaid: Prevent mana from going negative to hide that mana scamming is possible
        // This is a temporary solution, recent changes that made it possible to use mana gained
        // from manasteal also broke the mana scamming prevention. so hiding that it's possible will
        // have to do for now
        if (!prediction) {
          effectState.casterUnit.mana = Math.max(0, effectState.casterUnit.mana);
        }
        effectState.spellCostTally = spellCostTally;
      }
      // Reset quantity once a card is cast
      quantity = 1;
    }

    if (!prediction) {
      // Clear spell animations once all cards are done playing their animations
      containerSpells?.removeChildren();
    }

    stopAndDestroyForeverEmitter(castingParticleEmitter);
    if (!prediction && casterPlayer) {
      // We should only progress the game state if the caster is a player.
      // AI handles progress game state at the end of each entire NPC Turn.
      await this.progressGameState();
    }
    // Update card badges after casting
    if (!prediction) {
      CardUI.updateCardBadges(this);
    }
    // Spell may have pulled a soul-having corpse toward a goru player
    if (casterPlayer) {
      tryCollectSouls(casterPlayer, this, prediction);
    }
    return effectState;
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
  findIdenticalUnit(current: Unit.IUnit, potentialMatches: Unit.IUnitSerialized[]): Unit.IUnitSerialized | undefined {
    return potentialMatches.find(p => this.unitIsIdentical(current, p));
  }
  unitIsIdentical(unit: Unit.IUnit, serialized: Unit.IUnitSerialized): boolean {
    return unit.id == serialized.id && unit.unitSourceId == serialized.unitSourceId;
  }
  syncUnits(units: Unit.IUnitSerialized[], isClientSourceOfTruthForOwnUnit: boolean = false) {
    // Remove units flagged for removal before syncing
    this.units = this.units.filter(u => !u.flaggedForRemoval);

    log.client('sync: Syncing units', units.map(u => u.id), 'current units:', this.units.map(u => u.id));
    // Report detected duplicate id:
    this.units.forEach((unit, index) => {
      if (this.units.findIndex(u => u.id == unit.id) !== index) {
        console.log('Duplicate unit id in: ', this.units.map(u => `${u.id}:${u.unitSourceId}`))
        console.log('Syncing to: ', units.map(u => `${u.id}:${u.unitSourceId}`))
        console.error('Duplicate unit id detected in units array', unit.unitSourceId);
      }
    });


    // Get sync actions:
    const actions = getSyncActions(this.units, units, this.findIdenticalUnit.bind(this), (u) => u.unitType == UnitType.PLAYER_CONTROLLED)
    for (let [current, serialized] of actions.sync) {
      // During some syncs we don't want to overwrite *all* attributes of the current client's player unit
      const doKeepOwnUnitStats = isClientSourceOfTruthForOwnUnit && !globalThis.headless && globalThis.player && current == globalThis.player.unit;
      const { x, y } = current;

      // Note: Unit.syncronize maintains the player.unit reference
      Unit.syncronize(serialized, current);

      if (doKeepOwnUnitStats) {
        // Do not sync own client's player unit when player unit is the
        // source of truth
        current.x = x;
        current.y = y;
      }
    }
    for (let remove of actions.remove) {
      Unit.cleanup(remove);
    }
    for (let serializedUnit of actions.create) {
      const newUnit = Unit.load(serializedUnit, this, false);
      Unit.returnToDefaultSprite(newUnit);
    }
    for (let sendToServer of actions.skippedRemoval) {
      // TODO send to server
      console.error('TODO: player unit is missing on server, client should send player unit to server')
    }

    // Remove units that were just cleaned up
    this.units = this.units.filter(u => !u.flaggedForRemoval);

  }
  // Sends what this player is thinking to other clients
  // Optimized to only send if message has changed
  sendPlayerThinking(thoughts: { target?: Vec2, cardIds: string[] }) {
    sendPlayerThinkingThrottled(thoughts, this);
  }
  syncPlayers(syncFromPlayers: Player.IPlayerSerialized[], isClientPlayerSourceOfTruth: boolean) {
    console.log('sync: Syncing players', JSON.stringify(syncFromPlayers.map(p => p.playerId)), 'overriding: ', JSON.stringify(this.players.map(p => p.playerId)));
    // Clear previous players array
    const previousPlayersLength = this.players.length;
    syncFromPlayers.forEach((p, i) => Player.load(p, i, this, isClientPlayerSourceOfTruth));
    if (syncFromPlayers.length < previousPlayersLength) {
      console.error('Unexpected, syncPlayers: loaded players array is smaller');
      this.players.splice(syncFromPlayers.length);
    }
    if (syncFromPlayers.length > this.players.length) {
      console.error('Unexpected, syncPlayers: loaded players array is LARGER');
      ensureAllClientsHaveAssociatedPlayers(this.overworld, syncFromPlayers.map(p => p.clientId), syncFromPlayers.map(p => p.name), true)
    }
    if (globalThis.player?.isSpawned) {
      // If player is already spawned, clear spawn instructions
      if (elInstructions) {
        elInstructions.innerText = '';
      }
    }
    // Sync inventory now that players have loaded
    CardUI.syncInventory(undefined, this);
    // Update toolbar
    CardUI.recalcPositionForCards(globalThis.player, this);
    Player.syncLobby(this);
  }
  pickupIsIdentical(pickup: Pickup.IPickup, serialized: Pickup.IPickupSerialized): boolean {
    return pickup.id == serialized.id && pickup.name == serialized.name;
  }
  syncPickups(pickups: Pickup.IPickupSerialized[]) {
    // Remove pickups flagged for removal before syncing
    this.pickups = this.pickups.filter(p => !p.flaggedForRemoval);
    log.client('sync: Syncing pickups', pickups.map(u => `${u.id}:${u.flaggedForRemoval}`), 'current pickups:', this.pickups.map(u => `${u.id}:${u.flaggedForRemoval}`));

    // Sync pickups by id. This is critical that pickups are synced this way unlike how units are synced
    // because of underworld.aquirePickupQueue, sometimes pickups will be aquired after a timeout which means
    // the ids of the pickups must stick around and should not be removed just because they're not in the serialized
    // pickups array (so long as they are also in the aquirePickupQueue array).
    // Get sync actions:
    const actions = getSyncActions(this.pickups, pickups,
      (p, matches) => matches.find(m => this.pickupIsIdentical(p, m)),
      // Exclude pickups that are about to be aquired via the queue
      (p) => !!this.aquirePickupQueue.find(ap => ap.pickupId == p.id));
    for (let [current, serialized] of actions.sync) {
      const { x, y, radius, inLiquid, immovable, beingPushed, playerOnly, turnsLeftToGrab, flaggedForRemoval } = serialized;
      Object.assign(current, { x, y, radius, inLiquid, immovable, beingPushed, playerOnly, turnsLeftToGrab, flaggedForRemoval });
    }
    for (let remove of actions.remove) {
      Pickup.removePickup(remove, this, false);
    }
    // Remove pickups flagged for removal before creating new ones so you don't have id collisions
    this.pickups = this.pickups.filter(p => !p.flaggedForRemoval);
    // Create pickups that are missing
    for (let serializedPickup of actions.create) {
      Pickup.load(serializedPickup, this, false);
    }
  }

  // Create a hash from the gamestate.  Useful for determining if
  // clients have desynced.
  // hash() {
  //   const state = this.serializeForHash();
  //   const hashResult = hash(state);
  //   console.log(`hash - ${ hashResult }: `, JSON.stringify(state));
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
      unitsPrediction, pickupsPrediction, particleFollowers, forceMove, triggerGameLoopHeadless, _gameLoopHeadless,
      awaitForceMoves, queueGameLoop, gameLoop, gameLoopForceMove, gameLoopUnit,
      removeEventListeners, companions, ...rest } = this;
    return {
      ...rest,
      // isRestarting is an id for SetTimeout and cannot be serialized
      isRestarting: undefined,
      // simulatingMovePredictions should never be serialized, it is only for a running instance to keep track of if the simulateRunForceMovePredictions is running
      simulatingMovePredictions: false,
      // forceMove should never be serialized
      forceMove: [],
      players: this.players.map(Player.serialize),
      units: this.units.filter(u => !u.flaggedForRemoval).map(Unit.serialize),
      pickups: this.pickups.filter(p => !p.flaggedForRemoval).map(Pickup.serialize),
      // the state of the Random Number Generator
      RNGState: this.random.state(),
    };
  }
  updateAccessibilityOutlines() {
    this.units.forEach(u => Unit.updateAccessibilityOutline(u, false));
    this.companions.forEach(c => {
      if (globalThis.accessibilityOutline) {
        if (!c.image.sprite.filters) {
          c.image.sprite.filters = [];
        }
        const outlineSettings = globalThis.accessibilityOutline[Faction.ALLY]['regular'];
        let outlineFilter: OutlineFilter | undefined;
        // @ts-ignore __proto__ is not typed
        outlineFilter = c.image.sprite.filters.find(f => f.__proto__ == OutlineFilter.prototype)
        if (outlineFilter) {
          if (outlineSettings.thickness) {
            // +1 because I want the thickness to be between 2-5 because one is way to pencil thin and looks bad
            outlineFilter.thickness = outlineSettings.thickness + 1;
            outlineFilter.color = outlineSettings.color;
          } else {
            // If thickness is 0, remove the filter:
            c.image.sprite.filters = c.image.sprite.filters.filter(x => x !== outlineFilter);
          }
        } else {
          // Only add the filter if thickness is not 0
          if (outlineSettings.thickness) {
            outlineFilter = new OutlineFilter(outlineSettings.thickness, outlineSettings.color, 0.1);
            c.image.sprite.filters.push(outlineFilter);
          }
        }
      }
    })
    this.setContainerUnitsFilter();
  }
  setContainerUnitsFilter() {
    let isUsingManualUnitOutlines = false;
    try {
      (Object.values(globalThis.accessibilityOutline || {})).forEach(x => {
        for (let type of ['targeted', 'outOfRange', 'regular']) {
          // @ts-ignore
          if (x[type].thickness !== 0) {
            isUsingManualUnitOutlines = true;
            break;
          }
        }
      })
    } catch (e) {
      console.error('Unexpected error evaluating accessibilityOutlines');
    }

    if (containerUnits) {
      if (isUsingManualUnitOutlines) {
        // Disable container unit outlines since outlines are
        //being manually managed
        containerUnits.filters = [];
      } else {
        // Default to container unit outlines
        const outlineFilter = new OutlineFilter(2, 0x000000, 0.1);
        containerUnits.filters = [outlineFilter];
        globalThis.unitOutlineFilter = outlineFilter;
      }
    }
  }
  // This array remains in the same order for a given player in a given game
  getShuffledRunesForPlayer(player?: Player.IPlayer): ({ key: string } & Cards.Modifiers)[] {
    let listOfRemainingRunesToChoose = Object.entries(Cards.allModifiers).flatMap(([key, modifier]) => {
      if (player && modifier.omitForWizardType?.includes(player.wizardType)) {
        return [];
      }
      if (modifier._costPerUpgrade && !modifier.constant) {
        return [{ key, ...modifier }];
      } else {
        return [];
      }
    });
    const shuffledRunes = shuffle([...listOfRemainingRunesToChoose], seedrandom(getUniqueSeedStringPerPlayer(this, player)));
    return shuffledRunes;

  }
  battleLog(happening: string, englishOnly: boolean = true) {
    if (englishOnly && getChosenLanguageCode() !== 'en') {
      return;
    }
    this._battleLog.push(happening);
  }
}

type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type UnderworldNonFunctionProperties = Exclude<NonFunctionPropertyNames<Underworld>, null | undefined>;
export type IUnderworldSerialized = Omit<Pick<Underworld, UnderworldNonFunctionProperties>, "pie" | "overworld" | "prototype" | "players" | "units"
  | "unitsPrediction" | "pickups" | "pickupsPrediction" | "random" | "turnInterval" | "liquidSprites"
  | "particleFollowers" | "companions"
  // walls and pathingPolygons are omitted because they are derived from obstacles when cacheWalls() in invoked
  | "walls" | "pathingPolygons" | "triggerGameLoopHeadless" | "_gameLoopHeadless" | "awaitForceMoves" | "queueGameLoop" | "gameLoop" | "gameLoopForceMove" | "gameLoopUnit"
  | "removeEventListeners"> & {
    players: Player.IPlayerSerialized[],
    units: Unit.IUnitSerialized[],
    pickups: Pickup.IPickupSerialized[],
  };

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
//     console.log(`level ${ i }`, sums);
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
//     console.log(`level ${ i }`, sums);
//   }
// }

function getEnemiesForAltitude(underworld: Underworld, levelIndex: number): string[] {
  // Feel: Each level should feel "themed"
  // Requirements
  // - Any level, including starting levels, should have variety
  // - The higher the level number the more types of enemies can spawn
  // - The higher the level number the more amount of enemies can spawn
  //   - But it should consider a budget, for example, lots of high level enemies should mean less low level enemies

  // Prevent negative values which can happen during tutorial
  const adjustedLevelIndex = Math.max(0, levelIndex);

  const numberOfTypesOfEnemies = 2 + Math.floor(adjustedLevelIndex / 2);
  const { unitMinLevelIndexSubtractor, budgetMultiplier: difficultyBudgetMultiplier } = unavailableUntilLevelIndexDifficultyModifier(underworld);
  let possibleUnitsToChoose = Object.values(allUnits)
    .filter(u => u.spawnParams && (u.spawnParams.unavailableUntilLevelIndex - unitMinLevelIndexSubtractor) <= adjustedLevelIndex && u.spawnParams.probability > 0 && isModActive(u, underworld))
    .map(u => ({ id: u.id, probability: u.spawnParams?.probability || 1, budgetCost: u.spawnParams?.budgetCost || 1 }))
  const unitTypes = Array(numberOfTypesOfEnemies).fill(null)
    // flatMap is used to remove any undefineds
    .flatMap(() => {
      const chosenUnitType = chooseObjectWithProbability(possibleUnitsToChoose, underworld.random);
      // Remove chosen Unit type from pick source
      if (chosenUnitType) {
        possibleUnitsToChoose = possibleUnitsToChoose.filter(u => u.id !== chosenUnitType.id);
        return [chosenUnitType]
      }
      return [];
    })
    // Sort by most expensive first
    .sort((a, b) => b.budgetCost - a.budgetCost);
  // Now that we've determined which unit types will be in the level we have to
  // budget out the quantity
  let units = [];
  const baseDifficultyMultiplier = 3;
  const startAcceleratingDifficultyAtLevelIndex = 5;
  const difficultyMultiplier = adjustedLevelIndex >= startAcceleratingDifficultyAtLevelIndex
    ? baseDifficultyMultiplier + adjustedLevelIndex + 1 - startAcceleratingDifficultyAtLevelIndex
    : baseDifficultyMultiplier;
  let budgetLeft = (adjustedLevelIndex + 1) * difficultyMultiplier + 2;
  const connectedClients = underworld.players.filter(p => p.clientConnected);
  if (connectedClients.length > config.NUMBER_OF_PLAYERS_BEFORE_BUDGET_INCREASES) {
    const budgetMultiplier = 1 + (1 / config.NUMBER_OF_PLAYERS_BEFORE_BUDGET_INCREASES) * (connectedClients.length - config.NUMBER_OF_PLAYERS_BEFORE_BUDGET_INCREASES);
    console.log('Difficulty: Increase budget by', budgetMultiplier, ' due to the number of players connected');
    budgetLeft *= budgetMultiplier;
  }
  console.log('Difficulty: Increase budget by', difficultyBudgetMultiplier, ' due to difficulty', underworld.gameMode);
  budgetLeft *= difficultyBudgetMultiplier;
  budgetLeft = Math.floor(budgetLeft);
  console.log('Budget for level index', adjustedLevelIndex, 'is', budgetLeft);
  const totalBudget = budgetLeft;
  // Reduce remaining budget on the last level where Goru will spawn
  if (config.IS_ANNIVERSARY_UPDATE_OUT && levelIndex == config.GORU_LEVEL_INDEX) {
    if (goru.spawnParams) {
      // https://github.com/jdoleary/Spellmasons/issues/168
      // Budgeting system still needs an overhaul

      // This is intentionally commented out, since this 
      // often results in very few enemies and enemy types
      // Goru needs units to support him, being a corpse-based boss without summon capability
      //budgetLeft -= goru.spawnParams?.budgetCost;
    } else {
      console.warn("Goru spawn params unknown, could not modify budget correctly");
    }
  }
  // Reduce remaining budget on the last level where the Deathmason will spawn
  if (levelIndex == config.LAST_LEVEL_INDEX) {
    if (deathmason.spawnParams) {
      budgetLeft -= deathmason.spawnParams?.budgetCost;
    } else {
      console.warn("Deathmason spawn params unknown, could not modify budget correctly");
      budgetLeft /= 2;
    }
  }
  // How we choose:
  // 1. Start with the most expensive unit and random a number between 1 and 50% budget / unit budget cost
  // 2. Keep iterating with other units
  while (budgetLeft > 0) {
    if (unitTypes.length == 0) {
      console.error('No Unit types to pick from')
      break;
    }
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
      const maxNumberOfThisUnit = Math.min(Math.max(levelIndex, 1), Math.floor(totalBudget * 0.7 / chosenUnitType.budgetCost));
      const howMany = randInt(1, maxNumberOfThisUnit, underworld.random);
      for (let i = 0; i < howMany; i++) {
        units.push(chosenUnitType.id);
        budgetLeft -= chosenUnitType.budgetCost;
      }
      if (howMany <= 0) {
        // Prevent infinite loop
        budgetLeft--;
        continue;

      }
    }
  }
  return units;
}

async function introduceBoss(unit: UnitSource, underworld: Underworld, isMiniboss: boolean = false) {
  console.log('[GAME] Spawning Boss: ', unit.id, '\n', unit);
  underworld.hasSpawnedBoss = true;
  const seed = seedrandom(`${getUniqueSeedString(underworld)}-${unit.id}`);
  const coords = underworld.findValidSpawnInWorldBounds(false, seed) || { x: 0, y: 0 };

  // Play boss intro FX
  const elCinematic = unit.id == bossmasonUnitId ? document.getElementById('deathmason-cinematic') : document.getElementById('goru-cinematic');
  if (elCinematic) {
    elCinematic.classList.toggle('show', true);
  }
  playSFXKey(`${unit.id.toLowerCase()}Reveal`);
  // Wait 2 seconds before moving on for the reaveal
  await new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });

  const newBossUnitInstance = underworld.spawnEnemy(unit.id, coords, isMiniboss);
  if (newBossUnitInstance) {
    skyBeam(newBossUnitInstance);

    // We add the Deathmason onDeathEvent here instead of in Deathmason's init()
    // because we only want to add it in this special case/boss sequence
    // and not any other time (I.E. admin/player summoned Deathmasons)
    if (newBossUnitInstance.unitSourceId == bossmasonUnitId) {
      Unit.addEvent(newBossUnitInstance, ORIGINAL_DEATHMASON_DEATH);
    }
  } else {
    console.error("Failed to spawn newBossUnitInstance for id: ", unit.id);
  }

  // Wait again for the players to digest that the boss appeared
  // Remove boss intro FX
  await new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
  if (elCinematic) {
    elCinematic.classList.toggle('show', false);
  }
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
  castForFree?: boolean,
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
let forceMoveResolver: undefined | ((value: void | PromiseLike<void>) => void);