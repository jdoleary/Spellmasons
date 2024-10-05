import { COLLISION_MESH_RADIUS } from "./config";
import { makeLightBeamParticles } from "./graphics/ParticleCollection";
import { addPixiSprite, containerProjectiles, containerSpells, containerUnits } from "./graphics/PixiUtils";
import { equal, Vec2 } from "./jmath/Vec";

// A 'level up' style beam that is cast down from the sky and fades out on it's own
let recentSkybeams: { position: Vec2, time: number }[] = []
const THROTTLE_TIME = 500;
export function skyBeam(position: Vec2) {
    // For whatever reason, many skybeams is expensive,
    // so if multiple are triggered in the exact same position,
    // throttle them.
    const now = Date.now();
    // 500: within 500ms
    if (recentSkybeams.filter(r => equal(r.position, position) && (now - r.time) <= THROTTLE_TIME).length > 2) {
        return;
    }
    // Add this skybeam to the list
    recentSkybeams.push({ position, time: now });
    // Clear skybeam records that are beyond THROTTLE_TIME
    recentSkybeams = recentSkybeams.filter(x => (now - x.time) <= THROTTLE_TIME);


    // Note: This is in containerProjectiles instead of containerSpells
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