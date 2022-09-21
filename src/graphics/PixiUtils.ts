import type * as PIXI from 'pixi.js';
import { clone, equal, getAngleBetweenVec2sYInverted, Vec2 } from '../jmath/Vec';
import { View } from '../views';
import * as math from '../jmath/math';
import * as config from '../config';
import { keyDown } from './ui/eventListeners';
import * as colors from './ui/colors';
import { JSpriteAnimated } from './Image';
import { containerParticles } from './Particles';
import { elPIXIHolder } from './FloatingText';
import Underworld, { Biome } from '../Underworld';
import { randFloat, randInt } from '../jmath/rand';
import { IUnit } from '../entity/Unit';
import { addMarginToRect, isWithinRect, Rect } from '../jmath/Rect';
import { inPortal } from '../entity/Player';

// if PIXI is finished setting up
let isReady = false;
// Ensure textures stay pixelated when scaled:
if (globalThis.pixi) {
  // Copied from pixi.js so pixi.js wont have to be imported in headless
  enum SCALE_MODES {
    NEAREST = 0,
    LINEAR = 1
  }
  globalThis.pixi.settings.SCALE_MODE = SCALE_MODES.NEAREST;
}
// PIXI app
export const app = !globalThis.pixi ? undefined : new globalThis.pixi.Application();
export const containerLiquid = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerBoard = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerBloodSmear = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerRadiusUI = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerPlanningView = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerDoodads = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerUnits = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerSpells = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerProjectiles = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerUI = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerPlayerThinking = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerUIFixed = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerFloatingText = !globalThis.pixi ? undefined : new globalThis.pixi.Container();


export const graphicsBloodSmear = !globalThis.pixi ? undefined : new globalThis.pixi.Graphics();
if (containerBloodSmear && graphicsBloodSmear) {
  containerBloodSmear.addChild(graphicsBloodSmear);
  containerBloodSmear.alpha = 0.5;
}
export const containerBloodParticles = !globalThis.pixi ? undefined : new globalThis.pixi.ParticleContainer();
if (containerBloodSmear && containerBloodParticles) {
  containerBloodSmear.addChild(containerBloodParticles);
}
let updateLiquidFilterIntervalId: NodeJS.Timer | undefined;
// Setup animated liquid displacement
export function setupLiquidFilter() {
  if (containerLiquid) {
    if (globalThis.pixi) {
      const displacementSprite = globalThis.pixi.Sprite.from('images/noise.png');
      displacementSprite.texture.baseTexture.wrapMode = globalThis.pixi.WRAP_MODES.REPEAT;

      const displacementFilter = new globalThis.pixi.filters.DisplacementFilter(displacementSprite);

      displacementSprite.scale.y = config.LIQUID_DISPLACEMENT_SCALE;
      displacementSprite.scale.x = config.LIQUID_DISPLACEMENT_SCALE;
      containerLiquid.addChild(displacementSprite);
      containerLiquid.filters = [displacementFilter];
      updateLiquidFilterIntervalId = setInterval(() => {
        displacementSprite.x += config.LIQUID_DISPLACEMENT_SPEED;
      }, 10)
    }
  }
}
export function cleanUpLiquidFilter() {
  // Note: cleanup only needs to clear the interval, the rest is cleaned up
  // when containerLiquid.removeChildren() is called on level cleanup
  if (updateLiquidFilterIntervalId !== undefined) {
    clearInterval(updateLiquidFilterIntervalId)
  }
}

