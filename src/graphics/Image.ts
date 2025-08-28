import type * as PIXI from 'pixi.js';

import { addPixiSprite, addPixiSpriteAnimated, getPixiTextureAnimated, PixiSpriteOptions } from './PixiUtils';
import Subsprites from '../Subsprites';
import type { Vec2 } from "../jmath/Vec";
import * as config from '../config';
import { raceTimeout } from '../Promise';
import { LIQUID_MASK } from '../inLiquid';

export interface HasImage {
  image: IImageAnimated;
}
export function hasImage(maybe: any): maybe is HasImage {
  return maybe && maybe.image && maybe.image.sprite;
}
// The serialized version of the interface changes the interface to allow only the data
// that can be serialized in JSON.  It may exclude data that is not neccessary to
// rehydrate the JSON into an entity
export type IImageAnimatedSerialized = {
  scaleModifiers?: ScaleModifier[],
  sprite: {
    x: number,
    y: number,
    scale: { x: number, y: number },
    imagePath: string,
    // if the animation should loop
    loop: boolean,
    // A list of sprite imagePaths (jordan identifier for subsprites)
    children: string[],
  },
  mask?: string,
};
// 'imagePath' is a property that I've added to sprite to identify which
// animation is playing currently
// 'doRemoveWhenPrimaryAnimationChanges' is a custom property that I'm adding to denote if a sprite is a oneOff sprite
// meaning, it should get removed if the primary sprite changes
export type JSpriteAnimated = PIXI.AnimatedSprite & { imagePath: string, doRemoveWhenPrimaryAnimationChanges: boolean };
interface ScaleModifier {
  id: string;
  x?: number;
  y?: number;
}
export interface IImageAnimated {
  // Not to be serialized
  sprite: JSpriteAnimated;
  scaleModifiers?: ScaleModifier[];
  // When invoked, resolves any promises waiting on this animation to complete
  // such as the underworld waiting for a spell animation before moving on
  resolver: undefined | (() => void);
  // Sprite that acts as a mask
  mask?: string,
}
export function create(
  coords: Vec2,
  spritesheetId: string,
  parent: PIXI.Container | undefined,
  pixiSpriteOptions?: PixiSpriteOptions
): IImageAnimated | undefined {
  if (!parent) {
    return undefined;
  }
  const sprite = addPixiSpriteAnimated(spritesheetId, parent, pixiSpriteOptions);
  if (!sprite) {
    return undefined;
  }
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.rotation = 0;

  const image: IImageAnimated = {
    sprite,
    resolver: undefined,
  };
  setPosition(image, coords);
  return image;
}
export function removeScaleModifier(image: IImageAnimated | undefined, id: string, strength: number) {
  if (image && image.scaleModifiers) {
    image.scaleModifiers = image.scaleModifiers.filter(x => x.id !== id)
  }
  setScaleFromModifiers(image, strength);
}
export function addScaleModifier(image: IImageAnimated | undefined, mod: ScaleModifier, strength: number) {
  if (image) {
    if (!image.scaleModifiers) {
      image.scaleModifiers = [];
    }
    const prev = image.scaleModifiers.find(x => x.id == mod.id);
    // overwrite existing modifier with same id
    if (prev) {
      prev.x = mod.x;
      prev.y = mod.y;
    } else {
      // add
      image.scaleModifiers.push(mod);
    }
  }
  setScaleFromModifiers(image, strength);
}
export function setScaleFromModifiers(image: IImageAnimated | undefined, strength: number) {
  const strengthScale = getScaleFromStrength(strength);
  let scaleX = strengthScale;
  let scaleY = strengthScale;
  if (image?.scaleModifiers) {
    for (let { x, y } of image.scaleModifiers) {
      if (x) {
        scaleX *= x;
      }
      if (y) {
        scaleY *= y;
      }
    }
  }
  if (image) {
    image.sprite.scale.x = scaleX;
    image.sprite.scale.y = scaleY;
  }
}
function getScaleFromStrength(strength: number): number {
  // this final scale of the unit will always be less than the max multiplier
  const maxMultiplier = 3;
  // adjust strength to ensure scale = 1 at strength = 1
  strength -= 1;
  // calculate scale multiplier with diminishing formula
  // 20 is an arbitrary number that controls the speed at which the scale approaches the max
  return 1 + (maxMultiplier - 1) * (strength / (strength + 20))
}
export function cleanup(image?: IImageAnimated) {
  // Remove PIXI sprite
  if (image) {
    if (image.resolver) {
      image.resolver();
    }
    if (image.sprite) {
      // Manually destroy Pixi Text
      // https://www.html5gamedevs.com/topic/31749-how-to-cleaning-up-all-pixi-sprites-and-textures/?do=findComment&comment=182386
      // @ts-ignore jid is a custom identifier to id the text element used for the player name
      image.sprite.children.filter(c => c.jid == config.NAME_TEXT_ID).forEach(pixiText => {
        pixiText.destroy(true);
      })
      // Remove subsprites
      image.sprite.removeChildren();
      if (image.sprite.parent) {
        image.sprite.parent.removeChild(image.sprite);
      }
    } else {
      console.error('could not clean up image, image.sprite is falsey');
    }
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
export function changeSprite(image: IImageAnimated | undefined, imagePath: string, container: PIXI.Container | undefined, resolver: undefined | (() => void), options?: PixiSpriteOptions): JSpriteAnimated | undefined {
  if (!image) {
    console.warn('Cannot changeSprite, no image object to change to', imagePath)
    return;
  }
  if (!container) {
    // For headless
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
    // Exception: Only cancel the change if it is NOT a Hit animation, allow it to be interrupted and replaced with another hit animation
    // since a unit may take damage more quickly than the hit animation can finish.
    if (image.sprite.imagePath.indexOf('Hit') === -1) {
      // Return undefined because sprite is unchanged
      if (resolver) {
        resolver();
      }
      return undefined
    }
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
      if (child.doRemoveWhenPrimaryAnimationChanges) {
        sprite.removeChild(child);
      }
    }
    // Default loop to true
    sprite.loop = true;
    // Default animationSpeed
    sprite.animationSpeed = config.DEFAULT_ANIMATION_SPEED;
    if (options) {
      const { onFrameChange, onComplete, loop, animationSpeed } = options;
      sprite.onFrameChange = onFrameChange;
      sprite.loop = loop;
      if (exists(animationSpeed)) {
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
    if (resolver) {
      resolver();
    }
    return undefined
  }
}
const ALLOW_NO_SERIALIZE_CHILDREN_JIDS = [
  // NAME_TEXT need not be serialized
  config.NAME_TEXT_ID
]
// Converts an Image entity into a serialized form
// that can be saved as JSON and rehydrated later into
// a full Image entity.
// Returns only the properties that can be saved
// callbacks and complicated objects such as PIXI.Sprites
// are removed
export function serialize(image: IImageAnimated): IImageAnimatedSerialized {
  const children = image.sprite.children.map(c => {
    // Warn if unexpected child is unserializable because it's missing an imagePath
    // @ts-ignore: imagePath is a property that I added to identify currently playing animation or sprite.
    if (!c.imagePath && !ALLOW_NO_SERIALIZE_CHILDREN_JIDS.some(x => x == c.jid)) {
      // @ts-ignore: jid is a custom identifier property that I added
      console.warn(c.jid, c, 'does not have an imagePath and thus cannot be serialized.');
    }
    // @ts-ignore: imagePath is a property that I added to identify currently playing animation or sprite.
    return c.imagePath
  })
    // remove nulls
    .flatMap(x => x !== null && exists(x) ? [x] : []);
  return {
    scaleModifiers: image.scaleModifiers,
    sprite: {
      x: image.sprite.x,
      y: image.sprite.y,
      scale: { x: image.sprite.scale.x, y: image.sprite.scale.y },
      imagePath: getAnimationPathFromSprite(image.sprite),
      loop: image.sprite.loop,
      children,

    },
  };
}
// Reinitialize an Image from IImageAnimatedSerialized JSON
// this is useful when loading game state after reconnect
// This is the opposite of serialize
export function load(image: IImageAnimatedSerialized | undefined, parent: PIXI.Container | undefined): IImageAnimated | undefined {
  if (!image) {
    return undefined;
  }
  if (!parent) {
    // For headless
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
  const newImage = create(copy.sprite, imagePath, parent, { loop: image.sprite.loop });
  if (!newImage) { return undefined; }
  newImage.scaleModifiers = copy.scaleModifiers;
  newImage.sprite.scale.set(scale.x, scale.y);
  // Strength is unknown so scale will have to be reset when
  // Unit or Pickup loads and strength is known
  setScaleFromModifiers(newImage, 1);
  // Restore subsprites (the actual sprites)
  restoreSubsprites(newImage, copy.sprite.children);

  return newImage;
}
export function getAnimationPathFromSprite(sprite: PIXI.Sprite): string {
  const textureCacheIds = sprite._texture.textureCacheIds;
  const imagePath = textureCacheIds[0] ? textureCacheIds[0].replace(/_?\d*.png/g, "") : '';
  return imagePath;

}
export function getSubspriteImagePaths(image: IImageAnimated): string[] {
  // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
  return image.sprite.children.filter(c => exists(c)).map(c => c.imagePath);
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
  if (imageSerialized.sprite.children != getSubspriteImagePaths(originalImage)) {
    restoreSubsprites(originalImage, imageSerialized.sprite.children);
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
export function restoreSubsprites(image: IImageAnimated | undefined, subspriteImageNames: string[]) {
  if (!image) {
    return;
  }
  // Re-add subsprites
  image.sprite.removeChildren();
  for (let subSprite of subspriteImageNames) {
    addSubSprite(image, subSprite);
  }
  // Re-add mask:
  if (image.mask) {
    addMask(image, image.mask);
  }
}
// Caution: this function removes a mask on an image,
// but if you are trying to remove the unit from being
// in liquid, you should use this function THROUGH inLiquid.remove.
// not on it's own.
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
    const mask = addPixiSpriteAnimated(path, image.sprite, { animationSpeed: 0.08, loop: true });
    if (!mask) { return; }
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
const EXCLUDE_WARN_MISSING_SUBSPRITE = ['playerAttack', LIQUID_MASK];
export function addSubSprite(image: IImageAnimated | undefined, imageName: string): PIXI.AnimatedSprite | PIXI.Sprite | undefined {
  if (!image) {
    return;
  }
  // Don't add more than one copy
  if (!getSubspriteImagePaths(image).includes(imageName)) {
    const subSpriteData = Subsprites[imageName];
    if (subSpriteData) {
      const sprite = subSpriteData.imageName.includes('.png')
        ? addPixiSprite(subSpriteData.imageName, image.sprite)
        : addPixiSpriteAnimated(subSpriteData.imageName, image.sprite);
      if (!sprite) { return; }
      sprite.alpha = subSpriteData.alpha;
      sprite.anchor.set(subSpriteData.anchor.x, subSpriteData.anchor.y);
      sprite.scale.set(subSpriteData.scale.x, subSpriteData.scale.y);
      return sprite;
    } else {
      // Squelch warning for missing subsprite for keywords that are not subsprites
      // For example: if you clone yourself it will see that the cast magic is currently a child
      // of your player characters image and try to add it as a subsprite but report it missing.
      // This is okay and can be ignored because it's not a subsprite.  This "if" check prevents
      // the false error reporting.
      if (!EXCLUDE_WARN_MISSING_SUBSPRITE.some(exclude => imageName.includes(exclude))) {
        console.error("Missing subsprite data for imageName", imageName)
      }
      // Special handling for restoring liquid mask since it isn't a regular subsprite
      if (imageName == LIQUID_MASK) {
        addMask(image, LIQUID_MASK);
      }
    }
  }
  return;
}
export function removeSubSprite(image: IImageAnimated | undefined, imagePath: string, squelchError?: boolean) {
  if (!image) {
    return;
  }
  // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
  const subSprite = image.sprite.children.find(c => c.imagePath == imagePath)
  if (subSprite) {
    // Remove PIXI.Sprite instance
    subSprite.parent.removeChild(subSprite);
  } else {
    if (!squelchError) {
      console.log('Cannot remove subsprite', imagePath, 'subsprite is missing from sprite.children');
    }
  }
}
export function show(image?: IImageAnimated) {
  if (image) {
    image.sprite.alpha = 1;
  }
}
export function hide(image?: IImageAnimated) {
  if (image) {
    image.sprite.alpha = 0;
  }
}
interface OneOffOptions {
  doRemoveWhenPrimaryAnimationChanges?: boolean;
  // a numbered frame during which the promise will resolve early (before the end of the animation).
  // The animation will continue to the end, but it will no longer be blocking on await
  keyFrame?: number;
  skipSpyPromise?: boolean;
}
// A one off animation is an animation that is attached to an entity but operates independently of the entity's primary animation and will
// not be affected by changes to the entity's primary animation.  This useful for example for playing a healing animation over top of a entity,
// and the healing animation will continue regardless of wether the entity's primary animations changes or not
export function addOneOffAnimation(imageHaver: any, spritePath: string, oneOffOptions?: OneOffOptions, options?: PixiSpriteOptions): Promise<void> {
  // Play animation and then remove it
  // ---
  // This timeout value is arbitrary, meant to prevent and report an await hang
  // if somehow resolve is never called
  return raceTimeout(6000, `addOneOffAnimation: ${spritePath}`, new Promise<void>((resolve) => {
    if (!hasImage(imageHaver)) {
      return resolve();
    }
    const finishOnFrame = oneOffOptions?.keyFrame;
    const onFrameChange = (isNullOrUndef(finishOnFrame)) ? undefined : (currentFrame: number) => {
      if (currentFrame >= finishOnFrame) {
        resolve();
      }

    }
    const animationSprite = addPixiSpriteAnimated(spritePath, imageHaver.image.sprite, {
      loop: false,
      ...options,
      onFrameChange,
      onComplete: () => {
        if (imageHaver.image && animationSprite) {
          imageHaver.image.sprite.removeChild(animationSprite);
        }
        resolve();
      }
    });
    if (animationSprite) {
      animationSprite.doRemoveWhenPrimaryAnimationChanges = oneOffOptions?.doRemoveWhenPrimaryAnimationChanges || false;
      animationSprite.anchor.set(0.5);
      // exception: lobberProjectile is too high to explode in center
      if (spritePath == 'lobberProjectileHit') {
        animationSprite.anchor.set(0.5, 0.25);
      }
      if (options?.scale) {
        animationSprite.scale.x = options.scale;
        animationSprite.scale.y = options.scale;
      }
    }
    // Resolve if set to loop, since this sprite loops it will never finish animating
    // (well, until it is removed), in which case the promise shouldn't wait for it.
    // It might be misunderstood that this will resolve when the animating sprite is removed
    // but I have no use-case for that at the moment and it would be a bit complicated to implement
    // that so for now I will just resolve immediately if set to loop.
    if (options?.loop) {
      resolve();
    }
  }), { skipSpyPromise: oneOffOptions?.skipSpyPromise });
}