import * as PIXI from 'pixi.js';
import { clampVector, clone, equal, getAngleBetweenVec2sYInverted, lerpVec2, Vec2 } from '../jmath/Vec';
import { View } from '../View';
import * as math from '../jmath/math';
import * as config from '../config';
import { keyDown } from './ui/eventListeners';
import * as colors from './ui/colors';
import { JSpriteAnimated } from './Image';
import { containerParticles, containerParticlesUnderUnits } from './Particles';
import { elPIXIHolder } from './FloatingText';
import Underworld, { Biome } from '../Underworld';
import { randFloat, randInt } from '../jmath/rand';
import { IUnit } from '../entity/Unit';
import { isWithinRect, Rect } from '../jmath/Rect';
import { inPortal } from '../entity/Player';
import { keyToHumanReadable } from './ui/keyMapping';
import { tutorialCompleteTask } from './Explain';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { easeOutCubic } from '../jmath/Easing';

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
export const containerPlanningView = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerCorpses = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerWalls = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerRadiusUI = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerDoodads = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerUnits = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerSpells = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerProjectiles = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerUI = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerPlayerThinking = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerUIFixed = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
export const containerFloatingText = !globalThis.pixi ? undefined : new globalThis.pixi.Container();


// Graphics used for painting blood trails
export const graphicsBloodSmear = !globalThis.pixi ? undefined : new globalThis.pixi.Graphics();
// Container used for blood spatter particles
export const containerBloodParticles = !globalThis.pixi ? undefined : new globalThis.pixi.ParticleContainer();

let tempBloodContainer: PIXI.Container | undefined;
export function cleanBlood(underworld?: Underworld) {
  if (underworld) {
    // Remove current blood objects from continuing to propagate blood
    underworld.bloods = [];
  }
  // Remove blood
  graphicsBloodSmear?.clear();
  containerBloodParticles?.removeChildren();
  containerBloodSmear?.removeChildren();

  // Setup blood containers to receive new blood
  resetupBloodContainers();

}
function resetupBloodContainers() {
  tempBloodContainer = !globalThis.pixi ? undefined : new globalThis.pixi.Container();
  if (tempBloodContainer) {
    if (graphicsBloodSmear) {
      tempBloodContainer.addChild(graphicsBloodSmear);
      graphicsBloodSmear.alpha = 0.5;
    }
    if (containerBloodParticles) {
      containerBloodParticles.alpha = 0.5;
      tempBloodContainer.addChild(containerBloodParticles);
    }

    containerBloodSmear?.addChild(tempBloodContainer);
  }

}


export function cacheBlood() {
  if (app) {
    if (tempBloodContainer) {
      tempBloodContainer.cacheAsBitmap = true
    }
    requestAnimationFrame(() => {
      // Remove blood from particle container and graphics object now that the blood
      // is cached in the tempBloodContainer
      containerBloodParticles?.removeChildren();
      graphicsBloodSmear?.clear();
      // Reassign the temp blood container now that the previous one is cached and
      // will not change
      resetupBloodContainers();
    });
  }
}