export function resizePixi() {
  // Headless does not use graphics
  if (globalThis.headless) { return; }
  if (app) {
    app.renderer.resize(globalThis.innerWidth, globalThis.innerHeight);
  }
}
interface UtilProps {
  underworldPixiContainers: PIXI.Container[] | undefined;
  elPIXIHolder: HTMLElement | undefined;
  elCardHoldersBorder: HTMLElement | undefined;
  elCardHand: HTMLElement | undefined;
  elCardHoldersInner: HTMLElement | undefined;
  camera: Vec2;
  doCameraAutoFollow: boolean;
}
const utilProps: UtilProps = {
  underworldPixiContainers: undefined,
  elPIXIHolder: undefined,
  elCardHoldersBorder: undefined,
  elCardHand: undefined,
  elCardHoldersInner: undefined,
  camera: { x: 0, y: 0 },
  // True if camera should auto follow player unit
  doCameraAutoFollow: true,
}
// debug: Draw caves
if (globalThis.pixi && containerUI && app && containerRadiusUI) {
  globalThis.debugCave = new globalThis.pixi.Graphics();
  containerUI.addChild(globalThis.debugCave);
  globalThis.devDebugGraphics = new globalThis.pixi.Graphics();
  globalThis.devDebugGraphics.lineStyle(3, 0x0000ff, 1.0);
  containerUI.addChild(globalThis.devDebugGraphics);

  if (
    containerLiquid &&
    containerBoard &&
    containerBloodSmear &&
    containerRadiusUI &&
    containerPlanningView &&
    containerDoodads &&
    containerUnits &&
    containerSpells &&
    containerProjectiles &&
    containerPlayerThinking &&
    containerParticles &&
    containerUI &&
    containerUIFixed &&
    containerFloatingText
  ) {

    utilProps.underworldPixiContainers = [
      containerLiquid,
      containerBoard,
      containerBloodSmear,
      containerRadiusUI,
      containerPlanningView,
      containerDoodads,
      containerUnits,
      containerSpells,
      containerProjectiles,
      containerPlayerThinking,
      containerParticles,
      containerUI,
      containerUIFixed,
      containerFloatingText,
    ];
  }

  utilProps.elPIXIHolder = document.getElementById('PIXI-holder') as (HTMLElement | undefined);
  utilProps.elCardHoldersBorder = document.getElementById('card-holders-border') as (HTMLElement | undefined);
  utilProps.elCardHand = document.getElementById('card-hand') as (HTMLElement | undefined);
  utilProps.elCardHoldersInner = document.getElementById('card-holders-inner') as (HTMLElement | undefined);
  globalThis.debugGraphics = new globalThis.pixi.Graphics();
  containerUI.addChild(globalThis.debugGraphics);
  globalThis.unitOverlayGraphics = new globalThis.pixi.Graphics();
  containerUI.addChild(globalThis.unitOverlayGraphics);
  globalThis.walkPathGraphics = new globalThis.pixi.Graphics();
  containerUI.addChild(globalThis.walkPathGraphics);
  globalThis.thinkingPlayerGraphics = new globalThis.pixi.Graphics();
  globalThis.radiusGraphics = new globalThis.pixi.Graphics();
  const colorMatrix = new globalThis.pixi.filters.AlphaFilter();
  colorMatrix.alpha = 0.2;
  globalThis.radiusGraphics.filters = [colorMatrix];
  containerRadiusUI.addChild(globalThis.radiusGraphics);



  globalThis.addEventListener('resize', resizePixi);
  globalThis.addEventListener('load', () => {
    resizePixi();
  });

}
export function setAbyssColor(biome: Biome) {
  if (app) {
    app.renderer.backgroundColor = colors.abyss[biome];
  }

}
function UIElementToInGameSpace(el: HTMLElement, pixiHolderRect: Rect, camX: number, camY: number, zoom: number): Rect {
  const elRect = el.getBoundingClientRect();
  const box = {
    top: (elRect.top - pixiHolderRect.top + camY) / zoom,
    bottom: (elRect.bottom - pixiHolderRect.top + camY) / zoom,
    right: (elRect.right + camX) / zoom,
    left: (elRect.left + camX) / zoom
  }
  // Debug draw
  // globalThis.unitOverlayGraphics?.lineStyle(4, 0xcb00f5, 1.0);
  // globalThis.unitOverlayGraphics?.drawRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
  return box;

}
// withinCameraBounds takes a Vec2 (in game space) and returns a 
// Vec2 that is within the bounds of the camera so that it will 
// surely be seen by a user even if they have panned away.
// Used for attention markers and pings
export function withinCameraBounds(position: Vec2, marginHoriz?: number): Vec2 {
  // Headless does not use graphics
  if (globalThis.headless) { return { x: 0, y: 0 }; }
  if (!(utilProps.elCardHoldersBorder && utilProps.elPIXIHolder)) {
    // If headless, the return of this function is irrelevant
    return { x: 0, y: 0 }
  }
  const pixiHolderRect = utilProps.elPIXIHolder.getBoundingClientRect();
  const { x: camX, y: camY, zoom } = getCamera();
  // Determine bounds
  const margin = (marginHoriz !== undefined ? marginHoriz : 30) / zoom;
  const marginTop = 45 / zoom;
  const marginBottom = 45 / zoom;
  const left = margin + camX / zoom;
  const right = globalThis.innerWidth / zoom - margin + camX / zoom;
  const top = marginTop + camY / zoom;
  const bottom = utilProps.elPIXIHolder.clientHeight / zoom - marginBottom + camY / zoom;

  // Debug draw camera limit
  // globalThis.unitOverlayGraphics.lineStyle(4, 0xcb00f5, 1.0);
  // globalThis.unitOverlayGraphics.moveTo(left, top);
  // globalThis.unitOverlayGraphics.lineTo(right, top);
  // globalThis.unitOverlayGraphics.lineTo(right, bottom);
  // globalThis.unitOverlayGraphics.lineTo(left, bottom);
  // globalThis.unitOverlayGraphics.lineTo(left, top);

  // Keep inside bounds of camera
  const withinBoundsPos: Vec2 = {
    x: Math.min(Math.max(left, position.x), right),
    y: Math.min(Math.max(top, position.y), bottom)
  }
  // globalThis.unitOverlayGraphics.drawCircle(camX / zoom, camY / zoom, 4);
  // globalThis.unitOverlayGraphics.drawCircle(cardHandRight, cardHandTop, 8);

  // Don't let the attention marker get obscured by the UI element
  const cardHoldersBorderBox = UIElementToInGameSpace(utilProps.elCardHoldersBorder, pixiHolderRect, camX, camY, zoom);
  // Move the position if it is obscured by the card-holder
  if (isWithinRect({ x: withinBoundsPos.x - margin, y: withinBoundsPos.y }, cardHoldersBorderBox) || isWithinRect({ x: withinBoundsPos.x + margin, y: withinBoundsPos.y }, cardHoldersBorderBox)) {
    withinBoundsPos.y = cardHoldersBorderBox.top - marginTop;
  }
  return withinBoundsPos;
}

