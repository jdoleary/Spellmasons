import * as PIXI from 'pixi.js';
import { clone } from './Vec';
import { View } from './views';
import * as config from './config';
// if PIXI is finished setting up
let isReady = false;
// PIXI app
export const app = new PIXI.Application();
export const containerBoard = new PIXI.Container();
export const containerPlanningView = new PIXI.Container();
containerPlanningView.alpha = 0.5;
export const containerDoodads = new PIXI.Container();
export const containerUnits = new PIXI.Container();
export const containerPickup = new PIXI.Container();
export const containerSpells = new PIXI.Container();
export const containerProjectiles = new PIXI.Container();
export const containerUI = new PIXI.Container();
export const containerFloatingText = new PIXI.Container();
const underworldPixiContainers = [
  containerBoard,
  containerPlanningView,
  containerDoodads,
  containerUnits,
  containerPickup,
  containerSpells,
  containerProjectiles,
  containerUI,
  containerFloatingText,
];

window.debugGraphics = new PIXI.Graphics();
containerUI.addChild(window.debugGraphics);
window.unitOverlayGraphics = new PIXI.Graphics();
containerUI.addChild(window.unitOverlayGraphics);
window.walkPathGraphics = new PIXI.Graphics();
containerUI.addChild(window.walkPathGraphics);

export const containerCharacterSelect = new PIXI.Container();
const characterSelectContainers = [containerCharacterSelect];

app.renderer.backgroundColor = 0x111631;

