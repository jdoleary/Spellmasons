import type * as PIXI from 'pixi.js';
import { clone, Vec2 } from '../jmath/Vec';
import { View } from '../views';
import * as math from '../jmath/math';
import * as config from '../config';
import { keyDown } from './ui/eventListeners';
import { SCALE_MODES } from 'pixi.js';
import * as colors from './ui/colors';
import { JSpriteAnimated } from './Image';
import { containerParticles } from './Particles';
import { elPIXIHolder } from './FloatingText';

// if PIXI is finished setting up
let isReady = false;
// Ensure textures stay pixelated when scaled:
if (window.pixi) {
  window.pixi.settings.SCALE_MODE = SCALE_MODES.NEAREST;
}
// PIXI app
export const app = !window.pixi ? undefined : new window.pixi.Application();
export const containerBoard = !window.pixi ? undefined : new window.pixi.Container();
export const containerBetweenBoardAndWalls = !window.pixi ? undefined : new window.pixi.Container();
export const containerWalls = !window.pixi ? undefined : new window.pixi.Container();
export const containerPlanningView = !window.pixi ? undefined : new window.pixi.Container();
export const containerDoodads = !window.pixi ? undefined : new window.pixi.Container();
export const containerUnits = !window.pixi ? undefined : new window.pixi.Container();
export const containerSpells = !window.pixi ? undefined : new window.pixi.Container();
export const containerProjectiles = !window.pixi ? undefined : new window.pixi.Container();
export const containerUI = !window.pixi ? undefined : new window.pixi.Container();
export const containerPlayerThinking = !window.pixi ? undefined : new window.pixi.Container();
export const containerUIFixed = !window.pixi ? undefined : new window.pixi.Container();
export const containerFloatingText = !window.pixi ? undefined : new window.pixi.Container();