let updateLiquidFilterIntervalId: NodeJS.Timeout | undefined;
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
  if (exists(updateLiquidFilterIntervalId)) {
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
    containerCorpses &&
    containerWalls &&
    containerBloodSmear &&
    containerRadiusUI &&
    containerPlanningView &&
    containerDoodads &&
    containerParticlesUnderUnits &&
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
      containerPlanningView,
      containerCorpses,
      containerWalls,
      containerRadiusUI,
      containerDoodads,
      containerParticlesUnderUnits,
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
  if (containerProjectiles) {
    globalThis.projectileGraphics = new globalThis.pixi.Graphics();
    containerProjectiles.addChild(globalThis.projectileGraphics);
  }

  utilProps.elPIXIHolder = document.getElementById('PIXI-holder') as (HTMLElement | undefined);
  utilProps.elCardHoldersBorder = document.getElementById('card-holders-border') as (HTMLElement | undefined);
  utilProps.elCardHand = document.getElementById('card-hand') as (HTMLElement | undefined);
  utilProps.elCardHoldersInner = document.getElementById('card-holders-inner') as (HTMLElement | undefined);
  globalThis.debugGraphics = new globalThis.pixi.Graphics();
  containerUI.addChild(globalThis.debugGraphics);
  globalThis.unitOverlayGraphics = new globalThis.pixi.Graphics();
  containerUI.addChild(globalThis.unitOverlayGraphics);
  globalThis.selectedUnitGraphics = new globalThis.pixi.Graphics();
  containerUI.addChild(globalThis.selectedUnitGraphics);
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
    let color = colors.abyss[biome];
    if (globalThis.UIEasyOnTheEyes) {
      color = colors.abyssEasyEyes[biome];
    }
    app.renderer.backgroundColor = color;
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
// Works best if the object has anchor (0.5, 0.5)
export function withinCameraBounds(position: Vec2, marginHorizontal: number = 5, marginVertical: number = 5): Vec2 {
  // Headless does not use graphics
  if (globalThis.headless) { return { x: 0, y: 0 }; }
  if (!(utilProps.elCardHoldersBorder && utilProps.elPIXIHolder)) {
    // If headless, the return of this function is irrelevant
    return { x: 0, y: 0 }
  }

  const { x: camX, y: camY, zoom } = getCamera();

  // Margins cannot be more than half of the screen
  marginHorizontal = Math.min(marginHorizontal, (globalThis.innerWidth / 2) / zoom);
  marginVertical = Math.min(marginVertical, (globalThis.innerHeight / 2) / zoom);

  // margins as world coordinates relative to window size, cam position, and zoom
  const left = marginHorizontal + (camX / zoom);
  const right = globalThis.innerWidth / zoom - marginHorizontal + (camX / zoom);
  const top = marginVertical + (camY / zoom);
  const bottom = globalThis.innerHeight / zoom - marginVertical + (camY / zoom);

  // Debug draw camera limit
  // if (globalThis.unitOverlayGraphics) {
  //   globalThis.unitOverlayGraphics.lineStyle(4, 0xcb00f5, 1.0);
  //   globalThis.unitOverlayGraphics.moveTo(left, top);
  //   globalThis.unitOverlayGraphics.lineTo(right, top);
  //   globalThis.unitOverlayGraphics.lineTo(right, bottom);
  //   globalThis.unitOverlayGraphics.lineTo(left, bottom);
  //   globalThis.unitOverlayGraphics.lineTo(left, top);
  // }

  // Keep inside bounds of camera
  const withinBoundsPos: Vec2 = {
    x: Math.min(Math.max(left, position.x), right),
    y: Math.min(Math.max(top, position.y), bottom)
  }

  const pixiHolderRect = utilProps.elPIXIHolder.getBoundingClientRect();
  // Don't let the attention marker get obscured by the UI element
  const cardHoldersBorderBox = UIElementToInGameSpace(utilProps.elCardHoldersBorder, pixiHolderRect, camX, camY, zoom);
  // Move the position if it is obscured by the card-holder
  if (isWithinRect({ x: withinBoundsPos.x - marginHorizontal, y: withinBoundsPos.y }, cardHoldersBorderBox) || isWithinRect({ x: withinBoundsPos.x + marginHorizontal, y: withinBoundsPos.y }, cardHoldersBorderBox)) {
    withinBoundsPos.y = cardHoldersBorderBox.top - marginVertical;
  }
  return withinBoundsPos;
}

// Used for moving the camera with middle mouse button (like in Dota2)
export function moveCamera(x: number, y: number) {
  utilProps.camera.x += x;
  utilProps.camera.y += y;
}
export function getZoom(): number {
  //zoom is identical on .x and .y
  return app?.stage.scale.x || 1;
}

export function isCameraAutoFollowing(): boolean {
  return utilProps.doCameraAutoFollow;
}
const elCameraRecenterTip = document.getElementById('camera-recenter-tip');
export function cameraAutoFollow(active: boolean) {
  utilProps.doCameraAutoFollow = active;
  // Any action that causes the camera to stop auto following such as MMB drag or WASD
  // should stop the cinematic if it's playing
  if (!active) {
    if (globalThis.skipCinematic) {
      globalThis.skipCinematic();
    }
  }
  document.body?.classList.toggle('auto-camera', active);
}

// Show a tip when player is nearly offscreen to alert the player how to recenter
// the camera
export function tryShowRecenterTip() {
  if (!utilProps.doCameraAutoFollow && elCameraRecenterTip) {
    if (globalThis.player?.isSpawned) {
      const { zoom } = getCamera();
      // divide by 2: changes it from diameter to radius
      const screenRadiusInGameSpace = Math.min(elPIXIHolder.clientWidth, elPIXIHolder.clientHeight) / zoom / 2;
      const margin = config.COLLISION_MESH_RADIUS * 2;
      const cameraGameSpaceCenterDistanceToPlayer = math.distance(getCameraCenterInGameSpace(), globalThis.player.unit);
      // Only show recenter tip if player is near or beyond the edge of the screen
      if (cameraGameSpaceCenterDistanceToPlayer + margin > screenRadiusInGameSpace) {
        elCameraRecenterTip.innerHTML = i18n(['Press 🍞 to make the view auto follow you', keyToHumanReadable(globalThis.controlMap.recenterCamera)]);
      } else {
        elCameraRecenterTip.innerHTML = '';
      }
    }
  }
}
export function getCameraCenterInGameSpace(): Vec2 {
  return clone(utilProps.camera);
}
// getCamera returns the render camera, not to 
// be confused with getCameraCenterInGameSpace
export function getCamera() {
  return {
    x: !app ? 0 : -app.stage.x,
    y: !app ? 0 : -app.stage.y,
    // scale.x and scale.y are the same
    zoom: !app ? 1 : app.stage.scale.x
  }
}
export function getMapCenter(underworld: Underworld): Vec2 {
  return { x: (underworld.limits.xMax - underworld.limits.xMin) / 2, y: (underworld.limits.yMax - underworld.limits.yMin) / 2 }

}
export function setCamera(pos: Vec2, zoom: number, underworld: Underworld) {
  utilProps.camera.x = pos.x;
  utilProps.camera.y = pos.y;
  globalThis.zoomTarget = zoom;
  updateCameraPosition(underworld, 1);
}
export function setCameraToMapCenter(underworld: Underworld) {
  // Set camera to the center of the map
  utilProps.camera = getMapCenter(underworld);
}
let lastZoom = globalThis.zoomTarget;
const baseScreenshakeFalloffMs = 500;
let screenshake = {
  intensity: 0,
  runtime: 0,
  falloff: baseScreenshakeFalloffMs,
  camOffset: { x: 0, y: 0 }
}
export function startScreenshake(intensity: number, prediction: boolean, falloff?: number) {
  if (globalThis.noScreenshake) {
    return;
  }
  if (prediction) {
    return
  }
  screenshake.runtime = 0;
  screenshake.intensity = intensity;
  if (falloff) {
    screenshake.falloff = falloff;
  } else {
    screenshake.falloff = baseScreenshakeFalloffMs;
  }

}
function useScreenshake(stage: PIXI.Container, deltaTime: number) {
  if (globalThis.noScreenshake) {
    return;
  }
  screenshake.runtime += deltaTime;
  const lerpValue = math.lerp(1, 0, easeOutCubic(screenshake.runtime / screenshake.falloff));
  if (lerpValue === 0) {
    return;
  }

  const featureFlagScreenShakeMult = globalThis.featureFlags && exists(globalThis.featureFlags.screenShakeMult) ? globalThis.featureFlags.screenShakeMult : 1;
  screenshake.camOffset.x = (Math.random() * 2 - 1) * screenshake.intensity * lerpValue * featureFlagScreenShakeMult;
  screenshake.camOffset.y = (Math.random() * 2 - 1) * screenshake.intensity * lerpValue * featureFlagScreenShakeMult;

  // Shake the camera:
  stage.x += screenshake.camOffset.x;
  stage.y += screenshake.camOffset.y;

}
// Used for lerping the camera over multiple frames
let cameraVelocity: Vec2 = { x: 0, y: 0 }
export function updateCameraPosition(underworld: Underworld, deltaTime: number) {
  // Headless does not use graphics
  if (globalThis.headless) { return; }
  if (!(app)) {
    return
  }

  // Lerp zoom to target
  // Note: This must happen BEFORE the stage x and y is updated
  // or else it will get jumpy when zooming
  const zoom = !app ? 0 : app.stage.scale.x + ((globalThis.zoomTarget || 1) - app.stage.scale.x) / 8;
  app.stage.scale.x = zoom;
  app.stage.scale.y = zoom;
  // Make unit outlines relative to zoom so they stay the same
  // size regardless of zoom level
  if (globalThis.unitOutlineFilter) {
    globalThis.unitOutlineFilter.thickness = zoom;
  }

  switch (globalThis.view) {
    case View.Game:
      if (globalThis.player) {
        if (utilProps.doCameraAutoFollow) {
          if (globalThis.cinematicCameraTarget) {
            // Cinematic camera has control
            utilProps.camera = clone(globalThis.cinematicCameraTarget);
          } else {

            if (!inPortal(globalThis.player)) {
              // Follow current client player
              utilProps.camera = clone(globalThis.player.unit);
              // If recording shorts, follow in the upper 1/4 of 
              // the screen
              if (globalThis.recordingShorts) {
                utilProps.camera.y += (globalThis.innerHeight / 4 / zoom);
              }
            }
          }
        }

        let targetCameraVelocity = { x: 0, y: 0 }
        // Allow camera movement via WSAD
        if (keyDown.cameraUp) {
          targetCameraVelocity.y -= .5;
        }
        if (keyDown.cameraDown) {
          targetCameraVelocity.y += .5;
        }
        if (keyDown.cameraLeft) {
          targetCameraVelocity.x -= .5;
        }
        if (keyDown.cameraRight) {
          targetCameraVelocity.x += .5;
        }

        if (targetCameraVelocity.x == 0 && targetCameraVelocity.y == 0) {
          // Stop camera movement if velocity is near 0 target
          // To prevent endless camera sliding/lerping
          if (Math.abs(cameraVelocity.x) < 0.01) {
            cameraVelocity.x = 0;
          }
          if (Math.abs(cameraVelocity.y) < 0.01) {
            cameraVelocity.y = 0;
          }
        } else {
          tutorialCompleteTask('camera');
          // This ensures that the camera won't move faster in a
          // diagonal than up/down ; left/right.
          targetCameraVelocity = clampVector(targetCameraVelocity, 1);
        }

        // Lerp to the new camera velocity using old velocity, target velocity, and time passed
        cameraVelocity = getNextCameraVelocity(cameraVelocity, targetCameraVelocity, deltaTime);
        // Get next camera position using new velocity, and time passed
        const nextPos = getNextCameraPosition({ x: utilProps.camera.x, y: utilProps.camera.y }, cameraVelocity, zoom, deltaTime);
        // Clamp centerTarget so that there isn't a lot of empty space in the camera
        utilProps.camera = clampCameraPosition(nextPos, zoom, underworld, utilProps.doCameraAutoFollow);

        // Actually move the camera to be centered on the centerTarget
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
      useScreenshake(app.stage, deltaTime);
      break;
  }

  // Update player name fontsize based on zoom:
  underworld.players.forEach(p => {
    if (p.unit.image) {
      // @ts-ignore jid is a custom identifier to id the text element used for the player name
      const nameText = p.unit.image.sprite.children.find(c => c.jid === config.NAME_TEXT_ID) as undefined | PIXI.Text
      updateNameText(nameText, zoom);
    }
  });

  tryShowRecenterTip();
}
export function getNextCameraVelocity(cameraVelocity: Vec2, targetCameraVelocity: Vec2, deltaTime: number): Vec2 {
  // Camera should lerp quickly when given playerInput and slowly when stopping
  // this ensures the camera isn't "dragging" behind the user's intention
  const cameraKeyDown = (targetCameraVelocity.x != 0 || targetCameraVelocity.y != 0);

  // How long it should take to lerp the camera (higher amount = slower lerp)
  const interpolationTime = cameraKeyDown ? 40 : 50;

  // We adjust the lerp amount based on framerate
  const frameLerpAmount = 1 - Math.pow(Math.E, -deltaTime / interpolationTime);
  cameraVelocity = lerpVec2(cameraVelocity, targetCameraVelocity, frameLerpAmount)

  return cameraVelocity;
}
export function getNextCameraPosition(cameraPos: Vec2, cameraVelocity: Vec2, zoom: number, deltaTime: number): Vec2 {
  // Camera velocity is still clamped to [0, 1] or [Stationary, MaxSpeed] so we need to
  // CAMERA_BASE_SPEED (configurable constant)
  // * zoom factor, (move slower when zoomed in, faster when zoomed out)
  // * seconds passed, (maintains camera speed at different framerates)
  const cameraSpeedMult = (config.CAMERA_BASE_SPEED * 1 / Math.sqrt(zoom)) * (deltaTime / 1000);
  const nextPos = {
    x: cameraPos.x + cameraVelocity.x * cameraSpeedMult,
    y: cameraPos.y + cameraVelocity.y * cameraSpeedMult,
  }

  return nextPos;
}
// Clamp the camera position so it doesn't go too far out of bounds when autofollowing a target
function clampCameraPosition(camPos: Vec2, zoom: number, underworld: Underworld, isCameraAutoFollowing: boolean): Vec2 {
  const clampedPos = { x: 0, y: 0 };
  // Users can move the camera further if they are manually controlling the camera
  // whereas if the camera is following a target it keeps more of the map on screen
  const marginY = isCameraAutoFollowing ? config.COLLISION_MESH_RADIUS * 4 : 900 / zoom;
  const marginX = isCameraAutoFollowing ? config.COLLISION_MESH_RADIUS * 4 : 1400 / zoom;
  // Clamp camera X
  const mapLeftMostPoint = 0 - marginX;
  const mapRightMostPoint = underworld.limits.xMax + marginX;
  const camCenterXMin = mapLeftMostPoint + elPIXIHolder.clientWidth / 2 / zoom;
  const camCenterXMax = mapRightMostPoint - elPIXIHolder.clientWidth / 2 / zoom;
  // If the supposed minimum is more than the maximum, just center the camera:
  if (camCenterXMin > camCenterXMax) {
    clampedPos.x = (mapRightMostPoint + mapLeftMostPoint) / 2;
  } else {
    // clamp the camera x between the min and max possible camera targets
    clampedPos.x = Math.min(camCenterXMax, Math.max(camCenterXMin, camPos.x));
  }

  //Clamp camera Y
  const mapTopMostPoint = 0 - marginY;
  const mapBottomMostPoint = underworld.limits.yMax + marginY;
  const camCenterYMin = mapTopMostPoint + elPIXIHolder.clientHeight / 2 / zoom;
  const camCenterYMax = mapBottomMostPoint - elPIXIHolder.clientHeight / 2 / zoom;
  // If the supposed minimum is more than the maximum, just center the camera:
  if (camCenterYMin > camCenterYMax) {
    clampedPos.y = (mapBottomMostPoint + mapTopMostPoint) / 2;
  } else {
    // clamp the camera x between the min and max possible camera targets
    clampedPos.y = Math.min(camCenterYMax, Math.max(camCenterYMin, camPos.y));
  }
  return clampedPos;


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
let sheets: PIXI.Spritesheet[] = [];
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
      loader.add('Forum', './font/Forum/Forum-Regular.ttf');
      // loader.onProgress.add(a => console.log("onProgress", a)); // called once per loaded/errored file
      // loader.onError.add(e => console.error("Pixi loader on error:", e)); // called once per errored file
      // loader.onLoad.add(a => console.log("Pixi loader onLoad", a)); // called once per loaded file
      // loader.onComplete.add(a => console.log("Pixi loader onComplete")); // called once when the queued resources all load.
      loader.add('sheet1.json');
      loader.add('sheet2.json');
      loader.onError.add(e => {
        console.error('Pixi loader error', e)
      })
      loader.onComplete.add((loader, resources) => {
        const sheetPaths = Object.keys(resources).filter(path => path.endsWith('.json'));
        for (let sheetPath of sheetPaths) {
          const resource = resources[sheetPath]
          if (resource && resource.spritesheet && sheets.indexOf(resource.spritesheet) === -1) {
            console.log('Load: register spritesheet', resource.url);
            sheets.push(resource.spritesheet as PIXI.Spritesheet);
            isReady = true;
          }
        }
        if (sheets.length) {
          resolve();
        } else {
          reject();
        }
      });
      // Start loading textures
      loader.load();
    } else {
      console.error('globalThis.pixi is undefined')
    }
  });
}

