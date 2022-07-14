import type * as PIXI from 'pixi.js';
import * as config from '../config';
import * as Image from '../graphics/Image';
import * as math from '../jmath/math';
import { distance } from '../jmath/math';
import { addPixiSpriteAnimated, containerDoodads, containerUnits, PixiSpriteOptions } from '../graphics/PixiUtils';
import { UnitSubType, UnitType, Faction } from '../types/commonTypes';
import type { Vec2 } from '../jmath/Vec';
import * as Vec from '../jmath/Vec';
import * as CardUI from '../graphics/ui/CardUI';
import Events from '../Events';
import makeAllRedShader from '../graphics/shaders/selected';
import { addLerpable } from '../lerpList';
import { allUnits } from './units';
import { allModifiers, EffectState } from '../cards';
import { checkIfNeedToClearTooltip, clearSpellEffectProjection } from '../graphics/PlanningView';
import { centeredFloatingText } from '../graphics/FloatingText';
import { turn_phase } from '../Underworld';
import combos from '../graphics/AnimationCombos';
import { playSFXKey } from '../Audio';
import { raceTimeout } from '../Promise';

const elHealthBar: HTMLElement = document.querySelector('#health .fill') as HTMLElement;
const elHealthCost: HTMLElement = document.querySelector('#health .cost') as HTMLElement;
const elHealthLabel: HTMLElement = document.querySelector('#health .label') as HTMLElement;
const elManaBar: HTMLElement = document.querySelector('#mana .fill:nth-child(1)') as HTMLElement;
const elManaBar2: HTMLElement = document.querySelector('#mana .fill:nth-child(2)') as HTMLElement;
const elManaBar3: HTMLElement = document.querySelector('#mana .fill:nth-child(3)') as HTMLElement;
const elManaCost: HTMLElement = document.querySelector('#mana .cost:nth-child(4)') as HTMLElement;
const elManaCost2: HTMLElement = document.querySelector('#mana .cost:nth-child(5)') as HTMLElement;
const elManaCost3: HTMLElement = document.querySelector('#mana .cost:nth-child(6)') as HTMLElement;
const elManaLabel: HTMLElement = document.querySelector('#mana .label') as HTMLElement;
const elStaminaBar: HTMLElement = document.querySelector('#stamina .fill') as HTMLElement;
const elStaminaBarLabel: HTMLElement = document.querySelector('#stamina .label') as HTMLElement;

