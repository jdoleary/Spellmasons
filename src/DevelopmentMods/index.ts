import { Mod } from '../types/commonTypes';
import SamplePickup from './SamplePickup';

const developmentMods: Mod[] = [
    SamplePickup
    // Attention Modder!
    // Add your in-progress mod here.
    // See Modding.md for more information
];

// Development mods are only available during
// local development.  See "Publishing Your Mod"
// in Modding.md if you want to make your mod public
if (location.href.includes('localhost')) {
    console.log("Development mods: ON");
    globalThis.mods = globalThis.mods !== undefined ? [...globalThis.mods, ...developmentMods] : developmentMods;
}

export default developmentMods;