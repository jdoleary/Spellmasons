import { COLLISION_MESH_RADIUS } from "./config";
import { makeLightBeamParticles } from "./graphics/ParticleCollection";
import { addPixiSprite, containerProjectiles, containerSpells, containerUnits } from "./graphics/PixiUtils";
import { Vec2 } from "./jmath/Vec";

// A 'level up' style beam that is cast down from the sky and fades out on it's own
export function skyBeam(position: Vec2) {
    // Note: T his is in containerProjectiles instead of containerSpells
    // because containerSpells automatically clears it's contents while
    // containerProjectiles does not.  containerProjectiles's children
    // are expected to clear themselves, which is what the skybeam does
    const whiteCircle = addPixiSprite('half-circle.png', containerProjectiles)
    if (whiteCircle) {
        whiteCircle.x = position.x;
        // + COLLISION_MESH_RADIUS / 2 aligns the beam better with the units's feat
        whiteCircle.y = position.y + COLLISION_MESH_RADIUS / 2;
        whiteCircle.scale.y = 0.75;
        whiteCircle.anchor.set(0.5);
    }

    const lightBeam = addPixiSprite('light-beam.png', whiteCircle);
    if (lightBeam) {
        lightBeam.anchor.set(0.5);
        const beamHeight = 1000;
        lightBeam.scale.y = beamHeight;
        lightBeam.x = 0;
        lightBeam.y = - beamHeight / 2;
        makeLightBeamParticles(position);
        const animateAway = () => {
            if (whiteCircle) {
                whiteCircle.alpha *= 0.97
                // Continue to animate until the alpha is low enought
                if (whiteCircle.alpha > 0.02) {
                    requestAnimationFrame(animateAway);
                } else {
                    // When done, clean up assets
                    lightBeam.parent.removeChild(lightBeam);
                    whiteCircle.parent.removeChild(whiteCircle);
                }
            } else {
                lightBeam.parent.removeChild(lightBeam);
            }
        }
        animateAway();
    }

}