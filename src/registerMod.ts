import { registerSpell } from "./cards";
import { pickups } from "./entity/Pickup";
import { registerUnit } from "./entity/units";
import { Overworld } from "./Overworld";
import { Mod } from "./types/commonTypes";

function registerMod(mod: Mod, overworld: Overworld) {
    // Register Units
    if (mod.units) {
        for (let unit of mod.units) {
            registerUnit(unit);
        }
    }
    // Register Pickups
    if (mod.pickups) {
        for (let pickup of mod.pickups) {
            pickups.push(pickup);
        }
    }
    // Register Spells
    if (mod.spells) {
        for (let spell of mod.spells) {
            registerSpell(spell, overworld);
        }
    }

    if (!globalThis.headless) {

        // Register sfx
        if (sfx && mod.sfx) {
            Object.assign(sfx, mod.sfx);
        }
        if (globalThis.pixi && mod.spritesheet) {
            const loader = globalThis.pixi.Loader.shared;
            loader.add(mod.spritesheet);
        }
    }

}
export default function registerAllMods(overworld: Overworld) {
    for (let mod of mods) {
        console.log('Mod: ', mod.modName);
        registerMod(mod, overworld);
    }

}