export interface UnitPath {
  points: Vec2[];
  lastOwnPosition: Vec2;
  targetPosition: Vec2;
}
// The serialized version of the interface changes the interface to allow only the data
// that can be serialized in JSON.  It may exclude data that is not neccessary to
// rehydrate the JSON into an entity
export type IUnitSerialized = Omit<IUnit, "resolveDoneMoving" | "image"> & { image?: Image.IImageAnimatedSerialized };
export interface UnitAnimations {
  idle: string;
  hit: string;
  attack: string;
  die: string;
  walk: string;
}
export function isUnit(maybeUnit: any): maybeUnit is IUnit {
  // unitSouceId only belongs to IUnit so it is a safe way to tell
  // TS that the object is a unit.  This WILL fail if another object
  // is given a unitSourceId property
  return maybeUnit.unitSourceId !== undefined;
}
export interface IUnit {
  // A unique id so that units can be identified
  // across the network
  id: number;
  unitSourceId: string;
  x: number;
  y: number;
  path?: UnitPath;
  moveSpeed: number;
  // A resolve callback for when a unit is done moving
  resolveDoneMoving: () => void;
  radius: number;
  stamina: number;
  staminaMax: number;
  attackRange: number;
  name?: string;
  // Strength is a modifier which affects base stats used for scaling difficulty
  strength: number;
  faction: Faction;
  image?: Image.IImageAnimated;
  defaultImagePath: string;
  shaderUniforms: { [key: string]: any };
  damage: number;
  health: number;
  healthMax: number;
  mana: number;
  manaMax: number;
  manaPerTurn: number;
  alive: boolean;
  unitType: UnitType;
  unitSubType: UnitSubType;
  // Doesn't let other units push it
  immovable: boolean;
  // Note: flaggedForRemoval should ONLY be changed in Unit.cleanup
  flaggedForRemoval?: boolean;
  // A list of names that correspond to Events.ts functions
  onDamageEvents: string[];
  onDeathEvents: string[];
  onMoveEvents: string[];
  onAgroEvents: string[];
  onTurnStartEvents: string[];
  onTurnEndEvents: string[];
  animations: UnitAnimations;
  modifiers: {
    [name: string]: {
      isCurse: boolean;
      [key: string]: any;
    };
  };
}
export function create(
  unitSourceId: string,
  x: number,
  y: number,
  faction: Faction,
  defaultImagePath: string,
  unitType: UnitType,
  unitSubType: UnitSubType,
  strength: number,
  sourceUnitProps: Partial<IUnit> = {}
): IUnit {
  const health = Math.round(config.UNIT_BASE_HEALTH * strength);
  const mana = Math.round(config.UNIT_BASE_MANA * strength);
  const staminaMax = config.UNIT_BASE_STAMINA;
  const sourceUnit = allUnits[unitSourceId];
  if (sourceUnit) {
    const unit: IUnit = Object.assign({
      id: ++window.underworld.lastUnitId,
      unitSourceId,
      x,
      y,
      strength,
      radius: config.UNIT_BASE_RADIUS,
      path: undefined,
      moveSpeed: config.UNIT_MOVE_SPEED,
      resolveDoneMoving: () => { },
      stamina: 0,
      staminaMax,
      attackRange: 10 + config.COLLISION_MESH_RADIUS * 2,
      faction,
      image: Image.create({ x, y }, defaultImagePath, containerUnits),
      defaultImagePath,
      shaderUniforms: {},
      damage: Math.round(config.UNIT_BASE_DAMAGE * strength),
      health,
      healthMax: health,
      mana,
      manaMax: mana,
      manaPerTurn: config.MANA_GET_PER_TURN,
      alive: true,
      immovable: false,
      unitType,
      unitSubType,
      onDamageEvents: [],
      onDeathEvents: [],
      onMoveEvents: [],
      onAgroEvents: [],
      onTurnStartEvents: [],
      onTurnEndEvents: [],
      modifiers: {},
      animations: sourceUnit.animations,
    }, sourceUnitProps);

    // Since unit stats can be overridden with sourceUnitProps
    // Ensure that the unit starts will full mana and health
    unit.mana = unit.manaMax;
    unit.health = unit.healthMax;
    if (unit.manaMax === 0) {
      unit.manaPerTurn = 0;
    }
    if (unit.staminaMax === 0) {
      unit.stamina = 0;
    }
    unit.image?.sprite.scale.set(config.NON_HEAVY_UNIT_SCALE);
    if (sourceUnit.init) {
      // Initialize unit IF unit contains initialization function
      sourceUnit.init(unit);
    }
    setupShaders(unit);

    // Ensure all change factions logic applies when a unit is first created
    changeFaction(unit, faction);


    window.underworld.addUnitToArray(unit, false);

    return unit;
  } else {
    throw new Error(`Source unit with id ${unitSourceId} does not exist`);
  }


}
function setupShaders(unit: IUnit) {
  if (unit.image) {
    const all_red = makeAllRedShader()
    unit.shaderUniforms.all_red = all_red.uniforms;
    unit.image.sprite.filters = [all_red.filter];
  }
}

export function addModifier(unit: IUnit, key: string) {
  if (unit.alive) {
    // Call custom modifier's add function
    const modifier = allModifiers[key];
    if (modifier) {
      if (modifier.add) {
        modifier.add(unit);
      } else {
        console.error('No "add" modifier for ', key);
      }
    } else {
      console.error('Modifier ', key, 'never registered.');
    }
  } else {
    console.log(`Ignoring addModifier ${key} for dead unit.  Dead units cannot receive modifiers`);
  }
}

export function removeModifier(unit: IUnit, key: string) {
  const modifier = allModifiers[key];
  if (modifier && modifier.subsprite) {
    Image.removeSubSprite(unit.image, modifier.subsprite.imageName);
  }
  unit.onDamageEvents = unit.onDamageEvents.filter((e) => e !== key);
  unit.onDeathEvents = unit.onDeathEvents.filter((e) => e !== key);
  unit.onMoveEvents = unit.onMoveEvents.filter((e) => e !== key);
  unit.onAgroEvents = unit.onAgroEvents.filter((e) => e !== key);
  unit.onTurnStartEvents = unit.onTurnStartEvents.filter((e) => e !== key);
  unit.onTurnEndEvents = unit.onTurnEndEvents.filter((e) => e !== key);
  delete unit.modifiers[key];

  // Call custom modifier's remove function
  const customRemoveFn = allModifiers[key]?.remove;
  if (customRemoveFn) {
    customRemoveFn(unit);
  }

}