// Used for moving the camera with middle mouse button (like in Dota2)
export function moveCamera(x: number, y: number) {
  utilProps.camera.x += x;
  utilProps.camera.y += y;
}

export function isCameraAutoFollowing(): boolean {
  return utilProps.doCameraAutoFollow;
}
export function cameraAutoFollow(active: boolean) {
  utilProps.doCameraAutoFollow = active;
  document.body?.classList.toggle('auto-camera', active);
}
export function getCamera() {
  return {
    x: !app ? 0 : -app.stage.x,
    y: !app ? 0 : -app.stage.y,
    zoom: calculateCameraZoom(),
  }
}
function calculateCameraZoom() {

  return !app ? 0 : app.stage.scale.x + ((globalThis.zoomTarget || 1) - app.stage.scale.x) / 8;
}
export function setCameraToMapCenter(underworld: Underworld) {
  // Set camera to the center of the map
  utilProps.camera = { x: (underworld.limits.xMax - underworld.limits.xMin) / 2, y: (underworld.limits.yMax - underworld.limits.yMin) / 2 };
}
let lastZoom = globalThis.zoomTarget;
export function updateCameraPosition(underworld: Underworld) {
  // Headless does not use graphics
  if (globalThis.headless) { return; }
  if (!(app)) {
    return
  }

  // Lerp zoom to target
  // Note: This must happen BEFORE the stage x and y is updated
  // or else it will get jumpy when zooming
  const zoom = calculateCameraZoom();

  app.stage.scale.x = zoom;
  app.stage.scale.y = zoom;

  switch (globalThis.view) {
    case View.Game:
      if (globalThis.player) {
        if (utilProps.doCameraAutoFollow) {
          if (!inPortal(globalThis.player) && globalThis.player.unit.alive) {
            // Follow current client player
            utilProps.camera = clone(globalThis.player.unit);
          } else {
            setCameraToMapCenter(underworld);
          }
        }
        // Allow camera movement via WSAD
        if (keyDown.w) {
          utilProps.camera.y -= config.CAMERA_BASE_SPEED;
        }
        if (keyDown.s) {
          utilProps.camera.y += config.CAMERA_BASE_SPEED;
        }
        if (keyDown.d) {
          utilProps.camera.x += config.CAMERA_BASE_SPEED;
        }
        if (keyDown.a) {
          utilProps.camera.x -= config.CAMERA_BASE_SPEED;
        }
        // Clamp centerTarget so that there isn't a lot of empty space
        // in the camera if the camera is in auto follow mode
        if (utilProps.doCameraAutoFollow) {
          // Users can move the camera further if they are manually controlling the camera
          // whereas if the camera is following a target it keeps more of the map on screen
          const marginY = config.COLLISION_MESH_RADIUS * 4;
          const marginX = config.COLLISION_MESH_RADIUS * 4;
          // Clamp camera X
          const mapLeftMostPoint = 0 - marginX;
          const mapRightMostPoint = underworld.limits.xMax + marginX;
          const camCenterXMin = mapLeftMostPoint + elPIXIHolder.clientWidth / 2 / zoom;
          const camCenterXMax = mapRightMostPoint - elPIXIHolder.clientWidth / 2 / zoom;
          // If the supposed minimum is more than the maximum, just center the camera:
          if (camCenterXMin > camCenterXMax) {
            utilProps.camera.x = (mapRightMostPoint + mapLeftMostPoint) / 2;
          } else {
            // clamp the camera x between the min and max possible camera targets
            utilProps.camera.x = Math.min(camCenterXMax, Math.max(camCenterXMin, utilProps.camera.x));
          }

          //Clamp camera Y
          const mapTopMostPoint = 0 - marginY;
          const mapBottomMostPoint = underworld.limits.yMax + marginY;
          const camCenterYMin = mapTopMostPoint + elPIXIHolder.clientHeight / 2 / zoom;
          const camCenterYMax = mapBottomMostPoint - elPIXIHolder.clientHeight / 2 / zoom;
          // If the supposed minimum is more than the maximum, just center the camera:
          if (camCenterYMin > camCenterYMax) {
            utilProps.camera.y = (mapBottomMostPoint + mapTopMostPoint) / 2;
          } else {
            // clamp the camera x between the min and max possible camera targets
            utilProps.camera.y = Math.min(camCenterYMax, Math.max(camCenterYMin, utilProps.camera.y));
          }
        }

        // Actuall move the camera to be centered on the centerTarget
        const cameraTarget = {
          x: elPIXIHolder.clientWidth / 2 - (utilProps.camera.x * zoom),
          y: elPIXIHolder.clientHeight / 2 - (utilProps.camera.y * zoom)
        }
        // If zoom has changed, move the camera instantly
        // this eliminates odd camera movement when zoom occurs
        if (lastZoom !== zoom) {
          // Move camera immediately because the user is panning
          // the camera manually
          if (!isNaN(cameraTarget.x) && !isNaN(cameraTarget.y)) {
            // Actuall move the camera to be centered on the centerTarget
            app.stage.x = cameraTarget.x;
            app.stage.y = cameraTarget.y;
          }
        } else if (utilProps.doCameraAutoFollow) {
          // Move smoothly to the cameraTarget
          const camNextCoordinates = math.getCoordsAtDistanceTowardsTarget(
            app.stage,
            cameraTarget,
            math.distance(app.stage, cameraTarget) / 20
          );
          if (!isNaN(camNextCoordinates.x) && !isNaN(camNextCoordinates.y)) {
            // Actuall move the camera to be centered on the centerTarget
            app.stage.x = camNextCoordinates.x;
            app.stage.y = camNextCoordinates.y;
          }
        } else {
          // Move camera immediately because the user is panning
          // the camera manually
          if (!isNaN(cameraTarget.x) && !isNaN(cameraTarget.y)) {
            // Actuall move the camera to be centered on the centerTarget
            app.stage.x = cameraTarget.x;
            app.stage.y = cameraTarget.y;
          }
        }
        lastZoom = zoom;

        // Keep containerUIFixed fixed in the center of the screen
        if (containerUIFixed) {
          containerUIFixed.x = -app.stage.x / zoom;
          containerUIFixed.y = -app.stage.y / zoom;
          containerUIFixed.scale.x = 1 / zoom;
          containerUIFixed.scale.y = 1 / zoom;
        }

      }
      break;
  }

  // Update player name fontsize based on zoom:
  underworld.players.forEach(p => {
    if (p.unit.image) {
      // @ts-ignore jid is a custom identifier to id the text element used for the player name
      const nameText = p.unit.image.sprite.children.find(c => c.jid === config.NAME_TEXT_ID) as undefined | PIXI.Text
      updateNameText(nameText, zoom);
    }
  })
}
export function updateNameText(nameText?: PIXI.Text, zoom?: number) {
  if (nameText) {
    // Keep the text the same size regardless of zoom
    if (zoom) {
      nameText.scale.set(1 / zoom);
      // Adjust the text position so it stays relatively the same distance above the player head
      nameText.y = -config.COLLISION_MESH_RADIUS - config.NAME_TEXT_Y_OFFSET / zoom;
    }
    if (nameText.parent.scale.x < 0) {
      nameText.scale.x = -Math.abs(nameText.scale.x);
    } else {
      nameText.scale.x = Math.abs(nameText.scale.x);
    }
  }

}
// PIXI textures
let sheet: PIXI.Spritesheet;
export function setupPixi(): Promise<void> {
  // Headless does not use graphics
  if (globalThis.headless) { return Promise.resolve(); }
  if (!app) {
    console.error('app is not defined')
    return Promise.resolve();
  }
  // The application will create a canvas element for you that you
  // can then insert into the DOM
  if (elPIXIHolder) {
    elPIXIHolder.appendChild(app.view);
  }

  return loadTextures().then(() => {
    // Resolve the setupPixiPromise so that the menu knows
    // that pixijs is ready
    globalThis.pixiPromiseResolver?.();
  }).catch(e => {
    console.error('pixi load failed', e)
  });
}
export function addPixiContainersForView(view: View) {
  // Headless does not use graphics
  if (globalThis.headless) { return; }
  if (app && utilProps.underworldPixiContainers) {
    app.stage.removeChildren();
    removeContainers(utilProps.underworldPixiContainers);
    switch (view) {
      case View.Game:
        addContainers(utilProps.underworldPixiContainers);
        break;
    }
  }
}
function addContainers(containers: PIXI.Container[]) {
  // Headless does not use graphics
  if (globalThis.headless) { return; }
  if (!app) {
    return;
  }
  // Add containers to the stage in the order that they will be rendered on top of each other
  for (let container of containers) {
    app.stage.addChild(container);
  }
}
function removeContainers(containers: PIXI.Container[]) {
  // Headless does not use graphics
  if (globalThis.headless) { return; }
  if (!app) {
    return;
  }
  // Add containers to the stage in the order that they will be rendered on top of each other
  for (let container of containers) {
    app.stage.removeChild(container);
  }
}
function loadTextures(): Promise<void> {
  // Headless does not use graphics
  if (globalThis.headless) { return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    if (!globalThis.headless && globalThis.pixi) {
      const loader = globalThis.pixi.Loader.shared;
      // loader.onProgress.add(a => console.log("onProgress", a)); // called once per loaded/errored file
      // loader.onError.add(e => console.error("Pixi loader on error:", e)); // called once per errored file
      // loader.onLoad.add(a => console.log("Pixi loader onLoad", a)); // called once per loaded file
      // loader.onComplete.add(a => console.log("Pixi loader onComplete")); // called once when the queued resources all load.
      const sheetPath = 'sheet1.json';
      loader.add(sheetPath);
      loader.onError.add(e => {
        console.error('Pixi loader error', e)
      })
      loader.load((_loader: any, resources: any) => {
        resources = resources;
        const resource = resources[sheetPath]
        if (resource && resource.spritesheet) {
          sheet = resource.spritesheet as PIXI.Spritesheet;
          isReady = true;
          resolve();
        } else {
          reject();
        }
      });
    } else {
      console.error('globalThis.pixi is undefined')
    }
  });
}

