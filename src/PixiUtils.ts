import * as PIXI from 'pixi.js';
// if PIXI is finished setting up
let isReady = false;
// PIXI app
export const app = new PIXI.Application();
app.renderer.backgroundColor = 0x45b6fe;
app.renderer.view.style.position = 'absolute';
app.renderer.view.style.top = '0';
app.renderer.view.style.display = 'block';
// app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
// PIXI textures
let resources;
export function setupPixi(): Promise<void> {
  // The application will create a canvas element for you that you
  // can then insert into the DOM
  document.body.appendChild(app.view);

  return loadTextures();
}
function loadTextures(): Promise<void> {
  return new Promise((resolve) => {
    const loader = PIXI.Loader.shared;
    const images = ['images/cell.png', 'images/units/golem.png'];
    images.forEach((path) => {
      loader.add(path);
    });
    loader.load((_loader, all_resources) => {
      resources = all_resources;
      isReady = true;
      resolve();
    });
  });
}
export function addPixiSprite(
  imagePath: string,
  parent?: PIXI.Container,
): PIXI.Sprite {
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  const sprite = new PIXI.Sprite(resources[imagePath].texture);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  if (parent) {
    parent.addChild(sprite);
  } else {
    app.stage.addChild(sprite);
  }
  return sprite;
}