window.addEventListener('resize', resizePixi);
window.addEventListener('load', () => {
  resizePixi();
});
export function resizePixi() {
  const elPIXIHolder = document.getElementById('PIXI-holder');
  if (!elPIXIHolder) {
    console.error('Cannot resize pixi, elPIXIHolder is null')
    return;
  }
  app.renderer.resize(window.innerWidth, window.innerHeight);
  recenterCamera();
}
let elPIXIHolder: HTMLElement | null;
export function recenterCamera() {
  if (!elPIXIHolder) {
    elPIXIHolder = document.getElementById('PIXI-holder');
    return;
  }

  // Lerp zoom to target
  // Note: This must happen BEFORE the stage x and y is updated
  // or else it will get jumpy when zooming
  const zoom = app.stage.scale.x + (window.zoomTarget - app.stage.scale.x) / 8;

  app.stage.scale.x = zoom;
  app.stage.scale.y = zoom;

  switch (window.view) {
    case View.CharacterSelect:
      app.stage.x = elPIXIHolder.clientWidth / 2;
      app.stage.y = elPIXIHolder.clientHeight / 2;
      break;
    case View.Game:
      if (window.player) {

        const centerTarget = clone(window.player.unit);
        // Clamp centerTarget so that there isn't a log of empty space
        // in the camera
        const margin = config.COLLISION_MESH_RADIUS * 4;
        // Clamp camera X
        const mapLeftMostPoint = 0 - margin;
        const mapRightMostPoint = window.underworld.width + margin;
        const camCenterXMin = mapLeftMostPoint + window.innerWidth / 2 / zoom;
        const camCenterXMax = mapRightMostPoint - window.innerWidth / 2 / zoom;
        // If the supposed minimum is more than the maximum, just center the camera:
        if (camCenterXMin > camCenterXMax) {
          centerTarget.x = (mapRightMostPoint - mapLeftMostPoint) / 2;
        } else {
          // clamp the camera x between the min and max possible camera targets
          centerTarget.x = Math.min(camCenterXMax, Math.max(camCenterXMin, centerTarget.x));
        }
        //Clamp camera Y
        const mapTopMostPoint = 0 - margin;
        const mapBottomMostPoint = window.underworld.height + margin;
        const camCenterYMin = mapTopMostPoint + window.innerHeight / 2 / zoom;
        const camCenterYMax = mapBottomMostPoint - window.innerHeight / 2 / zoom;
        // If the supposed minimum is more than the maximum, just center the camera:
        if (camCenterYMin > camCenterYMax) {
          centerTarget.y = (mapBottomMostPoint - mapTopMostPoint) / 2;
        } else {
          // clamp the camera x between the min and max possible camera targets
          centerTarget.y = Math.min(camCenterYMax, Math.max(camCenterYMin, centerTarget.y));
        }

        // Actuall move the camera to be centered on the centerTarget
        const cameraTarget = {
          x: window.innerWidth / 2 - (centerTarget.x * zoom),
          y: window.innerHeight / 2 - (centerTarget.y * zoom)
        }

        // Option 1 for cam movement: Lerp camera to target
        // app.stage.x = app.stage.x + (cameraTarget.x - app.stage.x) / 2;
        // app.stage.y = app.stage.y + (cameraTarget.y - app.stage.y) / 2;

        // Option 2 for cam movement: Set camera to target immediately
        app.stage.x = cameraTarget.x;
        app.stage.y = cameraTarget.y;

      }
      break;
  }

}
// PIXI textures
let resources: { [key: string]: PIXI.ILoaderResource };
let sheet: PIXI.Spritesheet;
export function setupPixi(): Promise<void> {
  // The application will create a canvas element for you that you
  // can then insert into the DOM
  const elPIXIHolder = document.getElementById('PIXI-holder');
  if (elPIXIHolder) {
    elPIXIHolder.appendChild(app.view);
  } else {
    throw new Error('element PIXI-holder does not exist');
  }

  return loadTextures();
}
export function addPixiContainersForView(view: View) {
  app.stage.removeChildren();
  removeContainers(underworldPixiContainers);
  switch (view) {
    case View.CharacterSelect:
      addContainers(characterSelectContainers);
      break;
    case View.Game:
      addContainers(underworldPixiContainers);
      break;
  }
}
function addContainers(containers: PIXI.Container[]) {
  // Add containers to the stage in the order that they will be rendered on top of each other
  for (let container of containers) {
    app.stage.addChild(container);
  }
}
function removeContainers(containers: PIXI.Container[]) {
  // Add containers to the stage in the order that they will be rendered on top of each other
  for (let container of containers) {
    app.stage.removeChild(container);
  }
}
function loadTextures(): Promise<void> {
  return new Promise((resolve, reject) => {
    const loader = PIXI.Loader.shared;
    // loader.onProgress.add(a => console.log("onProgress", a)); // called once per loaded/errored file
    // loader.onError.add(e => console.error("Pixi loader on error:", e)); // called once per errored file
    // loader.onLoad.add(a => console.log("Pixi loader onLoad", a)); // called once per loaded file
    // loader.onComplete.add(a => console.log("Pixi loader onComplete")); // called once when the queued resources all load.
    const sheetPath = 'sheet1.json';
    loader.add(sheetPath);
    loader.load((_loader, resources) => {
      resources = resources;
      if (resources[sheetPath] && resources[sheetPath].spritesheet) {
        sheet = resources[sheetPath].spritesheet as PIXI.Spritesheet;
        isReady = true;
        resolve();
      } else {
        reject();
      }
    });
  });
}
export function addAnimatedPixiSprite(
  imagePaths: string[],
  parent: PIXI.Container,
  animationSpeed: number = 0.1,
): PIXI.Sprite {
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  const textures = [];
  for (let path of imagePaths) {
    const resource: PIXI.ILoaderResource = resources[path];
    if (resource && resource.texture) {
      textures.push(resource.texture);
    } else {
      console.error('path', path, 'cannot be loaded as a texture');
    }
  }
  const sprite = new PIXI.AnimatedSprite(textures);
  sprite.animationSpeed = animationSpeed;
  sprite.play();
  parent.addChild(sprite);

  return sprite;
}
export interface PixiSpriteOptions {
  onComplete?: () => void,
  loop: boolean,
  animationSpeed?: number
}
export function addPixiSprite(
  imagePath: string,
  parent: PIXI.Container,
  options: PixiSpriteOptions = {
    loop: true
  }
): PIXI.Sprite {
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  let sprite: PIXI.Sprite;
  let texture = sheet.animations[imagePath];
  if (texture) {
    const animatedSprite = new PIXI.AnimatedSprite(sheet.animations[imagePath]);
    animatedSprite.animationSpeed = options.animationSpeed || 0.1;
    if (options.onComplete) {
      animatedSprite.onComplete = options.onComplete;
    }
    animatedSprite.loop = options.loop;
    animatedSprite.play();
    sprite = animatedSprite;
  } else {
    let singleTexture = sheet.textures[imagePath];
    sprite = new PIXI.Sprite(singleTexture);
    if (!singleTexture) {
      console.error('Could not find texture for', imagePath);
    }
  }
  parent.addChild(sprite);
  return sprite;
}
