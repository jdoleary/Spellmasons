import { HasSpace } from "./Type"
import * as Image from '../graphics/Image';
import Underworld from "../Underworld";
import { containerUnits } from "../graphics/PixiUtils";
import { Vec2 } from "../jmath/Vec";

export function isDoodad(maybeDoodad: any): maybeDoodad is IDoodad {
    return maybeDoodad && maybeDoodad.type == 'doodad';
}
export type IDoodad = HasSpace & {
    type: 'doodad';
    imagePath: string;
    image?: Image.IImageAnimated;
    // if this IDoodad is a prediction copy, real is a reference to the real doodad that it is a copy of
    real?: IDoodad
}
export function create({ pos, source }:
    {
        pos: Vec2, source: IDoodadSource
    }, underworld: Underworld, prediction: boolean) {
    const { x, y } = pos
    const imagePath = source.imagePath;
    const self: IDoodad = {
        type: 'doodad',
        x,
        y,
        radius: 30,
        imagePath,
        image: (!containerUnits || prediction) ? undefined : Image.create({ x, y }, imagePath, containerUnits, { animationSpeed: 0, loop: true }),
    };

    underworld.addDoodadToArray(self, prediction);

    return self;
}
export function copyForPredictionDoodad(d: IDoodad): IDoodad {
    // Remove image since prediction doodads won't be rendered
    const { image, ...rest } = d;
    return {
        real: d,
        ...rest
    }
}
interface IDoodadSource {
    name: string;
    imagePath: string;
}
export const doodads: IDoodadSource[] = [
    {
        name: 'rock',
        imagePath: 'doodads/boulder_detail',
    },
    {
        name: 'tree',
        imagePath: 'doodads/tree',
    },
    {
        name: 'urn',
        imagePath: 'doodads/urn',
    },
    {
        name: 'ghost_tree',
        imagePath: 'doodads/ghost_tree',
    },
];
export type IDoodadSerialized = Omit<IDoodad, "image" | "real"> & {
    image?: Image.IImageAnimatedSerialized
};
export function serialize(p: IDoodad): IDoodadSerialized {
    const { real, ...rest } = p;
    const serialized: IDoodadSerialized = {
        ...rest,
        image: p.image ? Image.serialize(p.image) : undefined,
    };
    return serialized;
}
// Reinitialize a pickup from another pickup object, this is used in loading game state after reconnect
export function load(doodad: IDoodadSerialized, underworld: Underworld, prediction: boolean): IDoodad | undefined {
    // Get the doodad object
    let foundDoodad = doodads.find((p) => p.imagePath == doodad.imagePath);
    if (foundDoodad) {
        const { image, ...toCopy } = doodad;
        const newPickup = create({ pos: doodad, source: foundDoodad }, underworld, prediction);
        // Note: It is important here to use Object.assign so that the doodad reference is the SAME ref as is created in the
        // create function because the create function passes that ref to the underworld doodads array.
        // So when you mutate the properties, the ref must stay the same.
        Object.assign(newPickup, toCopy);
        return newPickup;
    } else {
        console.error('Could not load doodad with path', doodad.imagePath);
        return undefined;
    }
}