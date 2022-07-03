import type * as PIXI from 'pixi.js';

import { addPixiSprite, addPixiSpriteAnimated, getPixiTextureAnimated, PixiSpriteOptions } from './PixiUtils';
import Subsprites from './Subsprites';
import { animateIndependent } from './AnimationTimeline';
import type { Vec2 } from "./Vec";

// The serialized version of the interface changes the interface to allow only the data
// that can be serialized in JSON.  It may exclude data that is not neccessary to
// rehydrate the JSON into an entity
export type IImageAnimatedSerialized = {
  sprite: {
    x: number,
    y: number,
    scale: { x: number, y: number },
    imagePath: string,
    // A list of sprite imagePaths (jordan identifier for subsprites)
    children: string[],
  },
  mask?: string,
};
// 'imagePath' is a property that I've added to sprite to identify which
// animation is playing currently
// 'isOneOff' is a custom property that I'm adding to denote if a sprite is a oneOff sprite
// meaning, it should get removed if the primary sprite changes
export type JSpriteAnimated = PIXI.AnimatedSprite & { imagePath: string, isOneOff: boolean };
export interface IImageAnimated {
  // Not to be serialized
  sprite: JSpriteAnimated;
  // When invoked, resolves any promises waiting on this animation to complete
  // such as the underworld waiting for a spell animation before moving on
  resolver: undefined | (() => void);
  // Sprite that acts as a mask
  mask?: string,
}
export function create(
  coords: Vec2,
  spritesheetId: string,
  parent: PIXI.Container,
  pixiSpriteOptions?: PixiSpriteOptions
): IImageAnimated {
  const sprite = addPixiSpriteAnimated(spritesheetId, parent, pixiSpriteOptions);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.rotation = 0;

  const image: IImageAnimated = {
    sprite,
    resolver: undefined
  };
  setPosition(image, coords);
  return image;
}
export function cleanup(image?: IImageAnimated) {
  // Remove PIXI sprite
  if (image && image.sprite) {
    // Remove subsprites
    image.sprite.removeChildren();
    if (image.sprite.parent) {
      image.sprite.parent.removeChild(image.sprite);
    }
  } else {
    console.error('could not clean up image', image, image?.sprite, image?.sprite.parent);
  }
}
// changeSprite changes the still image or animation of a sprite
// Note: if playing a temporary animation, opt for Unit.playAnimation
// because it has built in protections for returning to the correct  
// default sprite
// Returns sprite IF sprite has changed
// Note: Sprite management is complicated, many invokations await an animation completing to
// do something else, so this function is very careful to ensure that the previous animation's
// promise is resolved (if there is one) before switching the animation.  This is why 'resolver'
// is a required field, it should be explicitly set to noop if there is no promise meant to be waiting 
// for the animation to finish.
export function changeSprite(image: IImageAnimated | undefined, imagePath: string, container: PIXI.Container, resolver: undefined | (() => void), options?: PixiSpriteOptions,): JSpriteAnimated | undefined {
  if (!image) {
    console.warn('Cannot changeSprite, no image object to change to', imagePath)
    return;
  }
  // Note: This resolver logic MUST BE executed before early returns (with the exception of the image
  // not existing).  If it is not, the latest resolver may never be assigned and the game could hang.
  // Since the image is changing, resolve whatever was waiting for it to complete.
  if (image.resolver) {
    image.resolver();
  }
  // Set resolver so that even if the image changes, the game wont deadlock, waiting for a 
  // never-to-be-completed animation.  Defaults to noop if not provided
  image.resolver = resolver;

  if (image.sprite.imagePath == imagePath && image.sprite.parent == container) {
    // Do not change if imagePath would be unchanged and
    // container would be unchanged 
    // Return undefined because sprite is unchanged
    return undefined;
  }
  const tex = getPixiTextureAnimated(imagePath);
  if (tex) {
    const sprite = image.sprite;
    sprite.textures = tex;
    sprite.imagePath = imagePath;
    // Change container if necessary:
    if (container !== sprite.parent) {
      container.addChild(sprite);
    }
    // Remove oneOff sprites attached to this sprites previous animation:
    for (let child of sprite.children as JSpriteAnimated[]) {
      if (child.isOneOff) {
        sprite.removeChild(child);
      }
    }
    // Default loop to true
    sprite.loop = true;
    // Default animationSpeed to 0.1
    sprite.animationSpeed = 0.1;
    if (options) {
      const { onFrameChange, onComplete, loop, animationSpeed } = options;
      sprite.onFrameChange = onFrameChange;
      sprite.loop = loop;
      if (!loop && !resolver) {
        console.warn('Sprite is changing to a non-looping sprite, but no resolver was provided.  Is this intentional?');
      }
      if (animationSpeed !== undefined) {
        sprite.animationSpeed = animationSpeed;
      }
      sprite.onComplete = () => {
        if (onComplete) {
          onComplete();
        }
        if (resolver) {
          // Always trigger resolver when sprite completes animating so that
          // whatever is waiting for the animation to finish can carry on
          resolver();
        }
      };
    }
    sprite.play();
    return image.sprite;
  } else {
    console.error('Could not change sprite to', imagePath);
    return undefined
  }
}
// Converts an Image entity into a serialized form
// that can be saved as JSON and rehydrated later into
// a full Image entity.
// Returns only the properties that can be saved
// callbacks and complicated objects such as PIXI.Sprites
// are removed
export function serialize(image: IImageAnimated): IImageAnimatedSerialized {
  return {
    sprite: {
      x: image.sprite.x,
      y: image.sprite.y,
      scale: { x: image.sprite.scale.x, y: image.sprite.scale.y },
      imagePath: getAnimationPathFromSprite(image.sprite),
      // @ts-ignore: imagePath is a property that I added to identify currently playing animation or sprite.
      children: image.sprite.children.map(c => c.imagePath)

    },
  };
}
// Reinitialize an Image from IImageAnimatedSerialized JSON
// this is useful when loading game state after reconnect
// This is the opposite of serialize
export function load(image: IImageAnimatedSerialized | undefined, parent: PIXI.Container): IImageAnimated | undefined {
  if (!image) {
    return undefined;
  }
  const copy = { ...image };
  const { scale, imagePath } = copy.sprite;
  if (!imagePath) {
    // Missing image path
    console.error('Cannot load image, missing image path')
    return;
  }
  // Recreate the sprite using the create function so it initializes it properly
  const newImage = create(copy.sprite, imagePath, parent);
  newImage.sprite.scale.set(scale.x, scale.y);
  // Restore subsprites (the actual sprites)
  restoreSubsprites(newImage);

  return newImage;
}
export function getAnimationPathFromSprite(sprite: PIXI.Sprite): string {
  const textureCacheIds = sprite._texture.textureCacheIds;
  const imagePath = textureCacheIds[0] ? textureCacheIds[0].replace(/_\d+.png/g, "") : '';
  return imagePath;

}
export function getSubspriteImagePaths(image: IImageAnimated | IImageAnimatedSerialized): string[] {
  // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
  return image.sprite.children.filter(c => c !== undefined).map(c => c.imagePath);
}
// syncronize updates an existing originalImage to match the properties of imageSerialized
// mutates originalImage
// TODO test for memory leaks
export function syncronize(imageSerialized: IImageAnimatedSerialized, originalImage?: IImageAnimated): IImageAnimated | undefined {
  if (!originalImage) {
    return undefined;
  }
  // then we only need to update properties:
  const { x, y, scale } = imageSerialized.sprite;
  originalImage.sprite.x = x;
  originalImage.sprite.y = y;
  originalImage.sprite.scale.x = scale.x
  originalImage.sprite.scale.y = scale.y;
  if (getSubspriteImagePaths(imageSerialized) != getSubspriteImagePaths(originalImage)) {
    restoreSubsprites(originalImage);
  }
  if (imageSerialized.sprite.imagePath === getAnimationPathFromSprite(originalImage.sprite)) {
    return originalImage;
  } else {
    // if the textures do not match, then the sprite is majorly out of sync and it's
    // best to just load()
    // --
    // Clean up old image and completely replace
    // TODO: Sync mask
    // TODO: Serialized image cant carry callbacks with it so this may cause an issue if there is an onComplete callback
    // changeSprite(originalImage, imageSerialized.sprite.imagePath)
    // TODO: Temporarily disabled: Replacing the image leads to problems where a callback depends on the same image reference
    // in order to restore it to a different animation and when the reference changes it causes an issue where playerHit would loop
    // and never change back to playerIdle
    // const newImage = load(imageSerialized, originalImage.sprite.parent);
    // cleanup(originalImage);
    return originalImage;
  }

}
export function restoreSubsprites(image?: IImageAnimated) {
  if (!image) {
    return;
  }
  // Re-add subsprites
  const subSprites = getSubspriteImagePaths(image);
  image.sprite.removeChildren();
  for (let subSprite of subSprites) {
    addSubSprite(image, subSprite);
  }
  // Re-add mask:
  if (image.mask) {
    addMask(image, image.mask);
  }
}
export function removeMask(image: IImageAnimated) {
  if (image.sprite.mask) {
    try {
      // @ts-ignore
      image.sprite.removeChild(image.sprite.mask);
    } catch (e) {
      console.log('ignore error', e);
    }
    image.sprite.mask = null;
    image.mask = undefined;
  }

}
export function addMask(image: IImageAnimated, path: string) {
  if (image.mask !== path) {
    // remove old mask:
    removeMask(image);
    const mask = addPixiSpriteAnimated(path, image.sprite);
    mask.anchor.set(0.5);
    image.sprite.mask = mask;
    image.mask = path;
  }
}
export function setPosition(image: IImageAnimated | undefined, pos: Vec2) {
  if (!image) {
    return;
  }
  image.sprite.x = pos.x;
  image.sprite.y = pos.y;
}
export function scale(image: IImageAnimated | undefined, scale: number): Promise<void> {
  if (!image) {
    return Promise.resolve();
  }
  // Clamp to a positive value
  scale = Math.max(0, scale);
  return animateIndependent([
    {
      sprite: image.sprite,
      target: { scale },
    },
  ]);
}
export function addSubSprite(image: IImageAnimated | undefined, key: string) {
  if (!image) {
    return;
  }
  // Don't add more than one copy
  if (!getSubspriteImagePaths(image).includes(key)) {
    const subSpriteData = Subsprites[key];
    if (subSpriteData) {
      const sprite = addPixiSprite(subSpriteData.imageName, image.sprite);
      sprite.alpha = subSpriteData.alpha;
      sprite.anchor.set(subSpriteData.anchor.x, subSpriteData.anchor.y);
      sprite.scale.set(subSpriteData.scale.x, subSpriteData.scale.y);
    } else {
      console.error("Missing subsprite data for key", key)
    }
  }
}
export function removeSubSprite(image: IImageAnimated | undefined, imagePath: string) {
  if (!image) {
    return;
  }
  // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
  const subSprite = image.sprite.children.find(c => c.imagePath == imagePath)
  if (subSprite) {
    // Remove PIXI.Sprite instance
    subSprite.parent.removeChild(subSprite);
  } else {
    console.log('Cannot remove subsprite', imagePath, 'subsprite is missing from sprite.children');
  }
}
export function move(image: IImageAnimated, x: number, y: number) {
  return animateIndependent([
    {
      sprite: image.sprite,
      target: { x, y },
    },
  ]);
}
export function show(image?: IImageAnimated): Promise<void> {
  if (!image) {
    return Promise.resolve();
  }
  return animateIndependent([
    {
      sprite: image.sprite,
      target: { alpha: 1 },
    },
  ]);
}
export function hide(image?: IImageAnimated) {
  if (!image) {
    return Promise.resolve();
  }
  return animateIndependent([
    {
      sprite: image.sprite,
      target: { alpha: 0 },
    },
  ]);
}