export function cleanup(unit: IUnit) {
  // Resolve done moving on cleanup to ensure that there are no forever-blocking promises
  if (unit.resolveDoneMoving) {
    unit.resolveDoneMoving();
  }
  unit.x = NaN;
  unit.y = NaN;
  unit.flaggedForRemoval = true;
  Image.cleanup(unit.image);
  // Setting the entire image to undefined is important
  // because changeImage rejects replacing an image that is undefined.
  // This ensures that units won't get their image sprite changed while
  // they are waiting to be cleaned up, which could result in a dangling sprite
  unit.image = undefined;
}
// Converts a unit entity into a serialized form
// that can be saved as JSON and rehydrated later into
// a full unit entity (with callbacks, shaderUniforms, etc - the things
// that can't be saved as JSON)
// This is the opposite of load
export function serialize(unit: IUnit): IUnitSerialized {
  // resolveDoneMoving is a callback that cannot be serialized
  const { resolveDoneMoving, ...rest } = unit
  return {
    ...rest,
    // Deep copy path so that the serialized object doesn't share the path object
    path: unit.path ? JSON.parse(JSON.stringify(unit.path)) : undefined,
    image: unit.image ? Image.serialize(unit.image) : undefined,
    // Pick the uniforms needed to rehydrate
    shaderUniforms: Object.entries(unit.shaderUniforms).reduce((obj, cur) => {
      const [key, value] = cur;
      // Pare down shaderUniforms to only the uniforms that the game sets so they
      // can be loaded back in later
      const { filterGlobals, globals, uSampler, ...keep } = value
      obj[key] = { ...keep };
      return obj;
    }, {} as any),
  };
}
// Reinitialize a unit from another unit object
// this is useful when loading game state after reconnect
// This is the opposite of serialize
export function load(unit: IUnitSerialized, prediction: boolean): IUnit {
  const { shaderUniforms, ...restUnit } = unit
  // Since resolveDoneMoving is about to be overwritten,
  // call it, just in case there is a pending promise (there shouldn't be)
  // so the promise doesn't hang forever
  const loadedunit: IUnit = {
    ...restUnit,
    shaderUniforms: {},
    resolveDoneMoving: () => { },
    image: Image.load(unit.image, getParentContainer(unit.alive)),
  };
  setupShaders(loadedunit);
  // Load in shader uniforms by ONLY setting the uniforms that are saved
  // it is important that the other objects stay exactly the same
  // or else the shader won't render
  for (let [key, uniformObject] of Object.entries(shaderUniforms)) {
    for (let [keyUniform, value] of Object.entries(uniformObject)) {
      loadedunit.shaderUniforms[key][keyUniform] = value;
    }
  }
  window.underworld.addUnitToArray(loadedunit, prediction);
  if (!loadedunit.alive) {
    die(loadedunit, prediction);
  }
  return loadedunit;
}
// Similar but not the same as `load`, syncronize updates (mutates) a unit 
// entity with properties from a unit (in JSON)
// mutates originalUnit
export function syncronize(unitSerialized: IUnitSerialized, originalUnit: IUnit): void {
  if (unitSerialized.id !== originalUnit.id) {
    console.warn('Units array is out of order with canonical record. A full unit.sync should correct this issue.')
  }
  // Note: shaderUniforms should not just be "assign"ed into the object because 
  // it requires special handling to have a valid link to the shader
  // and since syncronize is mainly meant to keep things like health and position in sync,
  // I'm choosing just to omit shaderUniforms from syncronize
  const { image, shaderUniforms, ...rest } = unitSerialized;
  if (!image) {
    return
  }
  Object.assign(originalUnit, rest);
  // Note: returnToDefaultSprite must be called BEFORE Image.syncronize
  // to ensure that the originalUnit.image.sprite has a parent because
  // the parent could have been cleared previously.
  // TODO: TEMPORARILY DISABLED: How to keep syncronize from interrupting an animation while it's running
  // returnToDefaultSprite(originalUnit);
  // originalUnit.image = Image.syncronize(image, originalUnit.image);
}
export function changeToDieSprite(unit: IUnit) {
  Image.changeSprite(
    unit.image,
    unit.animations.die,
    containerDoodads,
    // DieSprite intentionally stops animating when it is complete, therefore
    // resolver is undefined, since no promise is waiting for it.
    undefined,
    { loop: false }
  );
}
// It is important to use this function when returning a unit to the previous
// sprite because it takes into account wether or not a unit is dead.  If a unit
// dies mid-animation and this function is not used, it would return to the default
// LIVING sprite, instead of the dead sprite.
export function returnToDefaultSprite(unit: IUnit) {
  // This check for unit.image prevents creating a corpse image when a predictionUnit
  // dies because a prediction unit won't have an image property
  // Only return to default if it is not currently playing an animation, this prevents
  if (unit.image) {
    if (unit.alive) {
      Image.changeSprite(
        unit.image,
        unit.animations.idle,
        containerUnits,
        undefined
      );
    } else {
      changeToDieSprite(unit);
    }
  }
}
export function getParentContainer(alive: boolean): PIXI.Container {
  return alive ? containerUnits : containerDoodads;
}