export function resizePixi() {
  if (app) {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  }
}
interface UtilProps {
  underworldPixiContainers: PIXI.Container[] | undefined;
  elPIXIHolder: HTMLElement | undefined;
  elCardHand: HTMLElement | undefined;
  elHealthMana: HTMLElement | undefined;
  camera: Vec2;
  doCameraAutoFollow: boolean;
}
const utilProps: UtilProps = {
  underworldPixiContainers: undefined,
  elPIXIHolder: undefined,
  elCardHand: undefined,
  elHealthMana: undefined,
  camera: { x: 0, y: 0 },
  // True if camera should auto follow player unit
  doCameraAutoFollow: true,
}
// debug: Draw caves
if (window.pixi && containerUI && app && containerBetweenBoardAndWalls) {
  window.debugCave = new window.pixi.Graphics();
  containerUI.addChild(window.debugCave);
  window.devDebugGraphics = new window.pixi.Graphics();
  window.devDebugGraphics.lineStyle(3, 0x0000ff, 1.0);
  containerUI.addChild(window.devDebugGraphics);

  if (containerBoard &&
    containerBetweenBoardAndWalls &&
    containerWalls &&
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
      containerBoard,
      containerBetweenBoardAndWalls,
      containerWalls,
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

  utilProps.elPIXIHolder = document.getElementById('PIXI-holder') as HTMLElement;
  utilProps.elCardHand = document.getElementById('card-hand') as HTMLElement;
  utilProps.elHealthMana = document.getElementById('health-mana') as HTMLElement;
  window.debugGraphics = new window.pixi.Graphics();
  containerUI.addChild(window.debugGraphics);
  window.unitOverlayGraphics = new window.pixi.Graphics();
  containerUI.addChild(window.unitOverlayGraphics);
  window.walkPathGraphics = new window.pixi.Graphics();
  containerUI.addChild(window.walkPathGraphics);
  window.thinkingPlayerGraphics = new window.pixi.Graphics();
  window.radiusGraphics = new window.pixi.Graphics();
  const colorMatrix = new window.pixi.filters.AlphaFilter();
  colorMatrix.alpha = 0.2;
  window.radiusGraphics.filters = [colorMatrix];
  containerBetweenBoardAndWalls.addChild(window.radiusGraphics);


  app.renderer.backgroundColor = colors.abyss;

  window.addEventListener('resize', resizePixi);
  window.addEventListener('load', () => {
    resizePixi();
  });
  // Initialize with camera following player:
  // It is important that doCameraAutoFollow is changed only
  // in cameraAutoFollow so that the body's class can change with it.
  cameraAutoFollow(true);

}
// withinCameraBounds takes a Vec2 (in game space) and returns a 
// Vec2 that is within the bounds of the camera so that it will 
// surely be seen by a user even if they have panned away.
// Used for attention markers and pings
export function withinCameraBounds(position: Vec2, marginHoriz?: number): Vec2 {
  if (!(utilProps.elCardHand && utilProps.elHealthMana && utilProps.elPIXIHolder)) {
    // If headless, the return of this function is irrelevant
    return { x: 0, y: 0 }
  }
  const cardHandRect = utilProps.elCardHand.getBoundingClientRect();
  const healthManaRect = utilProps.elHealthMana.getBoundingClientRect();
  const pixiHolderRect = utilProps.elPIXIHolder.getBoundingClientRect();
  // cardHand has padding of 300px to allow for a far right drop zone,
  // this should be taken into account when keeping the attention marker
  // outside of the cardHoldersRect bounds
  const cardHandPaddingRight = 300;
  const { x: camX, y: camY, zoom } = getCamera();
  // Determine bounds
  const margin = (marginHoriz !== undefined ? marginHoriz : 30) / zoom;
  const marginTop = 45 / zoom;
  const marginBottom = 45 / zoom;
  const left = margin + camX / zoom;
  const right = window.innerWidth / zoom - margin + camX / zoom;
  const top = marginTop + camY / zoom;
  const bottom = utilProps.elPIXIHolder.clientHeight / zoom - marginBottom + camY / zoom;

  // Debug draw camera limit
  // window.unitOverlayGraphics.lineStyle(4, 0xcb00f5, 1.0);
  // window.unitOverlayGraphics.moveTo(left, top);
  // window.unitOverlayGraphics.lineTo(right, top);
  // window.unitOverlayGraphics.lineTo(right, bottom);
  // window.unitOverlayGraphics.lineTo(left, bottom);
  // window.unitOverlayGraphics.lineTo(left, top);

  // Keep inside bounds of camera
  const withinBoundsPos: Vec2 = {
    x: Math.min(Math.max(left, position.x), right),
    y: Math.min(Math.max(top, position.y), bottom)
  }
  // window.unitOverlayGraphics.drawCircle(camX / zoom, camY / zoom, 4);
  // window.unitOverlayGraphics.drawCircle(cardHandRight, cardHandTop, 8);

  // Don't let the attention marker get obscured by the cardHolders element
  const cardHandRight = (cardHandRect.width + (camX - cardHandPaddingRight)) / zoom;
  const cardHandTop = (cardHandRect.top - pixiHolderRect.top + camY) / zoom;
  if (withinBoundsPos.x < cardHandRight && withinBoundsPos.y > cardHandTop) {
    // 32 is arbitrary extra padding for the height of the marker
    withinBoundsPos.y = cardHandTop - 32;
  }
  const healthManaRight = (healthManaRect.width + camX) / zoom;
  const healthManaTop = (healthManaRect.top - pixiHolderRect.top + camY) / zoom;
  if (withinBoundsPos.x < healthManaRight && withinBoundsPos.y > healthManaTop) {
    // 32 is arbitrary extra padding for the height of the marker
    withinBoundsPos.y = healthManaTop - 32;
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
  document.body.classList.toggle('auto-camera', active);
}
export function getCamera() {
  return {
    x: !app ? 0 : -app.stage.x,
    y: !app ? 0 : -app.stage.y,
    zoom: calculateCameraZoom(),
  }
}
function calculateCameraZoom() {
  return !app ? 0 : app.stage.scale.x + (window.zoomTarget - app.stage.scale.x) / 8;
}
let lastZoom = window.zoomTarget;
export function updateCameraPosition() {
  if (!(app)) {
    return
  }

  // Lerp zoom to target
  // Note: This must happen BEFORE the stage x and y is updated
  // or else it will get jumpy when zooming
  const zoom = calculateCameraZoom();

  app.stage.scale.x = zoom;
  app.stage.scale.y = zoom;

  switch (window.view) {
    case View.Game:
      if (window.player) {
        if (utilProps.doCameraAutoFollow) {
          const activeTurnPlayer = window.underworld.players[window.underworld.playerTurnIndex];
          if (!window.player.inPortal && window.player.unit.alive) {
            // Follow current client player
            utilProps.camera = clone(window.player.unit);
          } else if (activeTurnPlayer) {
            // Follow active turn player
            utilProps.camera = clone(activeTurnPlayer.unit);
          } else {
            // Set camera to the center of the map
            utilProps.camera = { x: (window.underworld.limits.xMax - window.underworld.limits.xMin) / 2, y: (window.underworld.limits.yMax - window.underworld.limits.yMin) / 2 };
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
          const mapRightMostPoint = window.underworld.limits.xMax + marginX;
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
          const mapBottomMostPoint = window.underworld.limits.yMax + marginY;
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

}
// PIXI textures
let sheet: PIXI.Spritesheet;
export function setupPixi(): Promise<void> {
  if (!app) {
    return Promise.resolve();
  }
  // The application will create a canvas element for you that you
  // can then insert into the DOM
  if (elPIXIHolder) {
    elPIXIHolder.appendChild(app.view);
  }

  return loadTextures();
}
export function addPixiContainersForView(view: View) {
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
  if (!app) {
    return;
  }
  // Add containers to the stage in the order that they will be rendered on top of each other
  for (let container of containers) {
    app.stage.addChild(container);
  }
}
function removeContainers(containers: PIXI.Container[]) {
  if (!app) {
    return;
  }
  // Add containers to the stage in the order that they will be rendered on top of each other
  for (let container of containers) {
    app.stage.removeChild(container);
  }
}
function loadTextures(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.pixi) {
      const loader = window.pixi.Loader.shared;
      // loader.onProgress.add(a => console.log("onProgress", a)); // called once per loaded/errored file
      // loader.onError.add(e => console.error("Pixi loader on error:", e)); // called once per errored file
      // loader.onLoad.add(a => console.log("Pixi loader onLoad", a)); // called once per loaded file
      // loader.onComplete.add(a => console.log("Pixi loader onComplete")); // called once when the queued resources all load.
      const sheetPath = 'sheet1.json';
      loader.add(sheetPath);
      loader.load((_loader, resources) => {
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
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  if (!(window.pixi && parent)) {
    // For headless
    return
  }
  let sprite: JSpriteAnimated;
  let texture = sheet.animations[imagePath];
  if (texture) {
    const animatedSprite = new window.pixi.AnimatedSprite(texture);
    animatedSprite.animationSpeed = options.animationSpeed || 0.1;
    if (window.devMode) {
      animatedSprite.animationSpeed = 0.5;
    }
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

export function addPixiSprite(
  imagePath: string,
  parent: PIXI.Container | undefined,
): PIXI.Sprite | undefined {
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  if (!(window.pixi && parent)) {
    // For headless server
    return undefined;
  }
  let singleTexture = sheet.textures[imagePath];
  const sprite = new window.pixi.Sprite(singleTexture);
  if (!singleTexture) {
    console.error('Could not find non-animated texture for', imagePath);
  }

  // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
  // which is used for identifying the sprite or animation that is currently active
  sprite.imagePath = imagePath;
  parent.addChild(sprite);
  return sprite;
}

export function pixiText(text: string, style: Partial<PIXI.ITextStyle>): PIXI.Text | undefined {
  if (!window.pixi) {
    return undefined;
  }
  return new window.pixi.Text(text, style);
}