import { addPixiSprite, addPixiSpriteAnimated, containerUnits } from "./graphics/PixiUtils";
import { Vec2 } from "./jmath/Vec";

// A 'level up' style beam that is cast down from the sky and fades out on it's own
export function skyBeam(position: Vec2) {
    const whiteCircle = addPixiSprite('half-circle.png', containerUnits)
    if (whiteCircle) {

        whiteCircle.x = position.x;
        whiteCircle.y = position.y;
        whiteCircle.scale.y = 0.75;
        whiteCircle.anchor.set(0.5);
    }

    const animationSprite = addPixiSpriteAnimated('light-beam', containerUnits, {
        loop: true,
        onComplete: () => {
            if (animationSprite?.parent) {
                animationSprite.parent.removeChild(animationSprite);
            }
        }
    });
    if (animationSprite) {

        animationSprite.anchor.set(0.5);
        const beamHeight = 1000;
        animationSprite.scale.y = beamHeight;
        animationSprite.x = position.x
        animationSprite.y = position.y - beamHeight / 2;
        const animateAway = () => {
            animationSprite.alpha *= 0.97
            if (whiteCircle) {
                whiteCircle.alpha = animationSprite.alpha / 2;
            }
            if (animationSprite.alpha > 0.02) {
                requestAnimationFrame(animateAway);
            } else {
                // When done, clean up assets
                animationSprite.parent.removeChild(animationSprite);
                whiteCircle?.parent.removeChild(whiteCircle);
            }
        }
        animateAway();
    }

}