export function playComboAnimation(unit: IUnit, key: string | undefined, keyMoment?: () => Promise<any>, options?: PixiSpriteOptions): Promise<void> {
  if (!key) {
    console.trace('tried to play missing animation');
    return Promise.resolve();
  }
  // Change animation and change back to default
  // ---
  // This timeout value is arbitrary, meant to prevent and report an await hang
  // if somehow resolve is never called.
  // This raceTimeout may need to be removed because playComboAnimation can have wildly varying execution times becauses it awaits keyMoment
  return raceTimeout(20000, `playComboAnimation: ${key}; note: comboAnimation can have greatly varying execution times due to it awaiting keyMoment`, new Promise<void>((resolve) => {
    if (!unit.image) {
      return resolve();
    }
    const combo = combos[key];
    if (!combo) {
      console.error('Combo data missing for animation with key', key)
      return resolve();
    }
    const finishOnFrame = combo.keyFrame;
    let keyMomentPromise = Promise.resolve();
    // Ensure keyMoment doesn't trigger more than once.
    let keyMomentTriggered = false;

    const tryTriggerKeyMoment = () => {
      if (keyMoment && !keyMomentTriggered) {
        // Note: keyMomentTriggered must be set to true BEFORE the following invokation
        // of keyMoment() and the resolve because there is a potential for the
        // keyMoment to change the sprite of this unit which would try to retrigger
        // the keyMoment immediately which would result in an infinite loop.
        // Placing keyMomentTriggered = true BEFORE prevents this from happening
        // because this function (tryTriggerKeyMoment) checks to ensure that it
        // doesn't trigger it more than once.
        keyMomentTriggered = true;
        // Ensure that if keyMoment hasn't been called yet (because)
        // the animation was interrupted, it is called now
        // A keyMoment should ALWAYS be invoked
        keyMomentPromise = keyMoment().then(() => {
          // resolve resolves the promise that the combo animation returns.
          // The keyMoment is the ultimate arbiter of when the combo animation is done
          // since it usually triggers a projectile or spell that will take longer to
          // finish than the primary animation, so whatever's waiting for the combo animation
          // to finish should wait for the keyMoment rather than any of the other animations
          // that occur in the combo
          resolve();
        });
      }

    }
    const onFrameChange = (finishOnFrame === undefined || keyMoment === undefined) ? undefined : (currentFrame: number) => {
      if (currentFrame >= finishOnFrame && !keyMomentTriggered) {
        // This is when the keyMoment is INTENTED to be triggered: at a specified "finishOnFrame" of the
        // animation
        tryTriggerKeyMoment();
      }

    }
    // Play sound effect
    if (combo.SFX) {
      playSFXKey(combo.SFX)
    }
    Image.changeSprite(unit.image, combo.primaryAnimation, unit.image.sprite.parent,
      // It is expected that the key moment will never be triggered here because if the animation
      // gets all the way to the end to the point where it triggers changeSprite's onComplete
      // which calls this callback, the keyMoment should've already happened; however, since
      // we don't want this promise resolving UNTIL the keyMoment is finished, we'll pipe this
      // through tryTriggerKeyMoment which will eventually call resolve when the keyMoment is finished
      tryTriggerKeyMoment,
      {
        loop: false,
        ...options,
        onFrameChange,
        onComplete: () => {
          returnToDefaultSprite(unit);
        }
      });
    // Note: oneOff animations MUST be added after changeSprite because changeSprite wipes any existing oneOff animations
    // This is how oneOff animations are attached to a primary animation, so if the primary animation ends early, so do
    // the currently playing oneOff animations.
    for (let animPath of combo.companionAnimations) {
      addOneOffAnimation(unit, animPath, options);
    }
  }));
}
export function playAnimation(unit: IUnit, spritePath: string | undefined, options?: PixiSpriteOptions): Promise<void> {
  if (!spritePath) {
    console.trace('tried to play missing animation');
    return Promise.resolve();
  }
  // Change animation and change back to default
  // ---
  // This timeout value is arbitrary, meant to prevent and report an await hang
  // if somehow resolve is never called
  return raceTimeout(6000, `playAnimation: ${spritePath}`, new Promise<void>((resolve) => {
    if (!unit.image) {
      return resolve();
    }

    Image.changeSprite(unit.image, spritePath, unit.image.sprite.parent, resolve, {
      loop: false,
      ...options,
      onComplete: () => {
        returnToDefaultSprite(unit);
        if (options?.onComplete) {
          options.onComplete();
        }
      }
    });
  }));
}
export function addOneOffAnimation(unit: IUnit, spritePath: string, options?: PixiSpriteOptions): Promise<void> {
  // Play animation and then remove it
  // ---
  // This timeout value is arbitrary, meant to prevent and report an await hang
  // if somehow resolve is never called
  return raceTimeout(6000, `addOneOffAnimation: ${spritePath}`, new Promise<void>((resolve) => {
    if (!unit.image) {
      return resolve();
    }
    const animationSprite = addPixiSpriteAnimated(spritePath, unit.image.sprite, {
      loop: false,
      ...options,
      onComplete: () => {
        if (unit.image) {
          unit.image.sprite.removeChild(animationSprite);
        }
        resolve();
      }
    });
    animationSprite.isOneOff = true;
    animationSprite.anchor.set(0.5);
  }));
}