export interface PixiSpriteOptions {
  onFrameChange?: (currentFrame: number) => void,
  onComplete?: () => void,
  loop: boolean,
  animationSpeed?: number
}
// Allows files without access to locally scoped 'sheet' to get an 
// animated texture from the sheet
export function getPixiTextureAnimated(
  imagePath: string
) {
  // Headless does not use graphics
  if (globalThis.headless) { return; }
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  return sheet.animations[imagePath];
}
export function addPixiSpriteAnimated(
  imagePath: string,
  parent: PIXI.Container | undefined,
  options: PixiSpriteOptions = {
    loop: true
  }
): JSpriteAnimated | undefined {
  // Headless does not use graphics
  if (globalThis.headless) { return; }
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  if (!(globalThis.pixi && parent)) {
    // For headless
    return
  }
  let sprite: JSpriteAnimated;
  let texture = sheet.animations[imagePath];
  if (texture) {
    const animatedSprite = new globalThis.pixi.AnimatedSprite(texture);
    animatedSprite.animationSpeed = options.animationSpeed || config.DEFAULT_ANIMATION_SPEED;
    if (options.onComplete) {
      animatedSprite.onComplete = options.onComplete;
    }
    if (options.onFrameChange) {
      animatedSprite.onFrameChange = options.onFrameChange;
    }
    animatedSprite.loop = options.loop;
    animatedSprite.play();
    // Adding imagePath to a PIXI.AnimatedSprite makes it a JSpriteAnimated object
    sprite = animatedSprite as JSpriteAnimated;
    sprite.imagePath = imagePath;
    sprite.anchor.set(0.5);

    parent.addChild(sprite);
    return sprite;
  } else {
    throw new Error(
      'Could not find animated texture for ' + imagePath
    );
  }
}

