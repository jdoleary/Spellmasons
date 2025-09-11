import { registerEvents, registerModifiers, registerSpell } from "./cards";
import { pickups } from "./entity/Pickup";
import { registerUnit } from "./entity/units";
import { handmadeMaps } from "./MapsHandmade";
import { Overworld } from "./Overworld";
import { Mod } from "./types/commonTypes";
type moddedEntity = {
    modName?: string;
};
// Always returns true if a unit doesn't belong to a mod
// If a unit does belong to a mod, only returns true if the mod is active in the underworld
export function isModActive(entity: moddedEntity, underworld: { activeMods: string[] }): boolean {
    return (isNullOrUndef(entity.modName)) || underworld.activeMods.includes(entity.modName);
}

// registeredMods should be unique to each PROCESS (not overworld), so that a headless server does not
// register a mod multiple times.  Note: Activating a mod is recorded in the underworld object, but the
// process itself should always have all mods registered to make them possible to use and should never
// register a mod twice
const registeredMods: { [modName: string]: Mod } = {};
function registerMod(mod: Mod, overworld: Overworld) {
    if (registeredMods[mod.modName]) {
        console.log('Mod already registered, early return so as to not double register.', mod.modName);
        return;
    }
    console.log('Register mod', mod.modName);
    registeredMods[mod.modName] = mod;
    // Register Units
    if (mod.units) {
        for (let unit of mod.units) {
            unit.modName = mod.modName;
            registerUnit(unit);
        }
    }
    // Register Pickups
    if (mod.pickups) {
        for (let pickup of mod.pickups) {
            pickup.modName = mod.modName;
            pickups.push(pickup);
        }
    }
    // Register Spells
    if (mod.spells) {
        for (let spell of mod.spells) {
            spell.card.modName = mod.modName;
            registerSpell(spell, overworld);
        }
    }

    // Register Modifiers
    // Some modifiers are attached to Spells but some
    // like Growth for example can be independent from Spells
    if (mod.modifiers) {
        for (let modifier of mod.modifiers) {
            if (modifier.id) {
                registerModifiers(modifier.id, modifier);
            } else {
                console.error(`A modifier is missing an "id" and cannot be registered!`);
            }
        }
    }

    // Register Events
    if (mod.events) {
        for (let event of mod.events) {
            if (event.id) {
                registerEvents(event.id, event);
            } else {
                console.error(`A modifier is missing an "id" and cannot be registered!`);
            }
        }
    }
    if (mod.maps) {
        handmadeMaps.push(...mod.maps)
    }

    if (mod.familiars) {
        allFamiliars.push(...mod.familiars);
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
    for (let mod of globalThis.mods) {
        console.log('Mod: ', mod.modName);
        registerMod(mod, overworld);
    }
    if (globalThis.pixi) {
        const loader = globalThis.pixi.Loader.shared;
        // Start loading the textures
        loader.load();
    }

}