export function resurrect(unit: IUnit) {
  // Return dead units back to full health
  unit.health = unit.healthMax;
  unit.alive = true;
  returnToDefaultSprite(unit);
}
// A list of unit source ids that will produce no corpse when killed
// Useful for decoy (and maybe bosses in the future??)
const noCorpseIds = ['decoy'];
export function die(unit: IUnit, prediction: boolean) {
  if (!unit.alive) {
    // If already dead, do nothing
    return;
  }
  if (noCorpseIds.includes(unit.unitSourceId)) {
    // Remove the unit entirely
    cleanup(unit);
    return;
  } else {
    // Set unit.alive to false, this must come before getParentContainer
    // so it'll know to put the new image in the right container
    unit.alive = false;
    // This check for unit.image prevents creating a corpse image when a predictionUnit
    // dies because a prediction unit won't have an image property
    if (unit.image) {
      changeToDieSprite(unit);
    }
    unit.mana = 0;
    // Ensure that the unit resolvesDoneMoving when they die in the event that 
    // they die while they are moving.  This prevents turn phase from getting stuck
    unit.resolveDoneMoving();

    for (let i = 0; i < unit.onDeathEvents.length; i++) {
      const eventName = unit.onDeathEvents[i];
      if (eventName) {
        const fn = Events.onDeathSource[eventName];
        if (fn) {
          fn(unit, prediction);
        }
      }
    }

    // Remove all modifiers
    // Note: This must come AFTER onDeathEvents or else it will remove the modifier
    // that added the onDeathEvent and the onDeathEvent won't trigger
    for (let [modifier, _modifierProperties] of Object.entries(unit.modifiers)) {
      removeModifier(unit, modifier);
    }
  }

  if (window.player && window.player.unit == unit) {
    clearSpellEffectProjection();
    CardUI.clearSelectedCards();
    centeredFloatingText(`💀 You Died 💀`, 'red');
  }
  // In the event that this unit that just died is the selected unit,
  // this will remove the tooltip:
  checkIfNeedToClearTooltip();
  window.underworld.checkIfShouldSpawnPortal();
}
export function composeOnDamageEvents(unit: IUnit, damage: number, prediction: boolean): number {
  // Compose onDamageEvents
  for (let eventName of unit.onDamageEvents) {
    const fn = Events.onDamageSource[eventName];
    if (fn) {
      // onDamage events can alter the amount of damage taken
      damage = fn(unit, damage, prediction);
    }
  }
  return damage

}
export function takeDamage(unit: IUnit, amount: number, prediction: boolean, _state?: EffectState) {
  amount = composeOnDamageEvents(unit, amount, prediction);
  if (amount == 0) {
    return;
  }
  if (!unit.alive) {
    // Do not deal damage to dead unitsn
    return;
  }
  if (!prediction) {
    console.log(`takeDamage: unit ${unit.id}; amount: ${amount}; events:`, unit.onDamageEvents);
    // Only play hit animation if taking actual damage,
    // note: heals call takeDamage with a negative amount, so we don't want to play a hit animation when
    // player is healed
    if (amount > 0) {
      playAnimation(unit, unit.animations.hit, { loop: false, animationSpeed: 0.2 });
    }
  }
  unit.health -= amount;
  // Prevent health from going over maximum or under 0
  unit.health = Math.max(0, Math.min(unit.health, unit.healthMax));
  // If the unit is actually taking damage (not taking 0 damage or being healed - (negative damage))
  if (!prediction) {
    if (amount > 0) {
      // Use all_red shader to flash the unit to show they are taking damage
      if (unit.shaderUniforms.all_red) {
        unit.shaderUniforms.all_red.alpha = 1;
        addLerpable(unit.shaderUniforms.all_red, "alpha", 0, 200);
      }
    }
  }

  // If taking damage (not healing) and health is 0 or less...
  if (amount > 0 && unit.health <= 0) {
    die(unit, prediction);
  }

}
export function syncPlayerHealthManaUI() {
  if (!(window.player && elHealthBar && elManaBar && elStaminaBar && elHealthLabel && elManaLabel && elStaminaBarLabel)) {
    return
  }
  const unit = window.player.unit;
  const healthRatio = unit.health / unit.healthMax
  // Set the health bar that shows how much health you currently have
  elHealthBar.style["width"] = `${100 * healthRatio}%`;
  elHealthLabel.innerHTML = `${unit.health}/${unit.healthMax}`;

  const predictionPlayerUnit = window.predictionUnits.find(u => u.id == window.player?.unit.id) || { health: unit.health, mana: unit.mana };
  // Set the health cost bar that shows how much health will be removed if the spell is cast
  if (predictionPlayerUnit.health > 0) {
    // Show cost bar from current health location minus whatever it's value is
    elHealthCost.style['left'] = `${100 * predictionPlayerUnit.health / unit.healthMax}%`;
    elHealthCost.style['width'] = `${100 * (unit.health - predictionPlayerUnit.health) / unit.healthMax}%`;
  } else {
    elHealthCost.style['left'] = '100%';
    elHealthCost.style['width'] = '0';
  }

  // Set the 3 mana bars that show how much mana you currently have
  const manaRatio = unit.mana / unit.manaMax;
  elManaBar.style["width"] = `${100 * Math.min(manaRatio, 1)}%`;
  const manaRatio2 = (Math.max(0, unit.mana - unit.manaMax)) / unit.manaMax
  elManaBar2.style["width"] = `${100 * Math.min(manaRatio2, 1)}%`;
  const manaRatio3 = (Math.max(0, unit.mana - unit.manaMax * 2)) / unit.manaMax;
  elManaBar3.style["width"] = `${100 * Math.min(manaRatio3, 1)}%`;
  if (predictionPlayerUnit.mana !== unit.mana) {
    elManaLabel.innerHTML = `${predictionPlayerUnit.mana} Mana Left`;
  } else {
    elManaLabel.innerHTML = `${unit.mana}/${unit.manaMax}`;
  }

  // Set the 3 mana cost bars that show how much mana will be removed if the spell is cast
  if (predictionPlayerUnit.mana > 0) {
    // Show cost bar from current mana location minus whatever it's value is
    elManaCost.style['left'] = `${100 * predictionPlayerUnit.mana / unit.manaMax}%`;
    elManaCost.style['width'] = `${100 * Math.min(((unit.mana - predictionPlayerUnit.mana) / unit.manaMax), 1)}%`;

    elManaCost2.style['left'] = `${100 * (predictionPlayerUnit.mana - unit.manaMax) / unit.manaMax}%`;
    let cost2Left = 100 * (predictionPlayerUnit.mana - unit.manaMax) / unit.manaMax;
    if (cost2Left < 0) {
      elManaBar2.style['left'] = `${cost2Left}%`;
      elManaCost2.style['left'] = `0%`;
    } else {
      elManaBar2.style['left'] = '0%';
      elManaCost2.style['left'] = `${cost2Left}%`;
    }
    elManaCost2.style['width'] = `${100 * Math.min(manaRatio2, 1)}%`;

    let cost3Left = 100 * (predictionPlayerUnit.mana - unit.manaMax * 2) / unit.manaMax;
    if (cost3Left < 0) {
      elManaBar3.style['left'] = `${cost3Left}%`;
      elManaCost3.style['left'] = `0%`;
    } else {
      elManaBar3.style['left'] = '0%';
      elManaCost3.style['left'] = `${cost3Left}%`;
    }
    elManaCost3.style['width'] = `${100 * Math.min(manaRatio3, 1)}%`;
  } else {
    elManaCost.style['left'] = `100%`;
    elManaCost2.style['left'] = `100%`;
    elManaCost3.style['left'] = `100%`;
  }

  const staminaLeft = Math.max(0, Math.round(unit.stamina));
  elStaminaBar.style["width"] = `${100 * (unit.stamina) / unit.staminaMax}%`;
  elStaminaBarLabel.innerHTML = `${staminaLeft}`;
  if (staminaLeft <= 0) {
    // Now that the current player has moved, highlight the "end-turn-btn" to
    // remind them that they need to end their turn before they can move again
    document.querySelector('#end-turn-btn')?.classList.add('highlight');
  } else {
    document.querySelector('#end-turn-btn')?.classList.remove('highlight');

  }
}
export function canMove(unit: IUnit): boolean {
  // Do not move if dead
  if (!unit.alive) {
    console.log("canMove: false - unit is not alive")
    return false;
  }
  // Do not move if already moved
  if (unit.stamina <= 0) {
    console.log("canMove: false - unit has already used all their stamina this turn")
    return false;
  }
  return true;
}
export function livingUnitsInDifferentFaction(unit: IUnit) {
  return window.underworld.units.filter(
    (u) => u.faction !== unit.faction && u.alive,
  );
}
export function livingUnitsInSameFaction(unit: IUnit) {
  // u !== unit excludes self from returning as the closest unit
  return window.underworld.units.filter(
    (u) => u !== unit && u.faction == unit.faction && u.alive,
  );
}
function closestInListOfUnits(
  sourceUnit: IUnit,
  units: IUnit[],
): IUnit | undefined {
  return units.reduce<{ closest: IUnit | undefined; distance: number }>(
    (acc, currentUnitConsidered) => {
      const dist = distance(currentUnitConsidered, sourceUnit);
      if (dist <= acc.distance) {
        return { closest: currentUnitConsidered, distance: dist };
      }
      return acc;
    },
    { closest: undefined, distance: Number.MAX_SAFE_INTEGER },
  ).closest;
}
export function findClosestUnitInDifferentFaction(
  unit: IUnit,
): IUnit | undefined {
  return closestInListOfUnits(unit, livingUnitsInDifferentFaction(unit));
}
export function findClosestUnitInSameFaction(unit: IUnit): IUnit | undefined {
  return closestInListOfUnits(unit, livingUnitsInSameFaction(unit));
}
export function orient(unit: IUnit, faceTarget: Vec2) {
  // Orient; make the sprite face it's enemy
  if (unit.image) {
    if (faceTarget.x > unit.x) {
      // Assuming all units are left facing, if the enemy is to the right, make it right facing
      unit.image.sprite.scale.x = -Math.abs(unit.image.sprite.scale.x);
    } else {
      unit.image.sprite.scale.x = Math.abs(unit.image.sprite.scale.x);

    }
  }

}

