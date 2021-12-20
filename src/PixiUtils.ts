import * as PIXI from 'pixi.js';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE } from './config';
import { Route } from './routes';
import { View } from './views';
// if PIXI is finished setting up
let isReady = false;
// PIXI app
export const app = new PIXI.Application();
export const containerBoard = new PIXI.Container();
export const containerPlanningView = new PIXI.Container();
containerPlanningView.alpha = 0.5;
export const containerUnits = new PIXI.Container();
export const containerPickup = new PIXI.Container();
export const containerSpells = new PIXI.Container();
export const containerProjectiles = new PIXI.Container();
export const containerUI = new PIXI.Container();
export const containerFloatingText = new PIXI.Container();
const underworldPixiContainers = [
  containerBoard,
  containerPlanningView,
  containerUnits,
  containerPickup,
  containerSpells,
  containerProjectiles,
  containerUI,
  containerFloatingText,
];
export const containerOverworld = new PIXI.Container();
export const overworldGraphics = new PIXI.Graphics();
containerOverworld.addChild(overworldGraphics);
const overworldPixiContainers = [containerOverworld];

export const containerCharacterSelect = new PIXI.Container();
const characterSelectContainers = [containerCharacterSelect];

app.renderer.backgroundColor = 0x45b6fe;
app.renderer.view.style.position = 'absolute';
app.renderer.view.style.top = '0';
app.renderer.view.style.display = 'block';

window.addEventListener('resize', resizePixi);
window.addEventListener('load', () => {
  resizePixi();
})
function resizePixi() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  recenterStage();
}
export function recenterStage(){

  switch (window.view) {
    case View.CharacterSelect:
      console.log('Render: recenter for View.CharacterSelect')
      app.stage.x = window.innerWidth / 2;
      app.stage.y = window.innerHeight / 2;
    break;
    case View.Game:
      switch(window.route){
        case Route.Overworld:
          console.log('Render: recenter for Overworld')
          app.stage.x = window.innerWidth / 2 - window.overworld.levels[0].location.x;
          app.stage.y = window.innerHeight;
          break;
        case Route.Underworld:
          console.log('Render: recenter for Underworld')
          // Align Camera: center the app in the middle of the board
          app.stage.x = app.renderer.width / 2 - (CELL_SIZE * BOARD_WIDTH) / 2;
          app.stage.y = app.renderer.height / 2 - (CELL_SIZE * BOARD_HEIGHT) / 2;
          break;
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
export function addPixiContainersForRoute(route: Route) {
  removeContainers(overworldPixiContainers);
  removeContainers(underworldPixiContainers);
  switch (route) {
    case Route.Overworld:
      addContainers(overworldPixiContainers);
      break;
    case Route.Underworld:
      addContainers(underworldPixiContainers);
      break;
  }
}
export function addPixiContainersForView(view: View) {
  app.stage.removeChildren();
  switch (view) {
    case View.CharacterSelect:
      addContainers(characterSelectContainers);
      break;
    case View.Game:
      addPixiContainersForRoute(window.route);
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
  return new Promise((resolve) => {
    const loader = PIXI.Loader.shared;
    const sheetPath = 'sheet1.json';
    loader.add(sheetPath);
    loader.load((_loader, all_resources) => {
      resources = all_resources;
      sheet = all_resources[sheetPath].spritesheet;
      isReady = true;
      resolve();
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
export function addPixiSprite(
  imagePath: string,
  parent: PIXI.Container,
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
    animatedSprite.animationSpeed = 0.02;
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