export interface PixiSpriteOptions {
  onFrameChange?: (currentFrame: number) => void,
  onComplete?: () => void,
  loop: boolean,
  animationSpeed?: number,
  // Allow for passing down color replace filter params.  This is currently used to
  // customize the color of player magic layer
  colorReplace?: { colors: [number, number][], epsilon: number }
  scale?: number;
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
  for (let sheet of sheets) {
    const animation = sheet.animations[imagePath];
    if (animation) {
      return animation;
    }
  }
  return undefined;
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
  let texture: PIXI.Texture<PIXI.Resource>[] | undefined;
  for (let sheet of sheets) {
    texture = sheet.animations[imagePath];
    if (texture) {
      break;
    }
  }
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
    if (options.colorReplace) {
      const robeMagicColorFilter = new MultiColorReplaceFilter(options.colorReplace.colors, options.colorReplace.epsilon);
      if (!animatedSprite.filters) {
        animatedSprite.filters = [];
      }
      animatedSprite.filters.push(robeMagicColorFilter);

    }
    animatedSprite.play();
    // Adding imagePath to a PIXI.AnimatedSprite makes it a JSpriteAnimated object
    sprite = animatedSprite as JSpriteAnimated;
    sprite.imagePath = imagePath;
    sprite.anchor.set(0.5);