// This _ version of moveTowards does not return a promise and is used
// specifically for moving the current player character which does not await 
// movement since they hold RMB to move, the target may be constantly changing
export function _moveTowards(unit: IUnit, target: Vec2) {
  if (!canMove(unit)) {
    console.log('cannot move')
    return
  }
  let coordinates = math.getCoordsAtDistanceTowardsTarget(
    unit,
    target,
    unit.stamina
  );
  // Compose onMoveEvents
  for (let eventName of unit.onMoveEvents) {
    const fn = Events.onMoveSource[eventName];
    if (fn) {
      coordinates = fn(unit, coordinates);
    }
  }
  if (unit.image) {
    Image.changeSprite(
      unit.image,
      unit.animations.walk,
      unit.image.sprite.parent,
      undefined
    );
  }
  orient(unit, target);

  // Set path which will be used in the game loop to actually move the unit
  window.underworld.setPath(unit, Vec.clone(target));
}
// moveTo moves a unit, considering all the in-game blockers
export function moveTowards(unit: IUnit, target: Vec2): Promise<void> {
  if (!canMove(unit)) {
    console.log('cannot move')
    return Promise.resolve();
  }
  _moveTowards(unit, target);
  // 300 + is an arbitrary time buffer to ensure that the raceTimeout
  // doesn't report a false positive if the duration it takes the moveTowards promise
  // to resolve is within a reasonable range
  const timeoutMs = 300 + unit.stamina / unit.moveSpeed;

  return raceTimeout(timeoutMs, `moveTowards; unit.id: ${unit.id}`, new Promise<void>((resolve) => {
    // Set new resolve done moving
    unit.resolveDoneMoving = resolve;
  }).then(() => {
    if (unit.image) {
      // When done moving return to default
      returnToDefaultSprite(unit);
    }
  }));
}

