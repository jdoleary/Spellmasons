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

    const lightBeam = addPixiSprite('light-beam.png', containerUnits);
    if (lightBeam) {
        lightBeam.anchor.set(0.5);
        const beamHeight = 1000;
        lightBeam.scale.y = beamHeight;
        lightBeam.x = position.x
        lightBeam.y = position.y - beamHeight / 2;
        const animateAway = () => {
            lightBeam.alpha *= 0.97
            if (whiteCircle) {
                whiteCircle.alpha = lightBeam.alpha / 2;
            }
            // Continue to animate until the alpha is low enought
            if (lightBeam.alpha > 0.02) {
                requestAnimationFrame(animateAway);
            } else {
                // When done, clean up assets
                lightBeam.parent.removeChild(lightBeam);
                whiteCircle?.parent.removeChild(whiteCircle);
            }
        }
        animateAway();
    }

}