import * as PIXI from 'pixi.js';
import { BOARD_HEIGHT, CELL_SIZE, BOARD_WIDTH } from './config';
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
app.renderer.backgroundColor = 0x45b6fe;
app.renderer.view.style.position = 'absolute';
app.renderer.view.style.top = '0';
app.renderer.view.style.display = 'block';

resizePixi();
window.addEventListener('resize', resizePixi);
function resizePixi() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  // Center the app in the middle of the board
  app.stage.x = app.renderer.width / 2 - (CELL_SIZE * BOARD_WIDTH) / 2;
  app.stage.y = app.renderer.height / 2 - (CELL_SIZE * BOARD_HEIGHT) / 2;
}
// PIXI textures
let resources: { [key: string]: PIXI.ILoaderResource };
let sheet: PIXI.Spritesheet;
export function setupPixi(additionalImagePaths: string[]): Promise<void> {
  // Dedup images
  const additionalImagePathsDeduped = additionalImagePaths.filter(
    (imagePath, index) => additionalImagePaths.indexOf(imagePath) === index,
  );
  // The application will create a canvas element for you that you
  // can then insert into the DOM
  const elPIXIHolder = document.getElementById('PIXI-holder');
  if (elPIXIHolder) {
    elPIXIHolder.appendChild(app.view);
  } else {
    throw new Error('element PIXI-holder does not exist');
  }

  // Add containers to the stage in the order that they will be rendered on top of each other
  app.stage.addChild(containerBoard);
  app.stage.addChild(containerPlanningView);
  app.stage.addChild(containerUnits);
  app.stage.addChild(containerPickup);
  app.stage.addChild(containerSpells);
  app.stage.addChild(containerProjectiles);
  app.stage.addChild(containerUI);
  app.stage.addChild(containerFloatingText);
  return loadTextures(additionalImagePathsDeduped);
}
function loadTextures(additionalImagePaths: string[]): Promise<void> {
  return new Promise((resolve) => {
    const loader = PIXI.Loader.shared;
    // const images = [
    //   ...additionalImagePaths,
    //   'images/tiles/ground.png',
    //   'images/tiles/lava.png',
    //   'images/arrow.png',
    //   'images/target.png',
    //   'images/deny.png',
    //   'images/green-thing.png',
    //   'images/portal.png',
    //   'images/units/unit-underline.png',
    //   'images/units/corpse.png',
    //   'images/pickups/card.png',
    //   'images/pickups/card1.png',
    //   'images/pickups/card2.png',
    //   'images/pickups/card3.png',
    //   'images/upgrades/more_cards.png',
    //   'images/upgrades/plus_range.png',
    //   'images/upgrades/plus_card_frequency.png',
    //   'images/headband.png',
    //   'images/disconnected.png',
    //   'images/empty.png',
    // ];
    // images.forEach((path) => {
    //   loader.add(path);
    // });
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

export function changeSpriteTexture(imagePath: string, sprite: PIXI.Sprite) {
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  const texture = sheet.textures[imagePath];
  if (texture) {
    sprite.texture = texture;
  } else {
    console.error(
      'Texture at ',
      imagePath,
      'was unable to be set as sprite texture because the texture does not exist',
    );
  }
}