export function addPixiTilingSprite(
  imagePath: string,
  parent: PIXI.Container | undefined,
): PIXI.TilingSprite | undefined {
  // Headless does not use graphics
  if (globalThis.headless) { return; }
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  if (!(globalThis.pixi && parent)) {
    // For headless server
    return undefined;
  }
  let singleTexture = sheet.textures[imagePath];
  if (!singleTexture) {
    console.error('Could not find texture for', imagePath, 'check the spritesheet to figure out why it is missing.');
    return undefined;
  }
  singleTexture.baseTexture.wrapMode = globalThis.pixi.WRAP_MODES.REPEAT;
  const sprite = new globalThis.pixi.TilingSprite(singleTexture);

  // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
  // which is used for identifying the sprite or animation that is currently active
  sprite.imagePath = imagePath;
  parent.addChild(sprite);
  return sprite;
}
export function addPixiSprite(
  imagePath: string,
  parent: PIXI.Container | undefined,
): PIXI.Sprite | undefined {
  // Headless does not use graphics
  if (globalThis.headless) { return; }
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  if (!(globalThis.pixi && parent)) {
    // For headless server
    return undefined;
  }
  let singleTexture = sheet.textures[imagePath];
  if (!singleTexture) {
    console.error('Could not find texture for', imagePath, 'check the spritesheet to figure out why it is missing.');
    return undefined;
  }
  const sprite = new globalThis.pixi.Sprite(singleTexture);

  // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
  // which is used for identifying the sprite or animation that is currently active
  sprite.imagePath = imagePath;
  parent.addChild(sprite);
  return sprite;
}