    parent.addChild(sprite);
    return sprite;
  } else {
    // TODO prevent this from causing Loading to freeze with white screen
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
  let singleTexture: PIXI.Texture<PIXI.Resource> | undefined;
  for (let sheet of sheets) {
    singleTexture = sheet.textures[imagePath];
    if (singleTexture) {
      break;
    }
  }
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
  let singleTexture: PIXI.Texture<PIXI.Resource> | undefined;
  for (let sheet of sheets) {
    singleTexture = sheet.textures[imagePath];
    if (singleTexture) {
      break;
    }
  }
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
  const textSprite = new globalThis.pixi.Text(text, { fontFamily: 'Forum', ...style });
  // Pixi Text has to be manually destroyed so it needs an identifier
  // so I know that the sprite needs to be manually cleaned up.
  // @ts-ignore jid is a custom identifier to id the text element used
  textSprite.jid = config.NAME_TEXT_ID;
  return textSprite;
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
  if (globalThis.headless || globalThis.noGore) {
    return;
  }
  // If there are a lot of bloods being calculated lower the next
  // bloods amount proportionally so as to not slow down the computer.
  // ---
  // FPS Divider is used to decrease the number of particles if 
  // there are too many being animated at once (should never be less than 1);
  const FPSDivider = Math.max(1, underworld.bloods.length / 300);
  const idealNumberOfBloodParticles = options ? options.numberOfParticles : randInt(30, 60)
  const bloodAmount = Math.max(1, idealNumberOfBloodParticles / FPSDivider);
  const angle = getAngleBetweenVec2sYInverted(damageOrigin, target);
  for (let i = 0; i < bloodAmount; i++) {
    const isDamageFromSelf = equal(damageOrigin, target);
    const MAX_ROTATION_OFFSET = options ? options.maxRotationOffset : Math.PI / 4;
    // If the damage origin is the same as target, the spread is a full circle, if not, it's a narrow fan so it can spray in one direction
    const randRotationOffset = isDamageFromSelf ? randFloat(-Math.PI, Math.PI) : randFloat(-MAX_ROTATION_OFFSET, MAX_ROTATION_OFFSET);
    const randScale = randInt(5, 10);
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
export function tickParticle(particle: BloodParticle, underworld: Underworld) {
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
  if (underworld.isCoordOnVoidTile(particle)) {
    //remove it from array
    return true;
  }
  return false;
}

export const CLASS_HUD_HIDDEN = 'HUD-hidden';
export const CLASS_VISIBILITY_ATTENTION_MARKERS = 'attention-markers-hidden';
export const CLASS_VISIBILITY_HEALTH_BARS = 'health-bars-hidden';
// Used for disabling the HUD for recording
export function toggleHUD() {
  globalThis.isHUDHidden = !globalThis.isHUDHidden;
  const visible = !globalThis.isHUDHidden;
  if (document) {
    document.body?.classList.toggle(CLASS_HUD_HIDDEN, !visible);
  }
  console.log(`Togggle hud to ${visible ? 'visible' : 'hidden'}`)
  // Toggling HUD off should also set the music to 0 since music will
  // be added in post production for recording
  if (!visible && globalThis.changeVolumeMusic) {
    globalThis.changeVolumeMusic(0, false);
  }
  if (containerPlanningView) {
    containerPlanningView.visible = visible
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