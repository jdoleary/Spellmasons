import * as PIXI from 'pixi.js';
import { clone, Vec2 } from './Vec';
import { View } from './views';
import * as math from './math';
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
export const containerSpells = new PIXI.Container();
export const containerProjectiles = new PIXI.Container();
export const containerUI = new PIXI.Container();
export const containerFloatingText = new PIXI.Container();
const underworldPixiContainers = [
  containerBoard,
  containerPlanningView,
  containerDoodads,
  containerUnits,
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

const cameraPan = { x: 0, y: 0 };
export function setCameraPan(x?: number, y?: number) {
  if (x !== undefined) {
    cameraPan.x = x;
    // Detach camera from target now that user is manually moving it
    setIsPanning(true);
  }
  if (y !== undefined) {
    cameraPan.y = y;
    // Detach camera from target now that user is manually moving it
    setIsPanning(true);
  }
}
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
}
let elPIXIHolder: HTMLElement | null;
let camera: Vec2 = { x: 0, y: 0 };
let isPanning = false;
export function setIsPanning(active: boolean) {
  isPanning = active;
}
export function updateCameraPosition() {
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
        if (!isPanning) {
          if (!window.player.inPortal && window.player.unit.alive) {
            // Follow current client player
            camera = clone(window.player.unit);
          } else if (window.underworld.players[window.underworld.playerTurnIndex]) {
            // Follow active turn player
            camera = clone(window.underworld.players[window.underworld.playerTurnIndex].unit);
          } else {
            // Set camera to the center of the map
            camera = { x: window.underworld.width / 2, y: window.underworld.height / 2 };
          }
        }
        // Allow some camera movement via WSAD
        camera.x += cameraPan.x;
        camera.y += cameraPan.y;
        // Clamp centerTarget so that there isn't a log of empty space
        // in the camera
        // Users can move the camera further if they are manually controlling the camera
        // whereas if the camera is following a target it keeps more of the map on screen
        const marginY = isPanning ? window.underworld.height * 3 : config.COLLISION_MESH_RADIUS * 4;
        const marginX = isPanning ? window.underworld.width * 3 : config.COLLISION_MESH_RADIUS * 4;
        // Clamp camera X
        const mapLeftMostPoint = 0 - marginX;
        const mapRightMostPoint = window.underworld.width + marginX;
        const camCenterXMin = mapLeftMostPoint + elPIXIHolder.clientWidth / 2 / zoom;
        const camCenterXMax = mapRightMostPoint - elPIXIHolder.clientWidth / 2 / zoom;
        // If the supposed minimum is more than the maximum, just center the camera:
        if (camCenterXMin > camCenterXMax) {
          camera.x = (mapRightMostPoint + mapLeftMostPoint) / 2;
        } else {
          // clamp the camera x between the min and max possible camera targets
          camera.x = Math.min(camCenterXMax, Math.max(camCenterXMin, camera.x));
        }

        //Clamp camera Y
        const mapTopMostPoint = 0 - marginY;
        const mapBottomMostPoint = window.underworld.height + marginY;
        const camCenterYMin = mapTopMostPoint + elPIXIHolder.clientHeight / 2 / zoom;
        const camCenterYMax = mapBottomMostPoint - elPIXIHolder.clientHeight / 2 / zoom;
        // If the supposed minimum is more than the maximum, just center the camera:
        if (camCenterYMin > camCenterYMax) {
          camera.y = (mapBottomMostPoint + mapTopMostPoint) / 2;
        } else {
          // clamp the camera x between the min and max possible camera targets
          camera.y = Math.min(camCenterYMax, Math.max(camCenterYMin, camera.y));
        }


        // Actuall move the camera to be centered on the centerTarget
        const cameraTarget = {
          x: elPIXIHolder.clientWidth / 2 - (camera.x * zoom),
          y: elPIXIHolder.clientHeight / 2 - (camera.y * zoom)
        }

        // Option 1 for cam movement: Lerp camera to target
        // app.stage.x = app.stage.x + (cameraTarget.x - app.stage.x) / 2;
        // app.stage.y = app.stage.y + (cameraTarget.y - app.stage.y) / 2;

        // Option 2 for cam movement: Set camera to target immediately
        if (isPanning) {
          // Move camera immediately because the user is panning
          // the camera manually
          app.stage.x = cameraTarget.x;
          app.stage.y = cameraTarget.y;
        } else {
          // Otherwise, move smoothly to the cameraTarget
          const camNextCoordinates = math.getCoordsAtDistanceTowardsTarget(
            app.stage,
            cameraTarget,
            math.distance(app.stage, cameraTarget) / 20
          );
          app.stage.x = camNextCoordinates.x;
          app.stage.y = camNextCoordinates.y;
        }

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
