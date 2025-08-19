import * as config from './config';
import * as Unit from './entity/Unit';
import * as units from './entity/units';
import * as Player from './entity/Player';
import * as Projectile from './entity/Projectile';
import * as Type from './entity/Type';
import * as Pickup from './entity/Pickup';
import * as Obstacle from './entity/Obstacle';
import * as rangedAction from './entity/units/actions/rangedAction';
import * as meleeAction from './entity/units/actions/meleeAction';
import * as Angle from './jmath/Angle';
import * as ArrayUtil from './jmath/ArrayUtil';
import * as Easing from './jmath/Easing';
import * as lineSegment from './jmath/lineSegment';
import * as math from './jmath/math';
import * as moveWithCollision from './jmath/moveWithCollision';
import * as Pathfinding from './jmath/Pathfinding';
import * as Polygon2 from './jmath/Polygon2';
import * as rand from './jmath/rand';
import * as Rect from './jmath/Rect';
import * as Vec from './jmath/Vec';


import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import * as AnimationCombos from './graphics/AnimationCombos';
import * as FloatingText from './graphics/FloatingText';
import * as JImage from './graphics/Image';
import * as ImmediateModeSprites from './graphics/ImmediateModeSprites';
import * as JpromptAll from './graphics/Jprompt';
import * as ParticleCollection from './graphics/ParticleCollection';
import * as Particles from './graphics/Particles';
import * as PixiUtils from './graphics/PixiUtils';
import * as PlanningView from './graphics/PlanningView';
import * as CardUI from './graphics/ui/CardUI';
import * as colors from './graphics/ui/colors';
import * as colorUtil from './graphics/ui/colorUtil';
import * as eventListeners from './graphics/ui/eventListeners';
import * as keyMapping from './graphics/ui/keyMapping';
import * as JAudio from './Audio';
import * as VisualEffects from './VisualEffects';

import * as inLiquid from './inLiquid';
import * as LiquidPools from './LiquidPools';
import * as modifierSummonerSickness from './modifierSummoningSickness';
import * as Overworld from './Overworld';
import * as PlayerUtils from './PlayerUtils';
import * as JPromise from './Promise';
import * as storage from './storage';
import * as Subsprites from './Subsprites';
import * as Underworld from './Underworld';
import * as cardUtils from './cards/cardUtils';
import * as cards from './cards/index';
import * as Upgrade from './Upgrade';
import * as cardsUtil from './cards/util';
import * as Events from './Events';
import { forcePushTowards, forcePushAwayFrom, forcePushToDestination, forcePushDelta } from './effects/force_move';
import * as EffectsHeal from './effects/heal'
import * as explode from "./effects/explode";

import * as commonTypes from './types/commonTypes';
import * as particleEmitter from 'jdoleary-fork-pixi-particle-emitter'
import * as Arrow from "./cards/arrow"
import * as Purify from "./cards/purify"
import { handmadeMaps } from './MapsHandmade';


const SpellmasonsAPI = {
  Angle,
  AnimationCombos,
  ArrayUtil,
  Arrow,
  cards,
  cardsUtil,
  CardUI,
  cardUtils,
  colors,
  colorUtil,
  commonTypes, // Includes enums which are not just types
  config,
  Easing,
  eventListeners,
  Events,
  explode,
  FloatingText,
  forcePushDelta,
  forcePushTowards,
  forcePushAwayFrom,
  forcePushToDestination,
  EffectsHeal,
  handmadeMaps,
  ImmediateModeSprites,
  inLiquid,
  JAudio,
  JImage,
  JPromise,
  JpromptAll,
  keyMapping,
  lineSegment,
  LiquidPools,
  math,
  meleeAction,
  modifierSummonerSickness,
  moveWithCollision,
  MultiColorReplaceFilter,
  Overworld,
  Obstacle,
  ParticleCollection,
  particleEmitter,
  Particles,
  Pathfinding,
  Pickup,
  PixiUtils,
  PlanningView,
  Player,
  PlayerUtils,
  Polygon2,
  Projectile,
  Purify,
  rand,
  rangedAction,
  Rect,
  storage,
  Subsprites,
  Type,
  Underworld,
  Unit,
  units,
  Upgrade,
  Vec,
  VisualEffects,
}
globalThis.SpellmasonsAPI = SpellmasonsAPI;
export default SpellmasonsAPI;