export function pixiText(text: string, style: Partial<PIXI.ITextStyle>): PIXI.Text | undefined {
  if (!globalThis.pixi) {
    return undefined;
  }
  return new globalThis.pixi.Text(text, style);
}

// Non particle engine particles
// particle engine references pixi specific particles and their generators,
// these are just sprites that we manage ourselves
export type BloodParticle = {
  x: number,
  y: number,
  dx: number,
  dy: number,
  tick: number,
  scale: number,
  color: number,
}
export function startBloodParticleSplatter(underworld: Underworld, damageOrigin: Vec2, target: IUnit, options?: { maxRotationOffset: number, numberOfParticles: number }) {
  if (globalThis.headless) {
    return;
  }
  const bloodAmount = options ? options.numberOfParticles : randInt(underworld.random, 30, 60);
  const angle = getAngleBetweenVec2sYInverted(damageOrigin, target);
  for (let i = 0; i < bloodAmount; i++) {
    const isDamageFromSelf = equal(damageOrigin, target);
    const MAX_ROTATION_OFFSET = options ? options.maxRotationOffset : Math.PI / 4;
    // If the damage origin is the same as target, the spread is a full circle, if not, it's a narrow fan so it can spray in one direction
    const randRotationOffset = isDamageFromSelf ? randFloat(underworld.random, -Math.PI, Math.PI) : randFloat(underworld.random, -MAX_ROTATION_OFFSET, MAX_ROTATION_OFFSET);
    const randScale = randInt(underworld.random, 5, 10);
    // Ensure blood is at unit feet, not center
    const unitImageYOffset = config.COLLISION_MESH_RADIUS / 2;
    // Make spray go farther the closer it is to the centerline
    const proportionOfMaxAwayFromCenterLine = Math.abs(randRotationOffset / MAX_ROTATION_OFFSET);
    const DISTANCE_MAGNIFIER = isDamageFromSelf ? 0.5 : 2;
    // For speeds
    // 0.5 is short 
    // 2 is far
    // Invert the proportion so that closer to the centerline goes farther out
    // Max ensures they particles don't go too far
    const speed = Math.min(2, DISTANCE_MAGNIFIER * Math.abs((1 - proportionOfMaxAwayFromCenterLine)));

    const bloodSplat = {
      x: target.x,
      y: target.y + unitImageYOffset,
      dx: -speed * Math.cos(angle + randRotationOffset) * 15,
      dy: -speed * Math.sin(angle + randRotationOffset) * 15,
      tick: 0, // the amount of times that it has moved
      scale: randScale,
      color: target.bloodColor,
    };


    underworld.bloods.push(bloodSplat);
  }


}
export function tickParticle(particle: BloodParticle) {
  if (globalThis.headless) {
    //remove it from array
    return true;
  }
  particle.y += particle.dy;
  particle.x -= particle.dx;
  particle.dx *= 0.9;
  particle.dy *= 0.9;
  particle.tick++;
  //remove from array once it is done moving (OPTIMIZATION)
  if (particle.tick > 10) {
    //remove it from array
    return true;
  }
  return false;
}

// Used for disabling the HUD for recording
export function toggleHUD() {
  globalThis.isHUDHidden = !globalThis.isHUDHidden;
  const visible = !globalThis.isHUDHidden;
  if (document) {
    document.body?.classList.toggle('HUD-hidden', !visible);
  }
  console.log(`Togggle hud to ${visible ? 'visible' : 'hidden'}`)
  // Toggling HUD off should also set the music to 0 since music will
  // be added in post production for recording
  if (!visible && globalThis.changeVolumeMusic) {
    globalThis.changeVolumeMusic(0);
  }
  if (containerPlanningView) {
    containerPlanningView.visible = visible
  }
  if (containerUI) {
    containerUI.visible = visible;
  }
  if (containerPlayerThinking) {
    containerPlayerThinking.visible = visible;
  }
  if (containerUIFixed) {
    containerUIFixed.visible = visible;
  }
  if (containerFloatingText) {
    containerFloatingText.visible = visible;
  }
  if (containerRadiusUI) {
    containerRadiusUI.visible = visible;
  }

}