// setLocation, unlike moveTo, simply sets a unit to a coordinate without
// considering in-game blockers or changing any unit flags
// Note: NOT TO BE USED FOR in-game collision-based movement
export function setLocation(unit: IUnit, coordinates: Vec2) {
  // Set state instantly to new position
  unit.x = coordinates.x;
  unit.y = coordinates.y;
  unit.path = undefined;
}
export function changeFaction(unit: IUnit, faction: Faction) {
  unit.faction = faction;
  if (unit.faction === Faction.ALLY) {
    // headband signifies a player ally unit
    // Image.addSubSprite(unit.image, 'headband');
  } else {
    // Image.removeSubSprite(unit.image, 'headband');
  }
}

// syncImage updates a unit's Image to match it's game state
export function syncImage(unit: IUnit) {
  if (unit.image) {
    unit.image.sprite.x = unit.x;
    unit.image.sprite.y = unit.y;
  }
}
export function getImagePathForUnitId(id: string): string {
  return "images/units/" + id + ".png";
}
export function inRange(unit: IUnit, coords: Vec2): boolean {
  return math.distance(unit, coords) <= unit.attackRange;
}

// return boolean signifies if unit should abort their turn
export async function runTurnStartEvents(unit: IUnit, prediction: boolean = false): Promise<boolean> {
  // Note: This must be a for loop instead of a for..of loop
  // so that if one of the onTurnStartEvents modifies the
  // unit's onTurnStartEvents array (for example, after death)
  // this loop will take that into account.
  let abortTurn = false;
  for (let i = 0; i < unit.onTurnStartEvents.length; i++) {
    const eventName = unit.onTurnStartEvents[i];
    if (eventName) {
      const fn = Events.onTurnStartSource[eventName];
      if (fn) {
        const shouldAbortTurn = await fn(unit, prediction);
        // Only change abort turn from false to true,
        // never from turn to false because if any one
        // of the turn start events needs the unit to abort
        // their turn, the turn should abort, regardless of
        // the other events
        if (shouldAbortTurn) {
          abortTurn = true;
        }
      } else {
        console.error('No function associated with turn start event', eventName);
      }
    } else {
      console.error('No turn start event at index', i)
    }
  }
  return abortTurn

}
// Makes a copy of the unit's data suitable for 
// a predictionUnit
export function copyForPredictionUnit(u: IUnit): IUnit {
  // Ensure that units have a path before they are copied
  // so that the prediction unit will have a reference to
  // a real path object
  if (!u.path) {
    const target = window.underworld.getUnitAttackTarget(u);
    if (target) {
      window.underworld.setPath(u, target);
    }
  }
  const { image, resolveDoneMoving, modifiers, ...rest } = u;
  return {
    ...rest,
    // prediction units INTENTIONALLY share a reference to the original
    // unit's path so that we can get the efficiency gains of
    // cached paths per unit.  If we made a deep copy instead, the
    // prediction unit would cache-miss each time it was recreated
    // and needed a path
    path: rest.path,
    // Prediction units should have full stamina because they will
    // when it is their turn
    stamina: rest.staminaMax,
    onDamageEvents: [...rest.onDamageEvents],
    onDeathEvents: [...rest.onDeathEvents],
    onMoveEvents: [...rest.onMoveEvents],
    onAgroEvents: [...rest.onAgroEvents],
    onTurnStartEvents: [...rest.onTurnStartEvents],
    onTurnEndEvents: [...rest.onTurnEndEvents],
    // Deep copy modifiers so it doesn't mutate the unit's actual modifiers object
    modifiers: JSON.parse(JSON.stringify(modifiers)),
    shaderUniforms: {},
    resolveDoneMoving: () => { }
  };

}

// Returns true if it is currently this unit's turn phase
export function isUnitsTurnPhase(unit: IUnit): boolean {
  const { turn_phase: phase } = window.underworld;
  if (unit.unitType == UnitType.PLAYER_CONTROLLED) {
    return phase == turn_phase.PlayerTurns;
  } else {
    if (unit.faction == Faction.ALLY) {
      return phase == turn_phase.NPC_ALLY;
    } else {
      return phase == turn_phase.NPC_ENEMY;
    }
  }
}